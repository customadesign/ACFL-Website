import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCoachApplications() {
  console.log('🔍 Checking coach applications in database...\n');

  try {
    // Get all coach applications
    const { data: applications, error, count } = await supabase
      .from('coach_applications')
      .select('*', { count: 'exact' })
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching applications:', error);
      return;
    }

    console.log(`📊 Total applications found: ${count || 0}\n`);

    if (!applications || applications.length === 0) {
      console.log('No coach applications found in the database.');
      console.log('\n💡 To test the coach application flow:');
      console.log('1. Go to http://localhost:3000/register/coach');
      console.log('2. Click "Start Coach Application"');
      console.log('3. Fill out the complete verification form');
      console.log('4. Submit the application');
      console.log('5. Check the admin panel at http://localhost:3000/admin/coach-applications');
      return;
    }

    // Display each application
    applications.forEach((app, index) => {
      console.log(`\n========== Application ${index + 1} ==========`);
      console.log(`Name: ${app.first_name} ${app.last_name}`);
      console.log(`Email: ${app.email}`);
      console.log(`Status: ${app.status}`);
      console.log(`Submitted: ${app.submitted_at}`);
      
      console.log('\n📚 Specialization & Expertise:');
      console.log(`Coaching Expertise (${app.coaching_expertise?.length || 0} areas):`);
      if (app.coaching_expertise && app.coaching_expertise.length > 0) {
        app.coaching_expertise.forEach((expertise: string) => {
          console.log(`  - ${expertise}`);
        });
      } else {
        console.log('  (No expertise areas specified)');
      }
      
      console.log(`\nAge Groups: ${app.age_groups_comfortable?.join(', ') || '(None specified)'}`);
      console.log(`ACT Training: ${app.act_training_level || '(Not specified)'}`);
      console.log(`Languages: ${app.languages_fluent?.join(', ') || '(None specified)'}`);
      console.log(`Experience: ${app.coaching_experience_years || '(Not specified)'}`);
    });

    // Check for applications with missing expertise data
    const missingExpertise = applications.filter(app => 
      !app.coaching_expertise || app.coaching_expertise.length === 0
    );

    if (missingExpertise.length > 0) {
      console.log(`\n⚠️  ${missingExpertise.length} applications have missing expertise data`);
      console.log('These may be legacy applications or incomplete submissions.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkCoachApplications().then(() => {
  console.log('\n✅ Check complete');
  process.exit(0);
});