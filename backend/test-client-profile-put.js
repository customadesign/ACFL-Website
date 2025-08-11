const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();

// Create a test JWT token for client1@example.com
const testPayload = {
  userId: 'a1b2c3d4-e5f6-4890-abcd-123456789002',
  email: 'client1@example.com',
  role: 'client'
};

const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

console.log('Testing client profile PUT API...');
console.log('Using token for:', testPayload.email);

async function testClientProfileUpdate() {
  try {
    const updateData = {
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '555-0123',
      location: 'CA',
      genderIdentity: 'female',
      ethnicIdentity: 'white',
      religiousBackground: 'christian',
      language: 'English',
      areaOfConcern: ['anxiety', 'work-stress'],
      availability: ['weekday-evenings'],
      therapistGender: 'any'
    };

    const response = await fetch('http://localhost:3001/api/client/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('Success response:', JSON.stringify(data, null, 2));
    } else {
      console.log('Error response:', responseText);
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testClientProfileUpdate();