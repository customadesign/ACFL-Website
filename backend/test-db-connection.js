const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service key present:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    console.log('Testing connection to users table...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('Error accessing users table:', error);
      
      // Try to check if the table exists
      console.log('Trying to list tables...');
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_table_names');
      
      if (tablesError) {
        console.log('Cannot list tables:', tablesError);
      } else {
        console.log('Available tables:', tables);
      }
    } else {
      console.log('Successfully connected to users table');
      console.log('Result:', data);
    }
  } catch (err) {
    console.log('Connection failed:', err.message);
  }
}

testConnection();