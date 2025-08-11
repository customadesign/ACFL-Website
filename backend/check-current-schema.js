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

async function checkCurrentSchema() {
  try {
    console.log('=== CURRENT DATABASE SCHEMA ===\n');
    
    // Check current clients table structure
    console.log('1. Current clients table structure:');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientsError) {
      console.log('Error fetching clients:', clientsError);
    } else if (clients && clients.length > 0) {
      console.log('Current columns:', Object.keys(clients[0]));
      console.log('Sample record:', clients[0]);
    } else {
      console.log('No client records found');
    }

    console.log('\n2. Current users table structure:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('Error fetching users:', usersError);
    } else if (users && users.length > 0) {
      console.log('Current columns:', Object.keys(users[0]));
      console.log('Sample record:', users[0]);
    } else {
      console.log('No user records found');
    }

    console.log('\n=== REQUIRED SCHEMA ===');
    console.log('clients table should have:');
    console.log('- id (uuid, primary key, references auth.users(id))');
    console.log('- email (text, not null, unique)');
    console.log('- first_name (text, not null)');
    console.log('- last_name (text, not null)'); 
    console.log('- phone (text, optional)');
    console.log('- dob (date, yyyy-mm-dd)');
    console.log('- created_at (timestamp with time zone)');

    console.log('\n=== ANALYSIS ===');
    if (clients && clients.length > 0) {
      const currentCols = Object.keys(clients[0]);
      const requiredCols = ['id', 'email', 'first_name', 'last_name', 'phone', 'dob', 'created_at'];
      
      console.log('Missing columns:', requiredCols.filter(col => !currentCols.includes(col)));
      console.log('Extra columns:', currentCols.filter(col => !requiredCols.includes(col)));
    }

  } catch (error) {
    console.error('Schema check failed:', error);
  }
}

checkCurrentSchema();