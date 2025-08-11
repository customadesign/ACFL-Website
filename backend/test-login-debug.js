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

async function testLogin() {
  console.log('=== TESTING LOGIN FUNCTIONALITY ===\n');
  
  try {
    // Test with flowtest@gmail.com
    const testEmail = 'flowtest@gmail.com';
    const testPassword = 'Password123';
    
    console.log('1. Attempting to sign in with Supabase Auth...');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (authError) {
      console.log('❌ Sign in failed:', authError.message);
      console.log('Error code:', authError.code);
      console.log('Full error:', authError);
      
      // Try to check if user exists
      console.log('\n2. Checking if user exists in auth.users...');
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      
      if (!listError) {
        const user = users.find(u => u.email === testEmail);
        if (user) {
          console.log('✅ User exists in auth.users');
          console.log('User ID:', user.id);
          console.log('Email verified:', user.email_confirmed_at ? 'Yes' : 'No');
          console.log('Created at:', user.created_at);
          
          // Try to verify the email manually
          if (!user.email_confirmed_at) {
            console.log('\n3. Email not confirmed. Confirming email manually...');
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              user.id,
              { email_confirm: true }
            );
            
            if (updateError) {
              console.log('❌ Failed to confirm email:', updateError.message);
            } else {
              console.log('✅ Email confirmed successfully');
              
              // Try login again
              console.log('\n4. Trying login again after email confirmation...');
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email: testEmail,
                password: testPassword,
              });
              
              if (retryError) {
                console.log('❌ Login still failed:', retryError.message);
              } else {
                console.log('✅ Login successful after email confirmation!');
                console.log('User:', retryData.user?.email);
              }
            }
          }
        } else {
          console.log('❌ User not found in auth.users');
        }
      }
      
      return;
    }

    console.log('✅ Sign in successful!');
    console.log('User ID:', authData.user?.id);
    console.log('Email:', authData.user?.email);
    console.log('Session:', !!authData.session);
    
    // Check client profile
    console.log('\n5. Checking client profile...');
    const { data: clientProfile, error: profileError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Client profile not found:', profileError.message);
    } else {
      console.log('✅ Client profile found');
      console.log('Name:', clientProfile.first_name, clientProfile.last_name);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLogin();