const fetch = require('node-fetch');

async function testCompleteFlow() {
  console.log('=== TESTING COMPLETE CLIENT FLOW ===\n');
  
  const baseUrl = 'http://localhost:3001';
  
  try {
    // Step 1: Register a new client
    console.log('1. Registering new client...');
    const registerResponse = await fetch(`${baseUrl}/api/auth/register/client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'flowtest@gmail.com',
        password: 'Password123',
        firstName: 'Flow',
        lastName: 'Test'
      })
    });

    if (!registerResponse.ok) {
      console.log('❌ Registration failed:', registerResponse.status);
      const error = await registerResponse.text();
      console.log('Error:', error);
      return;
    }

    const registerData = await registerResponse.json();
    console.log('✅ Registration successful');
    console.log('Token received:', !!registerData.token);
    console.log('User:', registerData.user);
    
    const token = registerData.token;

    // Step 2: Get client profile
    console.log('\n2. Getting client profile...');
    const profileResponse = await fetch(`${baseUrl}/api/client/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
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
    console.log('Profile data:', JSON.stringify(profileData.data, null, 2));

    // Step 3: Update client profile
    console.log('\n3. Updating client profile...');
    const updateResponse = await fetch(`${baseUrl}/api/client/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        location: 'CA',
        genderIdentity: 'non-binary',
        areaOfConcern: ['anxiety', 'depression'],
        availability: ['weekday-mornings'],
        bio: 'This is my test bio'
      })
    });

    if (!updateResponse.ok) {
      console.log('❌ Profile update failed:', updateResponse.status);
      const error = await updateResponse.text();
      console.log('Error:', error);
      return;
    }

    const updateData = await updateResponse.json();
    console.log('✅ Profile updated successfully');
    console.log('Update result:', updateData);

    // Step 4: Get updated profile
    console.log('\n4. Getting updated profile...');
    const updatedProfileResponse = await fetch(`${baseUrl}/api/client/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!updatedProfileResponse.ok) {
      console.log('❌ Get updated profile failed:', updatedProfileResponse.status);
      const error = await updatedProfileResponse.text();
      console.log('Error:', error);
      return;
    }

    const updatedProfileData = await updatedProfileResponse.json();
    console.log('✅ Updated profile retrieved successfully');
    console.log('Updated profile data:');
    console.log('- First Name:', updatedProfileData.data.firstName);
    console.log('- Last Name:', updatedProfileData.data.lastName);
    console.log('- Email:', updatedProfileData.data.email);
    console.log('- Phone:', updatedProfileData.data.phone || 'Not set');
    console.log('- Location:', updatedProfileData.data.location);
    console.log('- Gender Identity:', updatedProfileData.data.genderIdentity);
    console.log('- Areas of Concern:', updatedProfileData.data.areaOfConcern);
    console.log('- Availability:', updatedProfileData.data.availability);
    console.log('- Bio:', updatedProfileData.data.bio);

    console.log('\n🎉 COMPLETE FLOW TEST SUCCESSFUL! 🎉');
    console.log('\nYour JWT token for frontend testing:');
    console.log(token);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteFlow();