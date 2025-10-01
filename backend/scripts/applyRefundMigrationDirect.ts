import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigrationDirect() {
  console.log('🔧 Applying refund table migration directly...\n');

  try {
    // Step 1: Check if stripe_refund_id exists
    console.log('📋 Step 1: Checking current table structure...');

    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'refunds')
      .in('column_name', ['stripe_refund_id', 'square_refund_id']);

    if (columnsError) {
      console.log('⚠️  Could not check columns directly, will use SQL queries');
    } else {
      console.log('Current columns:', columns);
    }

    // Step 2: Use raw SQL via Supabase query
    console.log('\n📋 Step 2: Executing migration SQL...\n');

    // Execute the migration using .rpc() if available, or provide instructions
    const migrationSQL = `
-- Check if stripe_refund_id exists and rename to square_refund_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'refunds'
        AND column_name = 'stripe_refund_id'
    ) THEN
        -- Drop existing constraints and index
        ALTER TABLE public.refunds DROP CONSTRAINT IF EXISTS refunds_stripe_refund_id_key;
        DROP INDEX IF EXISTS idx_refunds_stripe_refund;

        -- Rename column
        ALTER TABLE public.refunds RENAME COLUMN stripe_refund_id TO square_refund_id;

        -- Add constraints back
        ALTER TABLE public.refunds ADD CONSTRAINT refunds_square_refund_id_key UNIQUE (square_refund_id);
        CREATE INDEX idx_refunds_square_refund ON public.refunds(square_refund_id);

        RAISE NOTICE 'Successfully renamed stripe_refund_id to square_refund_id';
    ELSIF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'refunds'
        AND column_name = 'square_refund_id'
    ) THEN
        -- Add square_refund_id column
        ALTER TABLE public.refunds ADD COLUMN square_refund_id VARCHAR(255) UNIQUE NOT NULL;
        CREATE INDEX idx_refunds_square_refund ON public.refunds(square_refund_id);

        RAISE NOTICE 'Added square_refund_id column';
    ELSE
        RAISE NOTICE 'square_refund_id column already exists';
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN public.refunds.square_refund_id IS 'Square refund ID from Square payment gateway';
`;

    console.log('✅ Migration SQL prepared.');
    console.log('\n⚠️  Supabase client library does not support direct DDL execution.');
    console.log('📝 Please run the following SQL in Supabase SQL Editor:\n');
    console.log('URL: https://supabase.com/dashboard/project/zgavparhxnethbhtulap/sql/new\n');
    console.log('================================================================================');
    console.log(migrationSQL);
    console.log('================================================================================\n');

  } catch (error) {
    console.error('❌ Migration check failed:', error);
  }
}

// Run the migration
applyMigrationDirect().then(() => {
  console.log('🏁 Migration preparation complete');
  console.log('💡 After running the SQL in Supabase dashboard, your refund processing should work!');
  process.exit(0);
});