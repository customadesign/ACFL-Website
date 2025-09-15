import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔧 Running database migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'create_staff_invitations_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file:', migrationPath);
    console.log('\n🚀 Executing migration...\n');

    // Execute the migration using Supabase's raw SQL execution
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    }).single();

    if (error) {
      // If RPC doesn't exist, try direct execution through the REST API
      console.log('⚠️  Direct RPC not available, using alternative method...');
      
      // Split the migration into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        
        // Note: Supabase doesn't directly support DDL statements through the client library
        // You may need to run these migrations directly in the Supabase dashboard SQL editor
        console.log('⚠️  Please run this statement in Supabase SQL editor:');
        console.log(statement + ';');
        console.log('---');
      }
      
      console.log('\n📝 Migration statements generated.');
      console.log('Please copy and run these in your Supabase dashboard SQL editor.');
      return;
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
runMigration().then(() => {
  console.log('\n🏁 Migration process complete');
  process.exit(0);
});