import { supabase } from '../lib/supabase';
import {
  Invoice,
  InvoiceItem,
  InvoiceMetrics,
  CreateInvoiceRequest,
  CreateInvoiceWithTaxRequest,
  UpdateInvoiceRequest,
  SendInvoiceRequest,
  RecordInvoicePaymentRequest,
  CreateRecurringInvoiceRequest,
  RecurringInvoice
} from '../types/invoice';
import emailService from './emailService';
import { generateInvoicePDF } from '../utils/pdfGenerator';

export class InvoiceService {
  // Generate unique invoice number
  private async generateInvoiceNumber(coachId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Get the last invoice number for this coach
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('coach_id', coachId)
      .like('invoice_number', `INV-${year}${month}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let sequence = 1;
    if (lastInvoice) {
      const lastNumber = lastInvoice.invoice_number;
      const lastSequence = parseInt(lastNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  // Internal method: Create invoice (used by session service only)
  async createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber(request.coach_id);

    // Calculate totals
    let subtotal = 0;
    for (const item of request.items) {
      const itemAmount = item.quantity * item.unit_price_cents;
      const discountAmount = item.discount_percentage
        ? Math.round(itemAmount * item.discount_percentage / 100)
        : 0;
      subtotal += itemAmount - discountAmount;
    }

    const taxAmount = request.tax_rate
      ? Math.round(subtotal * request.tax_rate / 100)
      : 0;
    const discountAmount = request.discount_cents || 0;
    const total = subtotal + taxAmount - discountAmount;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        client_id: request.client_id,
        coach_id: request.coach_id,
        payment_id: request.payment_id,
        booking_id: request.booking_id,
        due_date: new Date(request.due_date),
        subtotal_cents: subtotal,
        tax_rate: request.tax_rate || 0,
        tax_amount_cents: taxAmount,
        discount_cents: discountAmount,
        total_cents: total,
        balance_due_cents: total,
        payment_terms: request.payment_terms,
        notes: request.notes,
        terms_and_conditions: request.terms_and_conditions
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create invoice items
    const itemsToInsert = request.items.map(item => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      amount_cents: item.quantity * item.unit_price_cents,
      tax_rate: item.tax_rate,
      discount_percentage: item.discount_percentage,
      coach_rate_id: item.coach_rate_id,
      session_id: item.session_id,
      service_date: item.service_date ? new Date(item.service_date) : null
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    // Send invoice immediately if requested
    if (request.send_immediately) {
      await this.sendInvoice({
        invoice_id: invoice.id,
        include_pdf: true
      });
    }

    return await this.getInvoice(invoice.id);
  }

  // Create invoice with enhanced tax functionality
  async createInvoiceWithTax(request: CreateInvoiceWithTaxRequest): Promise<Invoice> {
    try {
      // Get client information for tax calculation
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', request.client_id)
        .single();

      if (clientError || !client) {
        throw new Error('Client not found for tax calculation');
      }

      // Process and calculate items with tax
      const processedItems = await Promise.all(
        request.items.map(async (item) => {
          const itemAmount = item.quantity * item.unit_price_cents;
          const discountAmount = item.discount_percentage
            ? Math.round(itemAmount * item.discount_percentage / 100)
            : 0;
          const netAmount = itemAmount - discountAmount;

          // Calculate tax if item is taxable
          let itemTaxAmount = 0;
          let effectiveTaxRate = 0;

          if (item.taxable !== false && (request.client_address || client.address)) {
            // Use provided tax rate or calculate based on location
            effectiveTaxRate = item.tax_rate || request.tax_rate || 0;
            itemTaxAmount = Math.round(netAmount * effectiveTaxRate / 100);
          }

          return {
            ...item,
            amount_cents: itemAmount,
            discount_amount_cents: discountAmount,
            net_amount_cents: netAmount,
            tax_rate_percentage: effectiveTaxRate,
            tax_amount_cents: itemTaxAmount,
            total_price_cents: netAmount + itemTaxAmount
          };
        })
      );

      // Calculate invoice totals
      const subtotalCents = processedItems.reduce((sum, item) => sum + item.net_amount_cents, 0);
      const totalTaxCents = processedItems.reduce((sum, item) => sum + item.tax_amount_cents, 0);
      const totalDiscountCents = processedItems.reduce((sum, item) => sum + item.discount_amount_cents, 0) + (request.discount_cents || 0);
      const totalCents = subtotalCents + totalTaxCents - (request.discount_cents || 0);

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(request.coach_id);

      // Create the invoice record
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          client_id: request.client_id,
          coach_id: request.coach_id,
          payment_id: request.payment_id,
          booking_id: request.booking_id,
          due_date: new Date(request.due_date),

          // Financial totals
          subtotal_cents: subtotalCents,
          tax_rate: totalTaxCents > 0 ? (totalTaxCents / subtotalCents * 100) : 0,
          tax_amount_cents: totalTaxCents,
          discount_cents: request.discount_cents || 0,
          total_cents: totalCents,
          balance_due_cents: totalCents,

          // Tax and business information
          tax_exempt: request.tax_exempt || false,
          tax_exemption_reason: request.tax_exemption_reason,
          business_name: request.business_name,
          business_tax_id: request.business_tax_id,

          // Client tax information
          client_address: request.client_address || client.address,
          client_tax_id: request.client_tax_id,

          metadata: request.metadata || {}
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items with tax information
      const itemsToInsert = processedItems.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        amount_cents: item.total_price_cents,
        service_type: item.service_type,
        service_date: item.service_date,
        session_duration_minutes: item.session_duration_minutes,
        taxable: item.taxable !== false, // Default to true
        tax_category: item.tax_category,
        coach_rate_id: item.coach_rate_id,
        session_id: item.session_id,
        metadata: item.metadata || {}
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Send invoice immediately if requested
      if (request.send_immediately) {
        await this.sendInvoice({
          invoice_id: invoice.id,
          email_to: [client.email],
          include_pdf: true
        });
      }

      return await this.getInvoice(invoice.id);
    } catch (error) {
      console.error('Error creating invoice with tax:', error);
      throw error;
    }
  }

  // Get invoice by ID with items
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*),
        payments:invoice_payments(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Update invoice
  async updateInvoice(invoiceId: string, updates: UpdateInvoiceRequest): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Send invoice via email
  async sendInvoice(request: SendInvoiceRequest): Promise<void> {
    const invoice = await this.getInvoice(request.invoice_id);
    if (!invoice) throw new Error('Invoice not found');

    // Get client info
    const { data: client } = await supabase
      .from('clients')
      .select('email, first_name, last_name')
      .eq('id', invoice.client_id)
      .single();

    if (!client) throw new Error('Client not found');

    // Generate PDF if requested
    let pdfAttachment = null;
    if (request.include_pdf) {
      const pdfBuffer = await this.generateInvoicePDF(invoice.id);
      pdfAttachment = {
        filename: `invoice-${invoice.invoice_number}.pdf`,
        content: pdfBuffer
      };
    }

    // Send email
    await emailService.sendEmail({
      to: request.email_to || [client.email],
      cc: request.email_cc,
      subject: request.email_subject || `Invoice ${invoice.invoice_number}`,
      html: `
        <h2>Invoice ${invoice.invoice_number}</h2>
        <p>Dear ${client.first_name},</p>
        <p>${request.email_message || 'Please find your invoice attached.'}</p>
        <p>Invoice Details:</p>
        <ul>
          <li>Invoice Number: ${invoice.invoice_number}</li>
          <li>Total Amount: $${(invoice.total_cents / 100).toFixed(2)}</li>
          <li>Due Date: ${new Date(invoice.due_date).toLocaleDateString()}</li>
        </ul>
        <p>Thank you for your business!</p>
      `,
      attachments: pdfAttachment ? [pdfAttachment] : []
    });

    // Update invoice status
    await this.updateInvoice(invoice.id, { status: 'sent' });
  }

  // Record payment against invoice
  async recordPayment(request: RecordInvoicePaymentRequest): Promise<void> {
    const invoice = await this.getInvoice(request.invoice_id);
    if (!invoice) throw new Error('Invoice not found');

    // Record payment
    await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: request.invoice_id,
        payment_id: request.payment_id || `payment_${Date.now()}`,
        amount_cents: request.amount_cents,
        payment_method: request.payment_method,
        payment_date: new Date(request.payment_date || new Date()),
        transaction_reference: request.transaction_reference,
        notes: request.notes
      });

    // Update invoice amounts
    const newAmountPaid = invoice.amount_paid_cents + request.amount_cents;
    const newBalance = invoice.total_cents - newAmountPaid;

    let newStatus = invoice.status;
    if (newBalance <= 0) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'partially_paid';
    }

    await supabase
      .from('invoices')
      .update({
        amount_paid_cents: newAmountPaid,
        balance_due_cents: newBalance,
        status: newStatus,
        paid_date: newBalance <= 0 ? new Date().toISOString() : null
      })
      .eq('id', request.invoice_id);
  }

  // Generate invoice PDF
  async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    // Get invoice items from the nested query result
    const items = (invoice as any).items || [];
    return await generateInvoicePDF(invoice, items);
  }

  // Get coach invoices
  async getCoachInvoices(coachId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*),
        client:clients(first_name, last_name, email)
      `)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get client invoices
  async getClientInvoices(clientId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*),
        coach:coaches(first_name, last_name, email)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get invoice metrics
  async getInvoiceMetrics(coachId?: string, startDate?: string, endDate?: string): Promise<InvoiceMetrics> {
    let query = supabase
      .from('invoices')
      .select('*');

    if (coachId) {
      query = query.eq('coach_id', coachId);
    }

    if (startDate) {
      query = query.gte('issue_date', startDate);
    }

    if (endDate) {
      query = query.lte('issue_date', endDate);
    }

    const { data: invoices, error } = await query;
    if (error) throw error;

    // Calculate metrics
    const totalInvoices = invoices?.length || 0;
    const totalAmount = invoices?.reduce((sum, inv) => sum + inv.total_cents, 0) || 0;
    const totalPaid = invoices?.reduce((sum, inv) => sum + inv.amount_paid_cents, 0) || 0;
    const totalOutstanding = invoices?.reduce((sum, inv) => sum + inv.balance_due_cents, 0) || 0;

    const overdueInvoices = invoices?.filter(inv =>
      inv.balance_due_cents > 0 && new Date(inv.due_date) < new Date()
    ) || [];

    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.balance_due_cents, 0);

    const metrics: InvoiceMetrics = {
      total_invoices: totalInvoices,
      total_amount_cents: totalAmount,
      total_paid_cents: totalPaid,
      total_outstanding_cents: totalOutstanding,
      overdue_invoices: overdueInvoices.length,
      overdue_amount_cents: overdueAmount,
      average_payment_time_days: 0, // Calculate this based on paid_date - issue_date
      payment_success_rate: totalInvoices > 0 ? (totalPaid / totalAmount) * 100 : 0
    };

    return metrics;
  }

  // Check overdue invoices
  async checkOverdueInvoices(): Promise<Invoice[]> {
    const today = new Date();
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(first_name, last_name, email),
        coach:coaches(first_name, last_name, email)
      `)
      .gt('balance_due_cents', 0)
      .lt('due_date', today.toISOString())
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // DISABLED: Recurring invoices not needed for session-based billing
  // Invoices are automatically generated when coaching sessions are completed
}

export const invoiceService = new InvoiceService();