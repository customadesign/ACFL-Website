const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestAccounts() {
  console.log('\n========================================');
  console.log('🚀 CREATING TEST USER ACCOUNTS');
  console.log('========================================');

  try {
    const saltRounds = 12;

    // Test coach
    console.log('\n🧪 Creating/updating test coach...');
    const testCoachPassword = await bcrypt.hash('coach123', saltRounds);
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .upsert({
        email: 'coach@acfl.com',
        first_name: 'Test',
        last_name: 'Coach',
        password_hash: testCoachPassword,
        bio: 'Test coach for demonstration',
        is_available: true,
        years_experience: 5,
        qualifications: ['Certified ACT Coach'],
        specialties: ['Anxiety', 'Depression'],
        languages: ['English'],
        rating: 4.8,
        status: 'active'
      }, { onConflict: 'email' })
      .select();

    if (coachError) {
      console.error('❌ Failed to create test coach:', coachError);
    } else {
      console.log('✅ Test coach created/updated: coach@acfl.com / coach123');
    }

    // Test client
    console.log('\n🧪 Creating/updating test client...');
    const testClientPassword = await bcrypt.hash('client123', saltRounds);
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .upsert({
        email: 'client@acfl.com',
        first_name: 'Test',
        last_name: 'Client',
        password_hash: testClientPassword,
        status: 'active'
      }, { onConflict: 'email' })
      .select();

    if (clientError) {
      console.error('❌ Failed to create test client:', clientError);
    } else {
      console.log('✅ Test client created/updated: client@acfl.com / client123');
    }

    console.log('\n========================================');
    console.log('✅ TEST ACCOUNTS SETUP COMPLETED');
    console.log('========================================');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@acfl.com / admin123');
    console.log('Coach: coach@acfl.com / coach123');
    console.log('Client: client@acfl.com / client123');
    console.log('\n========================================\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the script
createTestAccounts();