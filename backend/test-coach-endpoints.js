// Test script for coach endpoints
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_BASE = 'http://localhost:3001';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testCoachEndpoints() {
  try {
    console.log('=== TESTING COACH ENDPOINTS ===\n');

    // First, let's check if we have any coaches in the database
    console.log('1. Checking coaches in database...');
    const { data: coaches, error: coachesError } = await supabase
      .from('coaches')
      .select('id, first_name, last_name, email')
      .limit(3);

    if (coachesError) {
      console.error('❌ Error fetching coaches:', coachesError.message);
      return;
    }

    if (!coaches || coaches.length === 0) {
      console.log('❌ No coaches found in database');
      console.log('Please run the coaches migration first and register a coach');
      return;
    }

    console.log('✅ Found coaches:');
    coaches.forEach(coach => {
      console.log(`  - ${coach.first_name} ${coach.last_name} (${coach.email}) - ID: ${coach.id}`);
    });

    // Let's use the first coach for testing
    const testCoach = coaches[0];
    console.log(`\n2. Using coach: ${testCoach.first_name} ${testCoach.last_name} for testing\n`);

    // Generate a JWT token for this coach (simulating login)
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET;
    
    const token = jwt.sign({
      userId: testCoach.id,
      email: testCoach.email,
      role: 'coach'
    }, JWT_SECRET, { expiresIn: '1h' });

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test profile endpoint
    console.log('3. Testing GET /api/coach/profile...');
    try {
      const profileResponse = await axios.get(`${API_BASE}/api/coach/profile`, { headers });
      console.log('✅ Profile endpoint working');
      console.log('   Profile data:', {
        name: `${profileResponse.data.data.first_name} ${profileResponse.data.data.last_name}`,
        email: profileResponse.data.data.email,
        specialties: profileResponse.data.data.specialties || [],
        languages: profileResponse.data.data.languages || []
      });
    } catch (error) {
      console.log('❌ Profile endpoint failed:', error.response?.data?.message || error.message);
    }

    // Test dashboard endpoint
    console.log('\n4. Testing GET /api/coach/dashboard...');
    try {
      const dashboardResponse = await axios.get(`${API_BASE}/api/coach/dashboard`, { headers });
      console.log('✅ Dashboard endpoint working');
      console.log('   Dashboard stats:', dashboardResponse.data.data.stats);
    } catch (error) {
      console.log('❌ Dashboard endpoint failed:', error.response?.data?.message || error.message);
    }

    // Test appointments endpoint
    console.log('\n5. Testing GET /api/coach/appointments...');
    try {
      const appointmentsResponse = await axios.get(`${API_BASE}/api/coach/appointments`, { headers });
      console.log('✅ Appointments endpoint working');
      console.log(`   Found ${appointmentsResponse.data.data.length} appointments`);
    } catch (error) {
      console.log('❌ Appointments endpoint failed:', error.response?.data?.message || error.message);
    }

    // Test clients endpoint
    console.log('\n6. Testing GET /api/coach/clients...');
    try {
      const clientsResponse = await axios.get(`${API_BASE}/api/coach/clients`, { headers });
      console.log('✅ Clients endpoint working');
      console.log(`   Found ${clientsResponse.data.data.length} clients`);
    } catch (error) {
      console.log('❌ Clients endpoint failed:', error.response?.data?.message || error.message);
    }

    // Test profile stats endpoint
    console.log('\n7. Testing GET /api/coach/profile/stats...');
    try {
      const statsResponse = await axios.get(`${API_BASE}/api/coach/profile/stats`, { headers });
      console.log('✅ Profile stats endpoint working');
      console.log('   Stats:', statsResponse.data.data);
    } catch (error) {
      console.log('❌ Profile stats endpoint failed:', error.response?.data?.message || error.message);
    }

    console.log('\n=== TESTING COMPLETED ===');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testCoachEndpoints();