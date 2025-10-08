import { supabase } from '../lib/supabase';
import { createObjectCsvWriter } from 'csv-writer';
import * as htmlPdf from 'html-pdf-node';
import * as fs from 'fs';
import * as path from 'path';

export interface ExportOptions {
  format: 'csv' | 'pdf';
  userId: string;
  userType: 'client' | 'coach';
  includePersonalData?: boolean;
  includeActivityData?: boolean;
  includeMessagesData?: boolean;
  includeSessionsData?: boolean;
}

export class DataExportService {
  private async getClientData(userId: string) {
    // Get client profile data
    const { data: clientProfile, error: profileError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch client profile: ${profileError.message}`);
    }

    // Get client sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        *,
        coaches (
          first_name,
          last_name,
          email
        )
      `)
      .eq('client_id', userId);

    if (sessionsError) {
      console.warn('Failed to fetch sessions:', sessionsError.message);
    }

    // Get client messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.warn('Failed to fetch messages:', messagesError.message);
    }

    // Get saved coaches
    const { data: savedCoaches, error: savedError } = await supabase
      .from('saved_coaches')
      .select(`
        *,
        coaches (
          first_name,
          last_name,
          email
        )
      `)
      .eq('client_id', userId);

    if (savedError) {
      console.warn('Failed to fetch saved coaches:', savedError.message);
    }

    // Get search history
    const { data: searchHistory, error: searchError } = await supabase
      .from('search_history')
      .select('*')
      .eq('client_id', userId)
      .order('created_at', { ascending: false });

    if (searchError) {
      console.warn('Failed to fetch search history:', searchError.message);
    }

    // Get reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        *,
        coaches (
          first_name,
          last_name
        )
      `)
      .eq('client_id', userId);

    if (reviewsError) {
      console.warn('Failed to fetch reviews:', reviewsError.message);
    }

    return {
      profile: clientProfile,
      sessions: sessions || [],
      messages: messages || [],
      savedCoaches: savedCoaches || [],
      searchHistory: searchHistory || [],
      reviews: reviews || []
    };
  }

  private async getCoachData(userId: string) {
    // Get coach profile data
    const { data: coachProfile, error: profileError } = await supabase
      .from('coaches')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch coach profile: ${profileError.message}`);
    }

    // Get coach demographics
    const { data: demographics, error: demoError } = await supabase
      .from('coach_demographics')
      .select('*')
      .eq('coach_id', userId)
      .single();

    if (demoError) {
      console.warn('Failed to fetch demographics:', demoError.message);
    }

    // Get coach sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        *,
        clients (
          first_name,
          last_name,
          email
        )
      `)
      .eq('coach_id', userId);

    if (sessionsError) {
      console.warn('Failed to fetch sessions:', sessionsError.message);
    }

    // Get coach messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.warn('Failed to fetch messages:', messagesError.message);
    }

    // Get reviews received
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        *,
        clients (
          first_name,
          last_name
        )
      `)
      .eq('coach_id', userId);

    if (reviewsError) {
      console.warn('Failed to fetch reviews:', reviewsError.message);
    }

    return {
      profile: coachProfile,
      demographics: demographics || {},
      sessions: sessions || [],
      messages: messages || [],
      reviews: reviews || []
    };
  }

  private async generateCSV(data: any, userType: 'client' | 'coach', userId: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${userType}-data-export-${timestamp}.csv`;
    const filePath = path.join(__dirname, '../../exports', fileName);

    // Ensure exports directory exists
    const exportDir = path.dirname(filePath);
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    if (userType === 'client') {
      // Create CSV for client data
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'type', title: 'Data Type' },
          { id: 'id', title: 'ID' },
          { id: 'date', title: 'Date' },
          { id: 'details', title: 'Details' },
          { id: 'status', title: 'Status' },
          { id: 'additional_info', title: 'Additional Info' }
        ]
      });

      const records = [];

      // Profile data
      records.push({
        type: 'Profile',
        id: data.profile.id,
        date: data.profile.created_at,
        details: `Name: ${data.profile.first_name} ${data.profile.last_name}, Email: ${data.profile.email}`,
        status: 'Active',
        additional_info: `Location: ${data.profile.location_state || 'Not specified'}, Phone: ${data.profile.phone || 'Not provided'}`
      });

      // Sessions data
      data.sessions.forEach((session: any) => {
        records.push({
          type: 'Session',
          id: session.id,
          date: session.starts_at,
          details: `Session with ${session.coaches?.first_name} ${session.coaches?.last_name}`,
          status: session.status,
          additional_info: `Duration: ${session.duration || 60} minutes, Notes: ${session.notes || 'None'}`
        });
      });

      // Messages data
      data.messages.forEach((message: any) => {
        records.push({
          type: 'Message',
          id: message.id,
          date: message.created_at,
          details: `Message: ${(message.body || '').substring(0, 100)}...`,
          status: message.sender_id === userId ? 'Sent' : 'Received',
          additional_info: `Read: ${message.read_at ? 'Yes' : 'No'}`
        });
      });

      // Saved coaches data
      data.savedCoaches.forEach((saved: any) => {
        records.push({
          type: 'Saved Coach',
          id: saved.coach_id,
          date: saved.saved_at,
          details: `Saved: ${saved.coaches?.first_name} ${saved.coaches?.last_name}`,
          status: 'Active',
          additional_info: `Email: ${saved.coaches?.email || 'Not provided'}`
        });
      });

      // Reviews data
      data.reviews.forEach((review: any) => {
        records.push({
          type: 'Review',
          id: review.id,
          date: review.created_at,
          details: `Review for ${review.coaches?.first_name} ${review.coaches?.last_name}`,
          status: `${review.rating} stars`,
          additional_info: `Comment: ${review.comment || 'No comment'}`
        });
      });

      await csvWriter.writeRecords(records);
    } else {
      // Create CSV for coach data
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'type', title: 'Data Type' },
          { id: 'id', title: 'ID' },
          { id: 'date', title: 'Date' },
          { id: 'details', title: 'Details' },
          { id: 'status', title: 'Status' },
          { id: 'additional_info', title: 'Additional Info' }
        ]
      });

      const records = [];

      // Profile data
      records.push({
        type: 'Profile',
        id: data.profile.id,
        date: data.profile.created_at,
        details: `Name: ${data.profile.first_name} ${data.profile.last_name}, Email: ${data.profile.email}`,
        status: data.profile.is_available ? 'Available' : 'Unavailable',
        additional_info: `Specialties: ${(data.profile.specialties || []).join(', ')}, Languages: ${(data.profile.languages || []).join(', ')}`
      });

      // Sessions data
      data.sessions.forEach((session: any) => {
        records.push({
          type: 'Session',
          id: session.id,
          date: session.starts_at,
          details: `Session with ${session.clients?.first_name} ${session.clients?.last_name}`,
          status: session.status,
          additional_info: `Duration: ${session.duration || 60} minutes, Notes: ${session.notes || 'None'}`
        });
      });

      // Messages data
      data.messages.forEach((message: any) => {
        records.push({
          type: 'Message',
          id: message.id,
          date: message.created_at,
          details: `Message: ${(message.body || '').substring(0, 100)}...`,
          status: message.sender_id === userId ? 'Sent' : 'Received',
          additional_info: `Read: ${message.read_at ? 'Yes' : 'No'}`
        });
      });

      // Reviews data
      data.reviews.forEach((review: any) => {
        records.push({
          type: 'Review Received',
          id: review.id,
          date: review.created_at,
          details: `Review from ${review.clients?.first_name} ${review.clients?.last_name}`,
          status: `${review.rating} stars`,
          additional_info: `Comment: ${review.comment || 'No comment'}`
        });
      });

      await csvWriter.writeRecords(records);
    }

    return filePath;
  }

  private async generatePDF(data: any, userType: 'client' | 'coach', userId: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${userType}-data-export-${timestamp}.pdf`;
    const filePath = path.join(__dirname, '../../exports', fileName);

    // Ensure exports directory exists
    const exportDir = path.dirname(filePath);
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    let htmlContent = '';

    if (userType === 'client') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Client Data Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #2563eb; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .section { margin: 30px 0; }
          </style>
        </head>
        <body>
          <h1>Personal Data Export</h1>
          <p><strong>Export Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Export Type:</strong> Client Data</p>

          <div class="section">
            <h2>Profile Information</h2>
            <table>
              <tr><th>Field</th><th>Value</th></tr>
              <tr><td>Name</td><td>${data.profile.first_name} ${data.profile.last_name}</td></tr>
              <tr><td>Email</td><td>${data.profile.email}</td></tr>
              <tr><td>Phone</td><td>${data.profile.phone || 'Not provided'}</td></tr>
              <tr><td>Location</td><td>${data.profile.location_state || 'Not specified'}</td></tr>
              <tr><td>Created</td><td>${new Date(data.profile.created_at).toLocaleDateString()}</td></tr>
              <tr><td>Gender Identity</td><td>${data.profile.gender_identity || 'Not specified'}</td></tr>
              <tr><td>Ethnic Identity</td><td>${data.profile.ethnic_identity || 'Not specified'}</td></tr>
              <tr><td>Religious Background</td><td>${data.profile.religious_background || 'Not specified'}</td></tr>
              <tr><td>Preferred Language</td><td>${data.profile.preferred_language || 'Not specified'}</td></tr>
            </table>
          </div>

          <div class="section">
            <h2>Sessions (${data.sessions.length})</h2>
            <table>
              <tr><th>Date</th><th>Coach</th><th>Status</th><th>Duration</th><th>Notes</th></tr>
              ${data.sessions.map((session: any) => `
                <tr>
                  <td>${new Date(session.starts_at).toLocaleDateString()}</td>
                  <td>${session.coaches?.first_name} ${session.coaches?.last_name}</td>
                  <td>${session.status}</td>
                  <td>${session.duration || 60} min</td>
                  <td>${session.notes || 'None'}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <h2>Messages (${data.messages.length})</h2>
            <table>
              <tr><th>Date</th><th>Direction</th><th>Content</th><th>Read</th></tr>
              ${data.messages.slice(0, 50).map((message: any) => `
                <tr>
                  <td>${new Date(message.created_at).toLocaleDateString()}</td>
                  <td>${message.sender_id === userId ? 'Sent' : 'Received'}</td>
                  <td>${(message.body || '').substring(0, 100)}...</td>
                  <td>${message.read_at ? 'Yes' : 'No'}</td>
                </tr>
              `).join('')}
            </table>
            ${data.messages.length > 50 ? `<p><em>Showing first 50 messages out of ${data.messages.length} total.</em></p>` : ''}
          </div>

          <div class="section">
            <h2>Saved Coaches (${data.savedCoaches.length})</h2>
            <table>
              <tr><th>Date Saved</th><th>Coach Name</th><th>Email</th></tr>
              ${data.savedCoaches.map((saved: any) => `
                <tr>
                  <td>${new Date(saved.saved_at).toLocaleDateString()}</td>
                  <td>${saved.coaches?.first_name} ${saved.coaches?.last_name}</td>
                  <td>${saved.coaches?.email || 'Not provided'}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <h2>Reviews (${data.reviews.length})</h2>
            <table>
              <tr><th>Date</th><th>Coach</th><th>Rating</th><th>Comment</th></tr>
              ${data.reviews.map((review: any) => `
                <tr>
                  <td>${new Date(review.created_at).toLocaleDateString()}</td>
                  <td>${review.coaches?.first_name} ${review.coaches?.last_name}</td>
                  <td>${review.rating} stars</td>
                  <td>${review.comment || 'No comment'}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        </body>
        </html>
      `;
    } else {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Coach Data Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #2563eb; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .section { margin: 30px 0; }
          </style>
        </head>
        <body>
          <h1>Personal Data Export</h1>
          <p><strong>Export Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Export Type:</strong> Coach Data</p>

          <div class="section">
            <h2>Profile Information</h2>
            <table>
              <tr><th>Field</th><th>Value</th></tr>
              <tr><td>Name</td><td>${data.profile.first_name} ${data.profile.last_name}</td></tr>
              <tr><td>Email</td><td>${data.profile.email}</td></tr>
              <tr><td>Phone</td><td>${data.profile.phone || 'Not provided'}</td></tr>
              <tr><td>Bio</td><td>${data.profile.bio || 'Not provided'}</td></tr>
              <tr><td>Specialties</td><td>${(data.profile.specialties || []).join(', ')}</td></tr>
              <tr><td>Languages</td><td>${(data.profile.languages || []).join(', ')}</td></tr>
              <tr><td>Experience</td><td>${data.profile.experience || 'Not specified'}</td></tr>
              <tr><td>Hourly Rate</td><td>$${data.profile.hourly_rate || 'Not specified'}</td></tr>
              <tr><td>Available</td><td>${data.profile.is_available ? 'Yes' : 'No'}</td></tr>
              <tr><td>Created</td><td>${new Date(data.profile.created_at).toLocaleDateString()}</td></tr>
            </table>
          </div>

          <div class="section">
            <h2>Sessions (${data.sessions.length})</h2>
            <table>
              <tr><th>Date</th><th>Client</th><th>Status</th><th>Duration</th><th>Notes</th></tr>
              ${data.sessions.map((session: any) => `
                <tr>
                  <td>${new Date(session.starts_at).toLocaleDateString()}</td>
                  <td>${session.clients?.first_name} ${session.clients?.last_name}</td>
                  <td>${session.status}</td>
                  <td>${session.duration || 60} min</td>
                  <td>${session.notes || 'None'}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <h2>Messages (${data.messages.length})</h2>
            <table>
              <tr><th>Date</th><th>Direction</th><th>Content</th><th>Read</th></tr>
              ${data.messages.slice(0, 50).map((message: any) => `
                <tr>
                  <td>${new Date(message.created_at).toLocaleDateString()}</td>
                  <td>${message.sender_id === userId ? 'Sent' : 'Received'}</td>
                  <td>${(message.body || '').substring(0, 100)}...</td>
                  <td>${message.read_at ? 'Yes' : 'No'}</td>
                </tr>
              `).join('')}
            </table>
            ${data.messages.length > 50 ? `<p><em>Showing first 50 messages out of ${data.messages.length} total.</em></p>` : ''}
          </div>

          <div class="section">
            <h2>Reviews Received (${data.reviews.length})</h2>
            <table>
              <tr><th>Date</th><th>Client</th><th>Rating</th><th>Comment</th></tr>
              ${data.reviews.map((review: any) => `
                <tr>
                  <td>${new Date(review.created_at).toLocaleDateString()}</td>
                  <td>${review.clients?.first_name} ${review.clients?.last_name}</td>
                  <td>${review.rating} stars</td>
                  <td>${review.comment || 'No comment'}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        </body>
        </html>
      `;
    }

    const options = {
      format: 'A4',
      border: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    };

    const file = { content: htmlContent };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);

    fs.writeFileSync(filePath, pdfBuffer);

    return filePath;
  }

  async exportUserData(options: ExportOptions): Promise<string> {
    try {
      let data;

      if (options.userType === 'client') {
        data = await this.getClientData(options.userId);
      } else {
        data = await this.getCoachData(options.userId);
      }

      if (options.format === 'csv') {
        return await this.generateCSV(data, options.userType, options.userId);
      } else {
        return await this.generatePDF(data, options.userType, options.userId);
      }
    } catch (error) {
      console.error('Export error:', error);
      throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async scheduleAccountDeletion(userId: string, userType: 'client' | 'coach'): Promise<void> {
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30); // 30 days from now

    try {
      // Create a record in account_deletions table
      const { error: insertError } = await supabase
        .from('account_deletions')
        .insert({
          user_id: userId,
          user_type: userType,
          deactivated_at: new Date().toISOString(),
          scheduled_deletion_at: deletionDate.toISOString(),
          status: 'scheduled'
        });

      if (insertError) {
        throw insertError;
      }

      // Deactivate the account immediately
      if (userType === 'client') {
        await supabase
          .from('clients')
          .update({
            is_active: false,
            status: 'inactive',
            deactivated_at: new Date().toISOString()
          })
          .eq('id', userId);
      } else {
        await supabase
          .from('coaches')
          .update({
            is_available: false,
            is_active: false,
            status: 'inactive',
            deactivated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }

      console.log(`Account deactivation scheduled for user ${userId} (${userType}), deletion date: ${deletionDate.toISOString()}`);
    } catch (error) {
      console.error('Account deactivation error:', error);
      throw new Error(`Failed to schedule account deletion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelAccountDeletion(userId: string, userType: 'client' | 'coach'): Promise<void> {
    try {
      // Remove the deletion record
      const { error: deleteError } = await supabase
        .from('account_deletions')
        .delete()
        .eq('user_id', userId)
        .eq('user_type', userType)
        .eq('status', 'scheduled');

      if (deleteError) {
        throw deleteError;
      }

      // Reactivate the account
      if (userType === 'client') {
        await supabase
          .from('clients')
          .update({
            is_active: true,
            status: 'active',
            deactivated_at: null
          })
          .eq('id', userId);
      } else {
        await supabase
          .from('coaches')
          .update({
            is_available: true,
            is_active: true,
            status: 'active',
            deactivated_at: null
          })
          .eq('id', userId);
      }

      console.log(`Account deletion cancelled for user ${userId} (${userType})`);
    } catch (error) {
      console.error('Account reactivation error:', error);
      throw new Error(`Failed to cancel account deletion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAccountDeletionStatus(userId: string, userType: 'client' | 'coach'): Promise<any> {
    const { data, error } = await supabase
      .from('account_deletions')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('status', 'scheduled')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }
}

export const dataExportService = new DataExportService();