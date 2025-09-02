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

async function createDefaultAdmin() {
  console.log('\n========================================');
  console.log('🚀 CREATING DEFAULT ADMIN USER');
  console.log('========================================');

  try {
    // Check if admins table exists and if default admin already exists
    console.log('\n🔍 Checking for existing admin...');
    
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admins')
      .select('id, email')
      .eq('email', 'admin@acfl.com')
      .single();

    if (existingAdmin) {
      console.log('✅ Default admin already exists');
      console.log('Email: admin@acfl.com');
      console.log('ID:', existingAdmin.id);
      return;
    }

    // Create default admin
    console.log('\n💾 Creating default admin user...');
    
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    const adminData = {
      email: 'admin@acfl.com',
      first_name: 'Admin',
      last_name: 'User',
      password_hash: hashedPassword,
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString()
    };

    const { data: admin, error: createError } = await supabase
      .from('admins')
      .insert(adminData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create admin:', createError);
      throw createError;
    }

    console.log('✅ Default admin created successfully!');
    console.log('\n📋 Admin Details:');
    console.log('Email: admin@acfl.com');
    console.log('Password: admin123');
    console.log('ID:', admin.id);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');

    // Also create some test users for demonstration
    console.log('\n🧪 Creating test users...');
    
    // Test coach
    const testCoachPassword = await bcrypt.hash('coach123', saltRounds);
    const { error: coachError } = await supabase
      .from('coaches')
      .upsert({
        email: 'coach@acfl.com',
        first_name: 'Test',
        last_name: 'Coach',
        password_hash: testCoachPassword,
        bio: 'Test coach for demonstration',
        is_available: true,
        years_experience: 5,
        hourly_rate_usd: 100,
        qualifications: ['Certified ACT Coach'],
        specialties: ['Anxiety', 'Depression'],
        languages: ['English'],
        rating: 4.8
      }, { onConflict: 'email' });

    if (!coachError) {
      console.log('✅ Test coach created: coach@acfl.com / coach123');
    }

    // Test client
    const testClientPassword = await bcrypt.hash('client123', saltRounds);
    const { error: clientError } = await supabase
      .from('clients')
      .upsert({
        email: 'client@acfl.com',
        first_name: 'Test',
        last_name: 'Client',
        password_hash: testClientPassword
      }, { onConflict: 'email' });

    if (!clientError) {
      console.log('✅ Test client created: client@acfl.com / client123');
    }

    console.log('\n========================================');
    console.log('✅ SETUP COMPLETED SUCCESSFULLY');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the script
createDefaultAdmin();