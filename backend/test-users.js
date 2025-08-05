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

async function testUsers() {
  try {
    console.log('Checking users in database...');
    
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .limit(10);
    
    if (error) {
      console.log('Error fetching users:', error);
      return;
    }
    
    console.log('Users found:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Created: ${user.created_at}`);
    });
    
    // If no users, let's check if we can create a test user
    if (users.length === 0) {
      console.log('\nNo users found. This explains the login 401 error.');
      console.log('You need to register a user first before you can login.');
    }
    
  } catch (err) {
    console.log('Test failed:', err.message);
  }
}

testUsers();