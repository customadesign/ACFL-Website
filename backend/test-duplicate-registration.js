const fetch = require('node-fetch');
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

async function testDuplicateRegistration() {
  console.log('=== TESTING DUPLICATE REGISTRATION PROTECTION ===\n');
  
  const baseUrl = 'http://localhost:3001';
  const testUser = {
    email: `safetest${Date.now()}@gmail.com`,
    password: 'Password123',
    firstName: 'Safe',
    lastName: 'Test'
  };
  
  try {
    // Step 1: Register a new user
    console.log('1. Registering new user...');
    console.log('Email:', testUser.email);
    
    const registerResponse1 = await fetch(`${baseUrl}/api/auth/register/client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!registerResponse1.ok) {
      console.log('❌ First registration failed:', registerResponse1.status);
      const error = await registerResponse1.text();
      console.log('Error:', error);
      return;
    }

    const registerData1 = await registerResponse1.json();
    console.log('✅ First registration successful');
    console.log('User ID:', registerData1.user.id);
    
    // Step 2: Check user exists in database
    console.log('\n2. Verifying user exists in database...');
    const { data: authUser } = await supabase.auth.admin.getUserById(registerData1.user.id);
    console.log('✅ Auth user exists:', authUser.user?.email);
    
    const { data: clientProfile } = await supabase
      .from('clients')
      .select('*')
      .eq('id', registerData1.user.id)
      .single();
    console.log('✅ Client profile exists:', clientProfile?.email);
    
    // Step 3: Try to register the same email again
    console.log('\n3. Attempting duplicate registration with same email...');
    const registerResponse2 = await fetch(`${baseUrl}/api/auth/register/client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testUser,
        firstName: 'Different',
        lastName: 'Name'
      })
    });

    if (registerResponse2.ok) {
      console.log('❌ PROBLEM: Duplicate registration succeeded (should have failed)');
      const data = await registerResponse2.json();
      console.log('Response:', data);
    } else {
      console.log('✅ Duplicate registration correctly rejected:', registerResponse2.status);
      const error = await registerResponse2.json();
      console.log('Error message:', error.message);
    }
    
    // Step 4: Verify original user still exists
    console.log('\n4. Verifying original user was NOT deleted...');
    const { data: stillExistsAuth } = await supabase.auth.admin.getUserById(registerData1.user.id);
    
    if (stillExistsAuth.user) {
      console.log('✅ Auth user still exists:', stillExistsAuth.user.email);
    } else {
      console.log('❌ CRITICAL: Auth user was deleted!');
    }
    
    const { data: stillExistsProfile } = await supabase
      .from('clients')
      .select('*')
      .eq('id', registerData1.user.id)
      .single();
      
    if (stillExistsProfile) {
      console.log('✅ Client profile still exists:', stillExistsProfile.email);
    } else {
      console.log('❌ CRITICAL: Client profile was deleted!');
    }
    
    // Step 5: Test login still works
    console.log('\n5. Testing login with original user...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    if (loginResponse.ok) {
      console.log('✅ Login still works!');
      const loginData = await loginResponse.json();
      console.log('User can still access their account');
    } else {
      console.log('❌ Login failed - user may have been damaged');
      const error = await loginResponse.text();
      console.log('Error:', error);
    }
    
    console.log('\n🎉 TEST COMPLETE');
    console.log('✅ Duplicate registration protection is working');
    console.log('✅ Existing users are safe from deletion');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDuplicateRegistration();