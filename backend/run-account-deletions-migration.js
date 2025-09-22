const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.log('SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running account deletions migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '001_create_account_deletions_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Please run the following SQL in your Supabase SQL editor:');
    console.log('----------------------------------------');
    console.log(migrationSQL);
    console.log('----------------------------------------');

    console.log('\nMigration SQL prepared. Please copy and paste the above SQL into your Supabase SQL editor to complete the migration.');
  } catch (error) {
    console.error('Migration preparation failed:', error);
  }
}

runMigration();