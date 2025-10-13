import { supabase } from './src/lib/supabase';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('=== Running Database Migrations ===\n');

  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Run in order

  for (const file of migrationFiles) {
    console.log(`Running migration: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      // Execute the SQL using Supabase's RPC or direct query
      // Note: Supabase JS client doesn't support raw SQL well, so we need to use rpc
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

      if (error) {
        // If exec_sql function doesn't exist, we need to run migrations manually
        // through Supabase dashboard SQL editor
        console.log(`⚠️  Cannot run migration automatically: ${error.message}`);
        console.log(`   Please run this migration manually in Supabase SQL Editor:`);
        console.log(`   File: ${file}`);
        console.log(`   Path: ${filePath}\n`);
      } else {
        console.log(`✓ Migration completed: ${file}\n`);
      }
    } catch (err) {
      console.error(`❌ Error running migration ${file}:`, err);
      console.log(`   Please run this migration manually in Supabase SQL Editor:`);
      console.log(`   File: ${file}`);
      console.log(`   Path: ${filePath}\n`);
    }
  }

  console.log('=== Migration Process Complete ===\n');
  console.log('IMPORTANT: Since Supabase JS client cannot execute raw SQL,');
  console.log('you need to run these migrations manually:');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the content of each migration file');
  console.log('4. Run them in order (001, 002, 003)');
  console.log('\nMigration files are located at:');
  console.log(migrationsDir);
}

runMigrations()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
