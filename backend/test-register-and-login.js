const fetch = require('node-fetch');

async function testRegisterAndLogin() {
  console.log('=== TESTING REGISTER AND LOGIN FLOW ===\n');
  
  const baseUrl = 'http://localhost:3001';
  const testUser = {
    email: `testuser${Date.now()}@gmail.com`,
    password: 'Password123',
    firstName: 'Auto',
    lastName: 'Test'
  };
  
  try {
    // Step 1: Register a new client
    console.log('1. Registering new client...');
    console.log('Email:', testUser.email);
    
    const registerResponse = await fetch(`${baseUrl}/api/auth/register/client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!registerResponse.ok) {
      console.log('❌ Registration failed:', registerResponse.status);
      const error = await registerResponse.text();
      console.log('Error:', error);
      return;
    }

    const registerData = await registerResponse.json();
    console.log('✅ Registration successful');
    console.log('User ID:', registerData.user.id);
    
    // Step 2: Try to login immediately (should work with auto-confirmation)
    console.log('\n2. Attempting immediate login...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      const error = await loginResponse.text();
      console.log('Error:', error);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log('Token received:', !!loginData.token);
    console.log('User data:', {
      id: loginData.user.id,
      email: loginData.user.email,
      role: loginData.user.role,
      firstName: loginData.user.first_name,
      lastName: loginData.user.last_name
    });
    
    // Step 3: Test profile endpoint with login token
    console.log('\n3. Testing profile endpoint with login token...');
    const profileResponse = await fetch(`${baseUrl}/api/client/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResponse.ok) {
      console.log('❌ Get profile failed:', profileResponse.status);
      const error = await profileResponse.text();
      console.log('Error:', error);
      return;
    }

    const profileData = await profileResponse.json();
    console.log('✅ Profile retrieved successfully');
    console.log('Profile shows basic info:');
    console.log('- First Name:', profileData.data.firstName);
    console.log('- Last Name:', profileData.data.lastName);
    console.log('- Email:', profileData.data.email);
    console.log('- Phone:', profileData.data.phone || 'Not set');

    console.log('\n🎉 COMPLETE FLOW TEST SUCCESSFUL! 🎉');
    console.log('Registration ✅ -> Login ✅ -> Profile ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRegisterAndLogin();