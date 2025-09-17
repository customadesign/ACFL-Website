export interface CoachRate {
  id: string;
  coach_id: string;
  session_type: 'individual' | 'group' | 'package';
  duration_minutes: number;
  rate_cents: number;
  title: string;
  description?: string;
  is_active: boolean;
  max_sessions?: number;
  validity_days?: number;
  discount_percentage?: number;
  stripe_price_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: string;
  client_id: string;
  coach_id: string;
  coach_rate_id?: string;
  stripe_payment_intent_id: string;
  stripe_customer_id?: string;
  amount_cents: number;
  currency: string;
  platform_fee_cents: number;
  coach_earnings_cents: number;
  status: 'pending' | 'authorized' | 'succeeded' | 'failed' | 'canceled' | 'requires_capture' | 'refunded' | 'partially_refunded';
  payment_method_type?: string;
  payment_method?: string;
  authorization_code?: string;
  captured_at?: Date;
  expires_at?: Date;
  description?: string;
  session_id?: string;
  metadata: Record<string, any>;
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Refund {
  id: string;
  payment_id: string;
  stripe_refund_id: string;
  amount_cents: number;
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'admin_initiated' | 'coach_requested' | 'auto_cancellation';
  status: 'pending' | 'pending_approval' | 'approved' | 'rejected' | 'succeeded' | 'failed' | 'canceled';
  initiated_by_type: 'client' | 'coach' | 'admin' | 'system';
  initiated_by_id?: string;
  requires_approval?: boolean;
  approved_by?: string;
  approved_at?: Date;
  rejection_reason?: string;
  auto_approval_policy?: string;
  coach_penalty_cents: number;
  platform_refund_cents: number;
  description?: string;
  metadata: Record<string, any>;
  processed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentLog {
  id: string;
  payment_id?: string;
  refund_id?: string;
  event_type: string;
  stripe_event_id?: string;
  old_status?: string;
  new_status?: string;
  amount_cents?: number;
  description?: string;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface CoachStripeAccount {
  id: string;
  coach_id: string;
  stripe_account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  onboarding_completed: boolean;
  country: string;
  business_type?: string;
  requirements_due_date?: Date;
  requirements_disabled_reason?: string;
  default_currency: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentSchedule {
  id: string;
  client_id: string;
  coach_id: string;
  coach_rate_id: string;
  stripe_subscription_id?: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  amount_cents: number;
  is_active: boolean;
  next_payment_date?: Date;
  last_payment_date?: Date;
  start_date: Date;
  end_date?: Date;
  total_payments_made: number;
  max_payments?: number;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Request/Response types
export interface CreatePaymentIntentRequest {
  coach_id: string;
  coach_rate_id: string;
  sourceId?: string; // Square payment source (card nonce)
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentResponse {
  payment_intent_id: string;
  client_secret: string;
  amount_cents: number;
  payment_id: string;
}

export interface CreateRefundRequest {
  payment_id: string;
  amount_cents?: number;
  reason: Refund['reason'];
  description?: string;
}

export interface CreateRefundResponse {
  refund_id: string;
  stripe_refund_id: string;
  amount_cents: number;
  status: string;
}

export interface CoachRateRequest {
  session_type: CoachRate['session_type'];
  duration_minutes: number;
  rate_cents: number;
  title: string;
  description?: string;
  max_sessions?: number;
  validity_days?: number;
  discount_percentage?: number;
}

export interface CoachStripeOnboardingRequest {
  coach_id: string;
  email: string;
  return_url: string;
  refresh_url: string;
}

export interface CoachStripeOnboardingResponse {
  account_link_url: string;
  stripe_account_id: string;
}

// Financial reporting types
export interface PaymentSummary {
  id: string;
  client_id: string;
  client_name: string;
  coach_id: string;
  coach_name: string;
  amount_cents: number;
  platform_fee_cents: number;
  coach_earnings_cents: number;
  status: string;
  description?: string;
  created_at: Date;
  paid_at?: Date;
  rate_title: string;
  session_type: string;
  duration_minutes: number;
}

export interface FinancialSummary {
  month: Date;
  total_transactions: number;
  total_revenue_cents: number;
  total_platform_fees_cents: number;
  total_coach_earnings_cents: number;
  avg_transaction_cents: number;
}

export interface CoachEarningsReport {
  coach_id: string;
  coach_name: string;
  total_sessions: number;
  total_earnings_cents: number;
  average_session_rate_cents: number;
  pending_payouts_cents: number;
  last_payout_date?: Date;
}

export interface PlatformFinancials {
  total_revenue_cents: number;
  total_fees_collected_cents: number;
  active_coaches: number;
  total_sessions: number;
  average_session_value_cents: number;
  refund_rate_percentage: number;
}

// New interfaces for authorization/capture flow
export interface Session {
  id: string;
  coach_id: string;
  client_id: string;
  payment_id?: string;
  session_date: Date;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  session_notes?: string;
  completion_confirmed_by?: string;
  completed_at?: Date;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AutomaticRefundPolicy {
  id: string;
  name: string;
  description?: string;
  conditions: Record<string, any>;
  refund_percentage: number;
  applies_to_session_types: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Authorization/Capture request types
export interface CreatePaymentAuthorizationRequest {
  coach_id: string;
  coach_rate_id: string;
  session_date?: string;
  session_time?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentAuthorizationResponse {
  payment_intent_id: string;
  client_secret: string;
  amount_cents: number;
  payment_id: string;
  expires_at: Date;
}

export interface CapturePaymentRequest {
  payment_id: string;
  session_id?: string;
  amount_cents?: number; // Optional partial capture
}

export interface CapturePaymentResponse {
  payment_id: string;
  captured_amount_cents: number;
  captured_at: Date;
  status: string;
}

export interface RefundApprovalRequest {
  refund_id: string;
  approved: boolean;
  rejection_reason?: string;
}

export interface SessionCompletionRequest {
  session_id: string;
  session_notes?: string;
  auto_capture_payment?: boolean;
}