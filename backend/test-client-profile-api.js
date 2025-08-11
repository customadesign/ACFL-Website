const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

// Create a test JWT token for client1@example.com
const testPayload = {
  userId: 'a1b2c3d4-e5f6-4890-abcd-123456789002', // client1@example.com from our test
  email: 'client1@example.com',
  role: 'client'
};

require('dotenv').config();
const token = jwt.sign(testPayload, process.env.JWT_SECRET || 'your-jwt-secret-key');

console.log('Testing client profile API...');
console.log('Using token for:', testPayload.email);

async function testClientProfile() {
  try {
    const response = await fetch('http://localhost:3001/api/client/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Success response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testClientProfile();