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