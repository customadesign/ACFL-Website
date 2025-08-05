const axios = require('axios');

// Test coach registration with different phone formats
async function testCoachRegistration() {
  // Test 1: Without phone number
  const testCoach1 = {
    email: 'testcoach1@example.com',
    password: 'TestPass123',
    firstName: 'John',
    lastName: 'Doe',
    specialties: ['Life Coaching', 'Career Development'],
    languages: ['English', 'Spanish'],
    bio: 'Experienced life coach with 10 years of practice',
    qualifications: ['Certified Life Coach', 'MA Psychology'],
    experience: 10,
    hourlyRate: 150
  };

  // Test 2: With US phone format
  const testCoach2 = {
    email: 'testcoach2@example.com',
    password: 'TestPass123',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '1234567890', // Without country code
    specialties: ['Life Coaching'],
    languages: ['English']
  };

  console.log('Test 1: Without phone number');
  try {
    const response1 = await axios.post(
      'http://localhost:3001/api/auth/register/coach',
      testCoach1,
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('✅ Success:', response1.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.status);
    console.error('Error details:', error.response?.data);
  }

  console.log('\nTest 2: With simple phone format');
  try {
    const response2 = await axios.post(
      'http://localhost:3001/api/auth/register/coach',
      testCoach2,
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('✅ Success:', response2.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.status);
    console.error('Error details:', error.response?.data);
  }
}

testCoachRegistration();