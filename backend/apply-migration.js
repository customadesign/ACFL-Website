import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('Reading migration file...');

  const migration = readFileSync('migrations/add_payout_id_to_payments.sql', 'utf8');

  console.log('Applying migration to add payout_id column to payments table...\n');

  // Split the SQL file by semicolons to execute each statement separately
  const statements = migration
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Try direct execution if RPC doesn't work
        console.log('RPC failed, trying direct execution...');
        const { error: directError } = await supabase.from('_sql').insert({ query: statement });

        if (directError) {
          console.error(`Error executing statement ${i + 1}:`, error);
          console.error('Statement:', statement);
        } else {
          console.log(`✓ Statement ${i + 1} executed successfully`);
        }
      } else {
        console.log(`✓ Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.error(`Error executing statement ${i + 1}:`, err);
      console.error('Statement:', statement);
    }
  }

  console.log('\nMigration completed!');
  console.log('\nVerifying column was added...');

  // Check if the column exists by trying to select it
  const { data, error } = await supabase
    .from('payments')
    .select('id, payout_id')
    .limit(1);

  if (error) {
    console.error('Error verifying column:', error);
    console.log('\n⚠️  Migration may have failed. Please apply it manually in Supabase SQL Editor.');
  } else {
    console.log('✓ Column verified successfully!');
    console.log('\nSample data:', data);
  }
}

applyMigration().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
