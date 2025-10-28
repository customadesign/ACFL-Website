-- Add payout_id column to payments table
-- This column tracks which payout request includes this payment
-- NULL means the payment hasn't been paid out yet (pending earnings)

-- Add the column as nullable UUID
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payout_id UUID;

-- Add foreign key constraint to payouts table
-- This ensures payout_id references a valid payout
ALTER TABLE payments
ADD CONSTRAINT fk_payments_payout
FOREIGN KEY (payout_id)
REFERENCES payouts(id)
ON DELETE SET NULL;

-- Add index for faster queries on payout_id
CREATE INDEX IF NOT EXISTS idx_payments_payout_id ON payments(payout_id);

-- Add composite index for coach_id + payout_id (for pending earnings queries)
CREATE INDEX IF NOT EXISTS idx_payments_coach_payout ON payments(coach_id, payout_id);

-- Add comment to explain the column
COMMENT ON COLUMN payments.payout_id IS 'References the payout request that included this payment. NULL means payment is pending and available for next payout.';
