const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
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
  try {
    console.log('Testing login functionality...');
    
    // First, let's create a test user with a proper password hash
    const testEmail = 'test@example.com';
    const testPassword = 'TestPass123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    console.log('Creating test user...');
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', testEmail)
      .single();
    
    let userId;
    
    if (existingUser) {
      console.log('Test user already exists, updating password...');
      userId = existingUser.id;
      
      // Update the password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('email', testEmail);
        
      if (updateError) {
        console.log('Error updating user:', updateError);
        return;
      }
    } else {
      console.log('Creating new test user...');
      
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: testEmail,
          password: hashedPassword,
          role: 'client',
          first_name: 'Test',
          last_name: 'User'
        })
        .select()
        .single();
        
      if (createError) {
        console.log('Error creating user:', createError);
        return;
      }
      
      userId = newUser.id;
      
      // Create client profile
      await supabase
        .from('clients')
        .insert({
          user_id: userId,
          first_name: 'Test',
          last_name: 'User',
          phone: '555-0000'
        });
    }
    
    console.log('Test user ready. Now testing login...');
    
    // Now test the login by calling our backend API
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    const result = await response.json();
    
    console.log('Login response status:', response.status);
    console.log('Login response:', result);
    
    if (response.status === 200) {
      console.log('\n✅ LOGIN SUCCESS! You can now use:');
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${testPassword}`);
    } else {
      console.log('\n❌ LOGIN FAILED');
    }
    
  } catch (err) {
    console.log('Test failed:', err.message);
  }
}

testLogin();