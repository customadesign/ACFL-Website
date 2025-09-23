-- Updated billing tables schema - removing credit system and adding bank accounts

-- Drop existing credit-related tables
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS user_credits CASCADE;

-- Table for coach bank accounts
CREATE TABLE IF NOT EXISTS coach_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL,
    account_holder_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL, -- Encrypted
    routing_number TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings')),
    country TEXT NOT NULL DEFAULT 'US',
    currency TEXT NOT NULL DEFAULT 'USD',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verification_method TEXT CHECK (verification_method IN ('micro_deposits', 'plaid', 'manual')),
    last_verification_attempt TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update billing transactions table (remove credit/debit transaction types)
ALTER TABLE billing_transactions
DROP CONSTRAINT IF EXISTS billing_transactions_transaction_type_check;

ALTER TABLE billing_transactions
ADD CONSTRAINT billing_transactions_transaction_type_check
CHECK (transaction_type IN ('payment', 'refund', 'fee', 'payout'));

-- Update payouts table to include bank account reference
ALTER TABLE payouts
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES coach_bank_accounts(id),
ADD COLUMN IF NOT EXISTS payment_id UUID, -- Source payment that triggers this payout
ADD COLUMN IF NOT EXISTS square_payout_id TEXT, -- Square payout ID if using Square
ADD COLUMN IF NOT EXISTS estimated_arrival_date TIMESTAMP WITH TIME ZONE;

-- Update payout method constraints
ALTER TABLE payouts
DROP CONSTRAINT IF EXISTS payouts_payout_method_check;

ALTER TABLE payouts
ADD CONSTRAINT payouts_payout_method_check
CHECK (payout_method IN ('bank_transfer', 'square_payout'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_bank_accounts_coach_id ON coach_bank_accounts(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_bank_accounts_is_default ON coach_bank_accounts(coach_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_payouts_bank_account_id ON payouts(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_payouts_payment_id ON payouts(payment_id);

-- Add constraints for bank accounts
ALTER TABLE coach_bank_accounts
ADD CONSTRAINT unique_default_per_coach
EXCLUDE (coach_id WITH =) WHERE (is_default = true);