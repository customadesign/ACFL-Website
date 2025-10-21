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
  square_product_id?: string;
  stripe_price_id?: string; // Legacy field for backward compatibility
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: string;
  client_id: string;
  coach_id: string;
  coach_rate_id?: string;
  square_payment_id: string; // Square payment ID (required)
  square_customer_id?: string; // Square customer ID
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
  square_refund_id: string;
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
  square_event_id?: string;
  old_status?: string;
  new_status?: string;
  amount_cents?: number;
  description?: string;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface CoachSquareAccount {
  id: string;
  coach_id: string;
  square_account_id: string;
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
  square_subscription_id?: string;
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
  buyer_name?: string; // Cardholder name
  buyer_email?: string; // Buyer email address
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
  square_refund_id: string;
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

export interface CoachSquareOnboardingRequest {
  coach_id: string;
  email: string;
  return_url: string;
  refresh_url: string;
}

export interface CoachSquareOnboardingResponse {
  account_link_url: string;
  square_account_id: string;
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

// Billing Management Types
export interface BillingTransaction {
  id: string;
  user_id: string;
  user_type: 'client' | 'coach';
  transaction_type: 'payment' | 'refund' | 'payout' | 'fee';
  amount_cents: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference_id?: string; // Links to payment, refund, invoice, etc.
  reference_type?: 'payment' | 'refund' | 'invoice' | 'session' | 'payout';
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface RefundRequest {
  id: string;
  payment_id: string;
  client_id: string;
  coach_id: string;
  amount_cents: number;
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'admin_initiated' | 'coach_requested' | 'auto_cancellation' | 'session_cancelled' | 'unsatisfactory_service';
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  requested_by: string;
  requested_by_type: 'client' | 'coach' | 'admin';
  reviewed_by?: string;
  reviewed_at?: Date;
  rejection_reason?: string;
  auto_approval_policy?: string;
  refund_method: 'original_payment' | 'store_credit' | 'manual';
  processing_fee_cents?: number;
  coach_penalty_cents?: number;
  platform_fee_refund_cents?: number;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CoachBankAccount {
  id: string;
  coach_id: string;
  account_holder_name: string;
  bank_name: string;
  account_number: string; // Encrypted
  routing_number: string;
  account_type: 'checking' | 'savings';
  country: string;
  currency: string;
  is_verified: boolean;
  is_default: boolean;
  verification_status: 'pending' | 'verified' | 'failed';
  verification_method?: 'micro_deposits' | 'plaid' | 'manual';
  last_verification_attempt?: Date;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Payout {
  id: string;
  coach_id: string;
  bank_account_id: string;
  payment_id: string; // Source payment that triggers this payout
  amount_cents: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payout_method: 'bank_transfer' | 'square_payout';
  square_payout_id?: string;
  payout_date?: Date;
  estimated_arrival_date?: Date;
  reference_id?: string;
  fees_cents: number;
  net_amount_cents: number;
  failure_reason?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface BillingReport {
  period_start: Date;
  period_end: Date;
  total_revenue_cents: number;
  total_refunds_cents: number;
  total_fees_cents: number;
  net_revenue_cents: number;
  transaction_count: number;
  refund_count: number;
  average_transaction_cents: number;
  refund_rate_percentage: number;
}

// Request/Response Types for Billing
export interface BillingHistoryRequest {
  user_id: string;
  user_type: 'client' | 'coach';
  start_date?: Date;
  end_date?: Date;
  transaction_types?: string[];
  status?: string;
  limit?: number;
  offset?: number;
}

export interface CreateRefundRequestData {
  payment_id: string;
  amount_cents?: number; // If not provided, refunds full amount
  reason: RefundRequest['reason'];
  description?: string;
  refund_method?: RefundRequest['refund_method'];
}

export interface ProcessRefundRequest {
  refund_request_id: string;
  action: 'approve' | 'reject';
  rejection_reason?: string;
  refund_method?: RefundRequest['refund_method'];
  processing_fee_cents?: number;
  coach_penalty_cents?: number;
}

export interface CoachBankAccountRequest {
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  routing_number: string;
  account_type: 'checking' | 'savings';
  country?: string;
  is_default?: boolean;
}

export interface PayoutRequest {
  coach_id: string;
  bank_account_id: string;
  payment_id: string;
  notes?: string;
}

export interface BillingDashboardData {
  current_balance_cents: number; // Total earnings for coaches
  recent_transactions: BillingTransaction[];
  monthly_summary: BillingReport;
  pending_refunds: RefundRequest[];
  bank_accounts?: CoachBankAccount[]; // For coaches
}

export interface TransactionFilters {
  start_date?: Date;
  end_date?: Date;
  transaction_types?: string[];
  status?: string[];
  min_amount_cents?: number;
  max_amount_cents?: number;
  search_term?: string;
}