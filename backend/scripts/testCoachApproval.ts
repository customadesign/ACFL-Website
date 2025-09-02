import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCoachApproval() {
  console.log('🧪 Testing Coach Application Approval Flow\n');

  try {
    // Step 1: Find a pending coach application
    console.log('🔍 Looking for pending coach applications...');
    const { data: pendingApps, error: fetchError } = await supabase
      .from('coach_applications')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingApps || pendingApps.length === 0) {
      console.log('❌ No pending applications found.');
      console.log('💡 Submit a test application first using: npx ts-node scripts/testCoachApplication.ts');
      return;
    }

    const application = pendingApps[0];
    console.log('✅ Found pending application:');
    console.log(`- ID: ${application.id}`);
    console.log(`- Name: ${application.first_name} ${application.last_name}`);
    console.log(`- Email: ${application.email}`);
    console.log(`- Expertise: ${application.coaching_expertise?.join(', ') || 'None'}`);

    // Step 2: Check if coaches table has user_id column
    console.log('\n🔍 Checking coaches table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('coaches')
      .select('*')
      .limit(0); // Just to check structure

    if (tableError) {
      console.log('❌ Error accessing coaches table:', tableError.message);
      console.log('💡 Make sure you ran the migration SQL in Supabase!');
      return;
    }

    // Step 3: Simulate approval by directly calling the update endpoint
    console.log('\n✅ Simulating application approval...');
    
    // Instead of making HTTP request, directly call the approval logic
    // This simulates what happens when admin approves in the UI
    
    const API_URL = process.env.API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${API_URL}/api/coach-applications/applications/${application.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'approved',
        reviewerId: 'test-admin-123',
        reason: 'Test approval - meets all requirements'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Approval failed:', errorData.message);
      console.log('Full error:', errorData);
      return;
    }

    console.log('✅ Application approved successfully!');
    
    // Step 4: Check if coach profile was created
    console.log('\n🔍 Checking if coach profile was created...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const { data: newCoaches, error: coachError } = await supabase
      .from('coaches')
      .select('*')
      .eq('email', application.email);

    if (coachError) {
      console.log('❌ Error checking coach profiles:', coachError);
      return;
    }

    if (newCoaches && newCoaches.length > 0) {
      const coach = newCoaches[0];
      console.log('✅ Coach profile created successfully!');
      console.log(`- Coach ID: ${coach.id}`);
      console.log(`- Name: ${coach.first_name} ${coach.last_name}`);
      console.log(`- Email: ${coach.email}`);
      console.log(`- User ID: ${coach.user_id || 'Not set'}`);
      console.log(`- Specialties: ${coach.specialties?.join(', ') || 'None'}`);
      console.log(`- Languages: ${coach.languages?.join(', ') || 'None'}`);
      console.log(`- Available: ${coach.is_available}`);
      console.log(`- Rate: $${coach.hourly_rate_usd || 'Not set'}/hour`);
      
      // Check if auth user was created
      if (coach.user_id) {
        console.log('\n🔍 Checking auth user account...');
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(coach.user_id);
        
        if (authUser?.user) {
          console.log('✅ Auth user account found:');
          console.log(`- Auth ID: ${authUser.user.id}`);
          console.log(`- Email: ${authUser.user.email}`);
          console.log(`- Confirmed: ${authUser.user.email_confirmed_at ? 'Yes' : 'No'}`);
          console.log(`- User type: ${authUser.user.user_metadata?.user_type || 'Not set'}`);
        } else {
          console.log('❌ Auth user not found or error:', authError?.message);
        }
      }
      
    } else {
      console.log('❌ Coach profile was not created');
    }

    // Step 5: Check application status
    console.log('\n🔍 Checking updated application status...');
    const { data: updatedApp, error: appError } = await supabase
      .from('coach_applications')
      .select('*')
      .eq('id', application.id)
      .single();

    if (updatedApp) {
      console.log('✅ Application status updated:');
      console.log(`- Status: ${updatedApp.status}`);
      console.log(`- Reviewed at: ${updatedApp.reviewed_at || 'Not set'}`);
      console.log(`- Reviewed by: ${updatedApp.reviewed_by || 'Not set'}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCoachApproval().then(() => {
  console.log('\n🏁 Test complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});