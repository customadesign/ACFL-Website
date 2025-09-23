const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBillingTables() {
  try {
    console.log('Creating billing tables...');

    // Create user_credits table
    console.log('Creating user_credits table...');
    await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS user_credits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          user_type TEXT NOT NULL CHECK (user_type IN ('client', 'coach')),
          balance_cents INTEGER NOT NULL DEFAULT 0,
          currency TEXT NOT NULL DEFAULT 'USD',
          last_transaction_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, user_type)
        );
      `
    });

    // Create billing_transactions table
    console.log('Creating billing_transactions table...');
    await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS billing_transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          user_type TEXT NOT NULL CHECK (user_type IN ('client', 'coach')),
          transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'credit', 'debit', 'fee', 'payout')),
          amount_cents INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'USD',
          status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
          description TEXT NOT NULL,
          reference_id UUID,
          reference_type TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create credit_transactions table
    console.log('Creating credit_transactions table...');
    await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS credit_transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_credit_id UUID NOT NULL REFERENCES user_credits(id) ON DELETE CASCADE,
          transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
          amount_cents INTEGER NOT NULL,
          previous_balance_cents INTEGER NOT NULL,
          new_balance_cents INTEGER NOT NULL,
          description TEXT NOT NULL,
          reference_id UUID,
          reference_type TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create refund_requests table
    console.log('Creating refund_requests table...');
    await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS refund_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          payment_id UUID NOT NULL,
          client_id UUID NOT NULL,
          coach_id UUID NOT NULL,
          amount_cents INTEGER NOT NULL,
          reason TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
          requested_by UUID NOT NULL,
          requested_by_type TEXT NOT NULL CHECK (requested_by_type IN ('client', 'coach', 'admin')),
          reviewed_by UUID,
          reviewed_at TIMESTAMP WITH TIME ZONE,
          rejection_reason TEXT,
          refund_method TEXT NOT NULL DEFAULT 'original_payment' CHECK (refund_method IN ('original_payment', 'store_credit', 'manual')),
          processing_fee_cents INTEGER DEFAULT 0,
          coach_penalty_cents INTEGER DEFAULT 0,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create payouts table
    console.log('Creating payouts table...');
    await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS payouts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          coach_id UUID NOT NULL,
          amount_cents INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'USD',
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
          payout_method TEXT NOT NULL CHECK (payout_method IN ('bank_transfer', 'paypal', 'square_payout', 'manual')),
          payout_date TIMESTAMP WITH TIME ZONE,
          fees_cents INTEGER DEFAULT 0,
          net_amount_cents INTEGER NOT NULL,
          failure_reason TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    console.log('All tables created successfully!');

    // Verify tables
    const tables = ['user_credits', 'billing_transactions', 'credit_transactions', 'refund_requests', 'payouts'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.error(`Failed to verify ${table}:`, error.message);
        } else {
          console.log(`✓ Table ${table} verified`);
        }
      } catch (err) {
        console.error(`Error checking ${table}:`, err.message);
      }
    }

  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

createBillingTables();