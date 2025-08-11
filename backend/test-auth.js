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

async function testAuth() {
  console.log('Testing Supabase Auth signup...');
  
  try {
    // Test signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'testuser@gmail.com',
      password: 'Password123',
    });

    console.log('Auth signup result:');
    console.log('Data:', JSON.stringify(authData, null, 2));
    console.log('Error:', authError);

    if (authData.user) {
      console.log('\nTrying to create client profile...');
      
      // Test client profile creation
      const { error: profileError } = await supabase
        .from('clients')
        .insert({
          id: authData.user.id,
          email: 'testuser@gmail.com',
          first_name: 'Test',
          last_name: 'User',
          phone: '555-0123',
          dob: '1990-01-01',
          created_at: new Date().toISOString()
        });

      console.log('Profile creation error:', profileError);
      
      // Clean up - delete the test user
      if (authData.user.id) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('Cleaned up test user');
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuth();