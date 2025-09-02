import { supabase } from '../lib/supabase';
import emailService from './emailService';

class FollowUpService {
  
  // Send follow-up emails for incomplete applications
  async sendIncompleteApplicationFollowUps() {
    try {
      console.log('🔄 Starting follow-up email process...');
      
      // Find applications that are older than 24 hours but not completed
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: incompleteApplications, error } = await supabase
        .from('coach_applications')
        .select('*')
        .eq('status', 'pending')
        .lt('submitted_at', twentyFourHoursAgo)
        .gt('submitted_at', sevenDaysAgo); // Don't send to very old applications

      if (error) {
        throw error;
      }

      if (!incompleteApplications || incompleteApplications.length === 0) {
        console.log('✅ No incomplete applications found for follow-up');
        return { success: true, sent: 0 };
      }

      console.log(`📧 Found ${incompleteApplications.length} applications for follow-up`);

      let sentCount = 0;
      let errorCount = 0;

      for (const application of incompleteApplications) {
        try {
          // Check if we've already sent a follow-up recently
          const { data: recentReviews } = await supabase
            .from('coach_application_reviews')
            .select('*')
            .eq('application_id', application.id)
            .eq('action', 'follow_up_sent')
            .gte('created_at', twentyFourHoursAgo);

          if (recentReviews && recentReviews.length > 0) {
            console.log(`⏭️ Skipping ${application.email} - follow-up already sent recently`);
            continue;
          }

          // Calculate days remaining (assuming 30-day expiration)
          const submittedDate = new Date(application.submitted_at);
          const expirationDate = new Date(submittedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          const daysRemaining = Math.ceil((expirationDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

          if (daysRemaining <= 0) {
            console.log(`⏰ Application ${application.id} has expired, skipping follow-up`);
            continue;
          }

          // Send follow-up email
          const emailResult = await emailService.sendFollowUpEmail({
            email: application.email,
            first_name: application.first_name,
            application_id: application.id,
            days_remaining: daysRemaining
          });

          if (emailResult.success) {
            // Log the follow-up in audit trail
            await supabase
              .from('coach_application_reviews')
              .insert([{
                application_id: application.id,
                reviewer_id: null, // System action
                action: 'follow_up_sent',
                previous_status: application.status,
                new_status: application.status,
                notes: `Follow-up email sent - ${daysRemaining} days remaining`,
                created_at: new Date().toISOString()
              }]);

            sentCount++;
            console.log(`✅ Follow-up sent to ${application.email}`);
          } else {
            errorCount++;
            console.log(`❌ Failed to send follow-up to ${application.email}:`, emailResult.error);
          }

        } catch (error) {
          errorCount++;
          console.error(`❌ Error processing follow-up for ${application.email}:`, error);
        }
      }

      console.log(`📊 Follow-up process completed: ${sentCount} sent, ${errorCount} errors`);

      return {
        success: true,
        sent: sentCount,
        errors: errorCount,
        total: incompleteApplications.length
      };

    } catch (error) {
      console.error('❌ Follow-up service error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send reminder emails for applications under review for too long
  async sendReviewReminderEmails() {
    try {
      console.log('🔄 Checking for applications under review too long...');
      
      // Find applications under review for more than 5 days
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: stalledApplications, error } = await supabase
        .from('coach_applications')
        .select('*')
        .eq('status', 'under_review')
        .lt('updated_at', fiveDaysAgo);

      if (error) {
        throw error;
      }

      if (!stalledApplications || stalledApplications.length === 0) {
        console.log('✅ No stalled applications found');
        return { success: true, sent: 0 };
      }

      console.log(`⏰ Found ${stalledApplications.length} stalled applications`);

      // This would typically send internal notifications to admins
      // For now, we'll just log them
      stalledApplications.forEach(app => {
        console.log(`⚠️ Application ${app.id} (${app.email}) has been under review since ${app.updated_at}`);
      });

      return {
        success: true,
        stalledCount: stalledApplications.length
      };

    } catch (error) {
      console.error('❌ Review reminder service error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Clean up expired applications
  async cleanupExpiredApplications() {
    try {
      console.log('🧹 Cleaning up expired applications...');
      
      // Find applications older than 30 days that are still pending
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: expiredApplications, error } = await supabase
        .from('coach_applications')
        .select('*')
        .eq('status', 'pending')
        .lt('submitted_at', thirtyDaysAgo);

      if (error) {
        throw error;
      }

      if (!expiredApplications || expiredApplications.length === 0) {
        console.log('✅ No expired applications found');
        return { success: true, cleaned: 0 };
      }

      console.log(`🗑️ Found ${expiredApplications.length} expired applications`);

      // Update status to 'expired' instead of deleting
      const { error: updateError } = await supabase
        .from('coach_applications')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .in('id', expiredApplications.map(app => app.id));

      if (updateError) {
        throw updateError;
      }

      // Log cleanup actions
      for (const app of expiredApplications) {
        await supabase
          .from('coach_application_reviews')
          .insert([{
            application_id: app.id,
            reviewer_id: null, // System action
            action: 'expired',
            previous_status: 'pending',
            new_status: 'expired',
            notes: 'Application expired after 30 days',
            created_at: new Date().toISOString()
          }]);
      }

      console.log(`✅ Cleaned up ${expiredApplications.length} expired applications`);

      return {
        success: true,
        cleaned: expiredApplications.length
      };

    } catch (error) {
      console.error('❌ Cleanup service error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new FollowUpService();