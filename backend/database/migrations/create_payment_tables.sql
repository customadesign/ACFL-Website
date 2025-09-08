-- =========================================================
-- PAYMENT SYSTEM TABLES - RUN THIS IN SUPABASE SQL EDITOR
-- =========================================================

-- 1. Coach rates and packages table
CREATE TABLE IF NOT EXISTS public.coach_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  session_type VARCHAR(50) NOT NULL, -- 'individual', 'group', 'package'
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  rate_cents INT NOT NULL CHECK (rate_cents >= 0), -- Amount in cents
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  max_sessions INT, -- For packages
  validity_days INT, -- Package validity
  discount_percentage DECIMAL(5,2) CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  stripe_price_id VARCHAR(255), -- Stripe Price ID
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(coach_id, session_type, duration_minutes, title)
);

-- 2. Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  coach_rate_id UUID REFERENCES public.coach_rates(id),
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255),
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  currency VARCHAR(3) DEFAULT 'usd',
  platform_fee_cents INT NOT NULL DEFAULT 0 CHECK (platform_fee_cents >= 0),
  coach_earnings_cents INT NOT NULL DEFAULT 0 CHECK (coach_earnings_cents >= 0),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded')),
  payment_method_type VARCHAR(50), -- 'card', 'bank_transfer', etc.
  description TEXT,
  session_id UUID, -- Link to booked session
  metadata JSONB DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_earnings_calculation CHECK (coach_earnings_cents + platform_fee_cents <= amount_cents)
);

-- 3. Refunds table
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  stripe_refund_id VARCHAR(255) UNIQUE NOT NULL,
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('duplicate', 'fraudulent', 'requested_by_customer', 'admin_initiated', 'coach_requested', 'auto_cancellation')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  initiated_by_type VARCHAR(20) NOT NULL CHECK (initiated_by_type IN ('client', 'coach', 'admin', 'system')),
  initiated_by_id UUID, -- ID of user who initiated refund
  coach_penalty_cents INT DEFAULT 0 CHECK (coach_penalty_cents >= 0),
  platform_refund_cents INT DEFAULT 0 CHECK (platform_refund_cents >= 0),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Payment logs table for audit trail
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  refund_id UUID REFERENCES public.refunds(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'payment_created', 'payment_succeeded', 'refund_created', etc.
  stripe_event_id VARCHAR(255), -- Stripe webhook event ID
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  amount_cents INT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CHECK ((payment_id IS NOT NULL AND refund_id IS NULL) OR (payment_id IS NULL AND refund_id IS NOT NULL))
);

-- 5. Coach Stripe accounts table
CREATE TABLE IF NOT EXISTS public.coach_stripe_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE UNIQUE,
  stripe_account_id VARCHAR(255) NOT NULL UNIQUE,
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  country VARCHAR(2) DEFAULT 'US',
  business_type VARCHAR(50), -- 'individual', 'company', 'non_profit', etc.
  requirements_due_date TIMESTAMPTZ,
  requirements_disabled_reason TEXT,
  default_currency VARCHAR(3) DEFAULT 'usd',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Payment schedules for recurring payments (future)
CREATE TABLE IF NOT EXISTS public.payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  coach_rate_id UUID NOT NULL REFERENCES public.coach_rates(id),
  stripe_subscription_id VARCHAR(255),
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  is_active BOOLEAN DEFAULT true,
  next_payment_date DATE,
  last_payment_date DATE,
  start_date DATE NOT NULL,
  end_date DATE,
  total_payments_made INT DEFAULT 0,
  max_payments INT, -- NULL for unlimited
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_schedule_dates CHECK (end_date IS NULL OR end_date > start_date)
);

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_coach_rates_coach ON public.coach_rates(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_rates_active ON public.coach_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_coach_rates_type ON public.coach_rates(session_type);

CREATE INDEX IF NOT EXISTS idx_payments_client ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_coach ON public.payments(coach_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON public.payments(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_stripe_refund ON public.refunds(stripe_refund_id);

CREATE INDEX IF NOT EXISTS idx_payment_logs_payment ON public.payment_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_refund ON public.payment_logs(refund_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event ON public.payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created ON public.payment_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_coach_stripe_accounts_coach ON public.coach_stripe_accounts(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_stripe_accounts_stripe_id ON public.coach_stripe_accounts(stripe_account_id);

CREATE INDEX IF NOT EXISTS idx_payment_schedules_client ON public.payment_schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_coach ON public.payment_schedules(coach_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_active ON public.payment_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_next_payment ON public.payment_schedules(next_payment_date);

-- =========================================================
-- TRIGGERS
-- =========================================================
DROP TRIGGER IF EXISTS set_timestamp_coach_rates ON public.coach_rates;
CREATE TRIGGER set_timestamp_coach_rates
  BEFORE UPDATE ON public.coach_rates
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_payments ON public.payments;
CREATE TRIGGER set_timestamp_payments
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_refunds ON public.refunds;
CREATE TRIGGER set_timestamp_refunds
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_coach_stripe_accounts ON public.coach_stripe_accounts;
CREATE TRIGGER set_timestamp_coach_stripe_accounts
  BEFORE UPDATE ON public.coach_stripe_accounts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_payment_schedules ON public.payment_schedules;
CREATE TRIGGER set_timestamp_payment_schedules
  BEFORE UPDATE ON public.payment_schedules
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
ALTER TABLE public.coach_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_stripe_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedules DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- SAMPLE DATA
-- =========================================================
-- Insert some sample coach rates (adjust coach IDs as needed)
-- INSERT INTO public.coach_rates (coach_id, session_type, duration_minutes, rate_cents, title, description)
-- VALUES 
--   ('coach-uuid-1', 'individual', 60, 12000, 'Standard 1-Hour Session', 'Individual ACT coaching session'),
--   ('coach-uuid-1', 'individual', 90, 17000, 'Extended 90-Minute Session', 'Extended individual session for deeper work'),
--   ('coach-uuid-1', 'package', 60, 45000, '4-Session Package', 'Package of 4 individual sessions with 10% discount');

-- =========================================================
-- VIEWS FOR REPORTING
-- =========================================================
CREATE OR REPLACE VIEW public.payment_summary AS
SELECT 
  p.id,
  p.client_id,
  c1.first_name || ' ' || c1.last_name AS client_name,
  p.coach_id,
  c2.first_name || ' ' || c2.last_name AS coach_name,
  p.amount_cents,
  p.platform_fee_cents,
  p.coach_earnings_cents,
  p.status,
  p.description,
  p.created_at,
  p.paid_at,
  cr.title AS rate_title,
  cr.session_type,
  cr.duration_minutes
FROM public.payments p
LEFT JOIN public.clients c1 ON p.client_id = c1.id
LEFT JOIN public.coaches c2 ON p.coach_id = c2.id
LEFT JOIN public.coach_rates cr ON p.coach_rate_id = cr.id;

CREATE OR REPLACE VIEW public.financial_summary AS
SELECT 
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS total_transactions,
  SUM(amount_cents) AS total_revenue_cents,
  SUM(platform_fee_cents) AS total_platform_fees_cents,
  SUM(coach_earnings_cents) AS total_coach_earnings_cents,
  AVG(amount_cents) AS avg_transaction_cents
FROM public.payments 
WHERE status = 'succeeded'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;