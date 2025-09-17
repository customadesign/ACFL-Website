-- Database migration to add Square support
-- Add this to your Supabase database migration

-- Add Square customer ID to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS square_customer_id VARCHAR;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_square_customer_id ON clients (square_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_square_payment_id ON payments (stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_refunds_square_refund_id ON refunds (stripe_refund_id);

-- Update payment statuses to include new Square-specific statuses
-- Note: You may need to update the status enum in your Supabase table
-- to include: 'authorized', 'capture_failed', 'cancelled'

-- Add comments to clarify the new field usage
COMMENT ON COLUMN clients.square_customer_id IS 'Square customer ID for payment processing';
COMMENT ON COLUMN payments.stripe_payment_intent_id IS 'Square payment ID (formerly Stripe payment intent ID)';
COMMENT ON COLUMN payments.stripe_customer_id IS 'Square customer ID (formerly Stripe customer ID)';
COMMENT ON COLUMN refunds.stripe_refund_id IS 'Square refund ID (formerly Stripe refund ID)';

-- Optional: Create a new table for Square-specific data if needed
CREATE TABLE IF NOT EXISTS square_payment_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    square_location_id VARCHAR,
    square_device_id VARCHAR,
    receipt_number VARCHAR,
    receipt_url VARCHAR,
    application_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policy for square_payment_metadata if using Row Level Security
-- ALTER TABLE square_payment_metadata ENABLE ROW LEVEL SECURITY;