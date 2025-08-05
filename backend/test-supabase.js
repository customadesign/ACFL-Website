// Test Supabase connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please update your .env file with:');
  console.error('SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔄 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    
    // Test 1: Check if we can query the users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error querying users table:', usersError.message);
      console.log('Make sure you have created the tables using schema.sql');
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log('✅ Users table exists');
    }
    
    // Test 2: Check other tables
    const tables = ['clients', 'coaches', 'sessions', 'saved_coaches'];
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}' not found or error:`, error.message);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testConnection();