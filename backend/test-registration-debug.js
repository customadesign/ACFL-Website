const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testRegistrationStep() {
  console.log('=== TESTING REGISTRATION STEP BY STEP ===\n');
  
  try {
    const testEmail = 'debugtest@gmail.com';
    const testPassword = 'Password123';
    
    console.log('1. Testing Supabase Auth signup...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (authError) {
      console.log('❌ Auth signup failed:', authError.message);
      return;
    }

    if (!authData.user) {
      console.log('❌ No user returned from auth signup');
      return;
    }

    console.log('✅ Auth signup successful');
    console.log('User ID:', authData.user.id);
    console.log('Email:', authData.user.email);
    
    console.log('\n2. Testing client profile creation...');
    const { error: profileError } = await supabase
      .from('clients')
      .insert({
        id: authData.user.id,
        email: testEmail,
        first_name: 'Debug',
        last_name: 'Test',
        phone: null,
        dob: null,
      });

    if (profileError) {
      console.log('❌ Client profile creation failed:', profileError.message);
      console.log('Error details:', profileError);
      
      // Clean up auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return;
    }

    console.log('✅ Client profile created successfully');
    
    console.log('\n3. Testing profile retrieval...');
    const { data: clientProfile, error: retrieveError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (retrieveError) {
      console.log('❌ Profile retrieval failed:', retrieveError.message);
    } else {
      console.log('✅ Profile retrieved successfully');
      console.log('Profile:', clientProfile);
    }
    
    // Clean up
    console.log('\n4. Cleaning up test data...');
    await supabase.from('clients').delete().eq('id', authData.user.id);
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.log('✅ Cleanup complete');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRegistrationStep();