import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Parse Supabase URL to get database connection string
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Supabase connection string format
// Convert from: https://zgavparhxnethbhtulap.supabase.co
// To: postgresql://postgres:[YOUR-PASSWORD]@db.zgavparhxnethbhtulap.supabase.co:5432/postgres

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not parse project reference from SUPABASE_URL');
  process.exit(1);
}

async function executeMigration() {
  console.log('🔧 Attempting to apply refund table migration...\n');

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not found in .env file\n');
    console.log('📝 To run this migration automatically, add the following to your .env file:\n');
    console.log(`DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres\n`);
    console.log('Replace [YOUR-PASSWORD] with your database password from Supabase dashboard.\n');
    console.log('================================================================================');
    console.log('Alternatively, run this SQL manually in Supabase SQL Editor:');
    console.log(`https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);

    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '009_update_refunds_for_square.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log(migrationSQL);
    console.log('================================================================================\n');
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '009_update_refunds_for_square.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📋 Executing migration SQL...\n');

    // Execute the migration
    const result = await client.query(migrationSQL);

    console.log('✅ Migration executed successfully!');
    console.log('\nResult:', result);

    // Verify the change
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'refunds'
      AND column_name IN ('stripe_refund_id', 'square_refund_id')
      ORDER BY column_name;
    `;

    console.log('\n📊 Verifying column change...');
    const verification = await client.query(verifyQuery);

    if (verification.rows.length > 0) {
      console.log('\nCurrent refund columns:');
      verification.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('🎉 The refunds table now uses square_refund_id instead of stripe_refund_id');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nPlease run the migration manually in Supabase SQL Editor:');
    console.error(`https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  } finally {
    await client.end();
  }
}

// Run the migration
executeMigration().then(() => {
  console.log('\n🏁 Process complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});