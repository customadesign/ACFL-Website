export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  coach_id: string;
  payment_id?: string;
  booking_id?: string;
  status: 'draft' | 'pending' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'refunded';
  issue_date: Date;
  due_date: Date;
  paid_date?: Date;
  subtotal_cents: number;
  tax_rate: number;
  tax_amount_cents: number;
  discount_cents: number;
  total_cents: number;
  amount_paid_cents: number;
  balance_due_cents: number;
  currency: string;
  payment_terms?: string;
  notes?: string;
  terms_and_conditions?: string;
  metadata?: Record<string, any>;
  // Tax properties
  tax_jurisdiction?: string;
  tax_exempt?: boolean;
  business_name?: string;
  business_tax_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  amount_cents: number;
  tax_rate?: number;
  tax_amount_cents?: number;
  discount_percentage?: number;
  discount_amount_cents?: number;
  coach_rate_id?: string;
  session_id?: string;
  service_date?: Date;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  payment_id: string;
  amount_cents: number;
  payment_method: string;
  payment_date: Date;
  transaction_reference?: string;
  notes?: string;
  created_at: Date;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  coach_id?: string;
  is_default: boolean;
  header_content?: string;
  footer_content?: string;
  logo_url?: string;
  color_scheme?: Record<string, string>;
  font_family?: string;
  payment_instructions?: string;
  terms_and_conditions?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceReminder {
  id: string;
  invoice_id: string;
  reminder_type: 'before_due' | 'on_due' | 'overdue';
  days_offset: number;
  sent_at?: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  email_template_id?: string;
  created_at: Date;
}

export interface RecurringInvoice {
  id: string;
  client_id: string;
  coach_id: string;
  template_id?: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
  start_date: Date;
  end_date?: Date;
  next_invoice_date: Date;
  last_invoice_date?: Date;
  is_active: boolean;
  auto_send: boolean;
  auto_charge: boolean;
  payment_schedule_id?: string;
  subtotal_cents: number;
  tax_rate: number;
  discount_cents?: number;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface RecurringInvoiceItem {
  id: string;
  recurring_invoice_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  tax_rate?: number;
  discount_percentage?: number;
  coach_rate_id?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

// Request/Response types
export interface CreateInvoiceRequest {
  client_id: string;
  coach_id: string;
  payment_id?: string;
  booking_id?: string;
  due_date: string;
  items: CreateInvoiceItemRequest[];
  tax_rate?: number;
  discount_cents?: number;
  payment_terms?: string;
  notes?: string;
  terms_and_conditions?: string;
  send_immediately?: boolean;
}

export interface CreateInvoiceItemRequest {
  description: string;
  quantity: number;
  unit_price_cents: number;
  tax_rate?: number;
  discount_percentage?: number;
  coach_rate_id?: string;
  session_id?: string;
  service_date?: string;
  service_type?: string;
  session_duration_minutes?: number;
  taxable?: boolean;
  tax_category?: string;
  metadata?: Record<string, any>;
}

export interface UpdateInvoiceRequest {
  status?: Invoice['status'];
  due_date?: string;
  items?: CreateInvoiceItemRequest[];
  tax_rate?: number;
  discount_cents?: number;
  payment_terms?: string;
  notes?: string;
  terms_and_conditions?: string;
  amount_paid_cents?: number;
  balance_due_cents?: number;
  paid_date?: Date | null;
}

export interface SendInvoiceRequest {
  invoice_id: string;
  email_to?: string[];
  email_cc?: string[];
  email_subject?: string;
  email_message?: string;
  include_pdf?: boolean;
}

export interface RecordInvoicePaymentRequest {
  invoice_id: string;
  amount_cents: number;
  payment_method: string;
  payment_date?: string;
  payment_id?: string;
  transaction_reference?: string;
  notes?: string;
}

export interface CreateRecurringInvoiceRequest {
  client_id: string;
  coach_id: string;
  frequency: RecurringInvoice['frequency'];
  start_date: string;
  end_date?: string;
  items: CreateInvoiceItemRequest[];
  tax_rate?: number;
  discount_cents?: number;
  auto_send?: boolean;
  auto_charge?: boolean;
  payment_schedule_id?: string;
}

export interface InvoiceSummary {
  id: string;
  invoice_number: string;
  client_name: string;
  coach_name: string;
  total_cents: number;
  balance_due_cents: number;
  status: string;
  issue_date: Date;
  due_date: Date;
  is_overdue: boolean;
}

export interface InvoiceMetrics {
  total_invoices: number;
  total_amount_cents: number;
  total_paid_cents: number;
  total_outstanding_cents: number;
  overdue_invoices: number;
  overdue_amount_cents: number;
  average_payment_time_days: number;
  payment_success_rate: number;
}

export interface InvoiceExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  date_from?: Date;
  date_to?: Date;
  status?: Invoice['status'][];
  include_items?: boolean;
  include_payments?: boolean;
}

// Extended types for Tax Documentation and Reporting

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface TaxDocument {
  id: string;
  document_type: '1099' | 'sales_tax_report' | 'quarterly_summary' | 'annual_summary';

  // Time period
  tax_year: number;
  quarter?: number; // 1, 2, 3, 4 or null for annual
  period_start: Date;
  period_end: Date;

  // Entity information
  entity_id: string;
  entity_type: 'coach' | 'business' | 'client';
  entity_name: string;
  entity_tax_id?: string;
  entity_address?: Address;

  // Financial data
  total_income_cents: number;
  total_tax_withheld_cents: number;
  total_expenses_cents: number;
  net_income_cents: number;

  // Tax calculations
  sales_tax_collected_cents: number;
  sales_tax_remitted_cents: number;
  sales_tax_owed_cents: number;

  // Document status
  status: 'draft' | 'generated' | 'sent' | 'filed';
  generated_at?: Date;
  sent_at?: Date;
  filed_at?: Date;

  // File information
  document_path?: string;
  document_hash?: string;

  // Metadata
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface TaxRate {
  id: string;
  jurisdiction: string; // 'US', 'CA-ON', 'US-CA', etc.
  jurisdiction_type: 'country' | 'state' | 'province' | 'county' | 'city';
  tax_type: 'sales_tax' | 'vat' | 'gst' | 'hst';

  // Rate information
  rate_percentage: number;
  effective_date: Date;
  expiry_date?: Date;

  // Service applicability
  applies_to_services: boolean;
  applies_to_coaching: boolean;
  threshold_amount_cents: number;

  // Metadata
  description?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface TaxCalculationResult {
  tax_rate_percentage: number;
  tax_amount_cents: number;
  jurisdiction?: string;
  tax_type?: string;
}

export interface TaxReport {
  period_start: Date;
  period_end: Date;
  total_invoices_issued: number;
  total_revenue_cents: number;
  total_tax_collected_cents: number;
  tax_by_jurisdiction: Record<string, {
    revenue_cents: number;
    tax_collected_cents: number;
    tax_rate_percentage: number;
  }>;
  outstanding_invoices_count: number;
  outstanding_amount_cents: number;
}

export interface CoachTaxSummary {
  coach_id: string;
  tax_year: number;
  quarter?: number;

  // Income breakdown
  total_sessions_income_cents: number;
  total_packages_income_cents: number;
  total_other_income_cents: number;
  gross_income_cents: number;

  // Deductions (if supported)
  total_expenses_cents: number;
  net_income_cents: number;

  // Tax withholding
  tax_withheld_cents: number;

  // Session counts
  total_sessions_count: number;
  total_clients_served: number;

  // Payment methods breakdown
  stripe_payments_cents: number;
  square_payments_cents: number;
  other_payments_cents: number;
}

// Request types for tax functionality
export interface CreateTaxDocumentRequest {
  document_type: TaxDocument['document_type'];
  tax_year: number;
  quarter?: number;
  entity_id: string;
  entity_type: TaxDocument['entity_type'];
  period_start: string; // ISO date
  period_end: string; // ISO date
}

export interface GenerateTaxReportRequest {
  period_start: string; // ISO date
  period_end: string; // ISO date
  entity_id?: string; // Optional filter for specific coach/client
  include_details?: boolean;
  format?: 'json' | 'pdf' | 'csv';
}

export interface UpdateTaxRateRequest {
  jurisdiction: string;
  jurisdiction_type: TaxRate['jurisdiction_type'];
  tax_type: TaxRate['tax_type'];
  rate_percentage: number;
  effective_date: string; // ISO date
  expiry_date?: string; // ISO date
  applies_to_services?: boolean;
  applies_to_coaching?: boolean;
  threshold_amount_cents?: number;
  description?: string;
}

// Enhanced invoice types with tax integration
export interface InvoiceWithTax extends Invoice {
  // Enhanced tax information
  tax_jurisdiction?: string;
  tax_type?: string;
  tax_exempt?: boolean;
  tax_exemption_reason?: string;

  // Business information for tax compliance
  business_name?: string;
  business_address?: Address;
  business_tax_id?: string;

  // Client tax information
  client_address?: Address;
  client_tax_id?: string;
}

export interface CreateInvoiceWithTaxRequest extends CreateInvoiceRequest {
  // Tax-specific fields
  client_address?: Address;
  client_tax_id?: string;
  business_name?: string;
  business_address?: Address;
  business_tax_id?: string;
  tax_exempt?: boolean;
  tax_exemption_reason?: string;
  calculate_tax_automatically?: boolean;
  metadata?: Record<string, any>;
}

// Analytics types for tax reporting
export interface TaxAnalytics {
  total_tax_collected_cents: number;
  tax_by_jurisdiction: Record<string, number>;
  tax_by_quarter: Record<string, number>;
  average_tax_rate: number;
  tax_exempt_revenue_cents: number;

  // Compliance metrics
  invoices_missing_tax_info: number;
  invoices_with_tax_errors: number;
}

export interface InvoiceAnalytics extends InvoiceMetrics {
  // Additional analytics for tax compliance
  tax_analytics: TaxAnalytics;
}

// Bulk operations for tax documents
export interface BulkTaxDocumentRequest {
  document_type: TaxDocument['document_type'];
  tax_year: number;
  quarter?: number;
  entity_ids: string[];
  auto_generate?: boolean;
  auto_send?: boolean;
}

// Tax compliance check results
export interface TaxComplianceCheck {
  invoice_id: string;
  is_compliant: boolean;
  issues: string[];
  recommendations: string[];
}

export interface BulkTaxComplianceReport {
  total_invoices_checked: number;
  compliant_invoices: number;
  non_compliant_invoices: number;
  common_issues: Record<string, number>;
  invoice_details: TaxComplianceCheck[];
}