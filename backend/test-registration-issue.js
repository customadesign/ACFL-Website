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

async function testRegistrationIssue() {
  console.log('=== DEBUGGING REGISTRATION ISSUE ===\n');
  
  const testEmail = 'brandnew@gmail.com';
  
  try {
    console.log('1. Testing client table query...');
    console.log('Looking for email:', testEmail);
    
    // This is what the registration endpoint does first
    const { data: existingClient, error: queryError } = await supabase
      .from('clients')
      .select('id, email')
      .eq('email', testEmail)
      .single();

    console.log('Query result:');
    console.log('- Data:', existingClient);
    console.log('- Error:', queryError);
    
    if (queryError) {
      // Check what kind of error
      if (queryError.code === 'PGRST116') {
        console.log('✅ No matching rows (expected for new email)');
      } else {
        console.log('❌ Query error:', queryError.message);
        console.log('Error code:', queryError.code);
      }
    }
    
    if (existingClient) {
      console.log('✅ Found existing client:', existingClient.email);
    } else {
      console.log('✅ No existing client found (can proceed with registration)');
    }
    
    console.log('\n2. Testing if we can query the clients table at all...');
    const { data: anyClients, error: anyError } = await supabase
      .from('clients')
      .select('email')
      .limit(3);
    
    if (anyError) {
      console.log('❌ Cannot query clients table:', anyError.message);
    } else {
      console.log('✅ Can query clients table');
      console.log('Sample clients:', anyClients?.map(c => c.email));
    }
    
    console.log('\n3. Testing auth signup with new email...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'Password123',
    });

    if (authError) {
      console.log('❌ Auth signup failed:', authError.message);
      console.log('Error code:', authError.code);
    } else if (authData.user) {
      console.log('✅ Auth signup would succeed');
      console.log('User ID:', authData.user.id);
      
      // Clean up
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.log('✅ Test user cleaned up');
    } else {
      console.log('⚠️ No user returned from signup');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

testRegistrationIssue();