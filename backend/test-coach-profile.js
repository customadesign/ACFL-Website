const axios = require('axios');

// Test coach profile endpoint
async function testCoachProfile() {
  try {
    // First, let's test without authentication to see the error
    console.log('Testing /api/coach/profile endpoint...');
    
    const response = await axios.get('http://localhost:3001/api/coach/profile');
    console.log('✅ Response:', response.data);
  } catch (error) {
    console.log('Expected error (no auth):', error.response?.status, error.response?.data);
    
    // This should return 401 or 403 for authentication required
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('✅ Route exists and requires authentication (as expected)');
    } else if (error.response?.status === 404) {
      console.log('❌ Route not found - there might be a routing issue');
    }
  }
}

testCoachProfile();