const axios = require('axios');

// Test coach registration
async function testCoachRegistration() {
  const testCoach = {
    email: 'testcoach@example.com',
    password: 'TestPass123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    specialties: ['Life Coaching', 'Career Development'],
    languages: ['English', 'Spanish'],
    bio: 'Experienced life coach with 10 years of practice',
    qualifications: ['Certified Life Coach', 'MA Psychology'],
    experience: 10,
    hourlyRate: 150
  };

  try {
    console.log('Testing coach registration...');
    console.log('Request body:', JSON.stringify(testCoach, null, 2));
    
    const response = await axios.post(
      'http://localhost:3001/api/auth/register/coach',
      testCoach,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.status);
    console.error('Error details:', error.response?.data);
    
    if (error.response?.data?.errors) {
      console.error('Validation errors:');
      error.response.data.errors.forEach(err => {
        console.error(`  - ${err.param}: ${err.msg}`);
      });
    }
  }
}

testCoachRegistration();