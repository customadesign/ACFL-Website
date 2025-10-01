import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runRefundMigration() {
  console.log('🔧 Running refund table migration to support Square payments...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '009_update_refunds_for_square.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file:', migrationPath);
    console.log('\n🚀 Executing migration...\n');

    // Split the migration into individual executable blocks
    // Remove comments and split by semicolons, but respect DO blocks
    const blocks: string[] = [];
    let currentBlock = '';
    let inDoBlock = false;

    const lines = migrationSQL.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip pure comment lines
      if (trimmedLine.startsWith('--')) continue;

      // Track DO blocks
      if (trimmedLine.match(/^DO\s+\$\$/i)) {
        inDoBlock = true;
      }

      currentBlock += line + '\n';

      // Check for end of DO block
      if (inDoBlock && trimmedLine.match(/^END\s+\$\$;/i)) {
        inDoBlock = false;
        blocks.push(currentBlock.trim());
        currentBlock = '';
      }
    }

    // Add any remaining content
    if (currentBlock.trim()) {
      blocks.push(currentBlock.trim());
    }

    console.log(`Found ${blocks.length} executable blocks\n`);

    // Execute each block using Supabase REST API
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (block.length === 0) continue;

      console.log(`\n📝 Executing block ${i + 1}/${blocks.length}...`);
      console.log(block.substring(0, 100) + '...\n');

      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ query: block })
        });

        if (!response.ok && response.status !== 404) {
          console.log(`⚠️  Standard RPC not available (status: ${response.status})`);
        }
      } catch (err) {
        console.log('⚠️  Direct execution not available, using alternative method...');
      }
    }

    console.log('\n📋 Please run the following SQL in your Supabase SQL Editor:\n');
    console.log('================================================================================');
    console.log(migrationSQL);
    console.log('================================================================================\n');

    console.log('✅ Migration SQL prepared successfully!');
    console.log('📝 Copy the SQL above and run it in: https://supabase.com/dashboard/project/zgavparhxnethbhtulap/sql/new');

  } catch (error) {
    console.error('❌ Migration preparation failed:', error);
  }
}

// Run the migration
runRefundMigration().then(() => {
  console.log('\n🏁 Migration process complete');
  process.exit(0);
});