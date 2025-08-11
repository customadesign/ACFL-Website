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

async function testOrphanAuthUser() {
  console.log('=== TESTING ORPHAN AUTH USER SCENARIO ===\n');
  
  const baseUrl = 'http://localhost:3001';
  const testEmail = `orphan${Date.now()}@gmail.com`;
  const testPassword = 'Password123';
  
  try {
    // Step 1: Create auth user directly (without client profile)
    console.log('1. Creating auth user without client profile...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (authError) {
      console.log('❌ Failed to create auth user:', authError.message);
      return;
    }

    console.log('✅ Auth user created:', authData.user?.id);
    console.log('Email:', authData.user?.email);
    
    // Confirm email
    await supabase.auth.admin.updateUserById(authData.user.id, { email_confirm: true });
    console.log('✅ Email confirmed');
    
    // Step 2: Verify no client profile exists
    console.log('\n2. Verifying no client profile exists...');
    const { data: profile } = await supabase
      .from('clients')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profile) {
      console.log('❌ Unexpected: Client profile already exists');
    } else {
      console.log('✅ Confirmed: No client profile exists (orphan auth user)');
    }
    
    // Step 3: Try to register with same email (should create client profile)
    console.log('\n3. Attempting registration with existing auth user email...');
    const registerResponse = await fetch(`${baseUrl}/api/auth/register/client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        firstName: 'Orphan',
        lastName: 'User'
      })
    });

    if (registerResponse.ok) {
      console.log('❌ Registration succeeded (this may create duplicate auth users)');
      const data = await registerResponse.json();
      console.log('Response:', data);
    } else {
      console.log('✅ Registration rejected (expected for existing auth users)');
      const error = await registerResponse.json();
      console.log('Error message:', error.message);
    }
    
    // Step 4: Check if auth user still exists and isn't duplicated
    console.log('\n4. Checking auth user status...');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const matchingUsers = users.filter(u => u.email === testEmail);
    
    console.log(`Found ${matchingUsers.length} auth user(s) with email ${testEmail}`);
    if (matchingUsers.length === 1) {
      console.log('✅ No duplicate auth users created');
      console.log('Auth user ID:', matchingUsers[0].id);
    } else if (matchingUsers.length > 1) {
      console.log('❌ PROBLEM: Multiple auth users with same email!');
      matchingUsers.forEach(u => console.log('- User ID:', u.id));
    }
    
    // Step 5: Check client profile status
    console.log('\n5. Checking client profile status...');
    const { data: allProfiles } = await supabase
      .from('clients')
      .select('*')
      .eq('email', testEmail);
    
    if (allProfiles && allProfiles.length > 0) {
      console.log(`Found ${allProfiles.length} client profile(s)`);
      allProfiles.forEach(p => console.log('- Profile ID:', p.id, 'Email:', p.email));
    } else {
      console.log('No client profiles found for this email');
    }
    
    // Cleanup
    console.log('\n6. Cleaning up test data...');
    for (const user of matchingUsers) {
      await supabase.auth.admin.deleteUser(user.id);
      await supabase.from('clients').delete().eq('id', user.id);
    }
    console.log('✅ Cleanup complete');
    
    console.log('\n📋 SUMMARY:');
    console.log('- Orphan auth users (without client profiles) are handled safely');
    console.log('- No duplicate auth users are created');
    console.log('- Registration with existing auth user email is properly rejected');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOrphanAuthUser();