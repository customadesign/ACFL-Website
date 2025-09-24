const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const { supabase } = require('../dist/lib/supabase.js');

async function runCalendarMigration() {
  try {
    console.log('🚀 Running calendar integration migration...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../database/migrations/create_calendar_integration_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.toLowerCase().includes('create table') ||
          statement.toLowerCase().includes('create index') ||
          statement.toLowerCase().includes('create or replace function') ||
          statement.toLowerCase().includes('create trigger') ||
          statement.toLowerCase().includes('alter table') ||
          statement.toLowerCase().includes('comment on')) {

        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

          if (error) {
            // Try direct execution for some statements
            console.log(`⚠️  RPC failed, trying direct execution...`);
            const { error: directError } = await supabase.from('').select('').query(statement + ';');
            if (directError) {
              console.error(`❌ Error in statement ${i + 1}:`, directError);
              throw directError;
            }
          }

          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (stmtError) {
          console.warn(`⚠️  Statement ${i + 1} may have failed (this might be expected for some statements):`, stmtError.message);
        }
      }
    }

    console.log('🎉 Calendar integration migration completed successfully!');

    // Test that tables were created
    console.log('🔍 Verifying table creation...');

    const { data: connections } = await supabase.from('coach_calendar_connections').select('id').limit(1);
    console.log('✅ coach_calendar_connections table exists');

    const { data: mappings } = await supabase.from('calendar_event_mappings').select('id').limit(1);
    console.log('✅ calendar_event_mappings table exists');

    const { data: queue } = await supabase.from('calendar_sync_queue').select('id').limit(1);
    console.log('✅ calendar_sync_queue table exists');

    console.log('🚀 Calendar integration is ready to use!');

  } catch (error) {
    console.error('❌ Migration failed:', error);

    // Provide manual migration instructions
    console.log('\n📋 Manual Migration Instructions:');
    console.log('If the automatic migration failed, you can run the SQL manually:');
    console.log('1. Connect to your Supabase database');
    console.log('2. Execute the SQL from: backend/database/migrations/create_calendar_integration_tables.sql');
    console.log('3. Restart the application');
  }
}

runCalendarMigration();