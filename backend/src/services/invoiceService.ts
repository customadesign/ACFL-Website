import { supabase } from '../lib/supabase';
import {
  Invoice,
  InvoiceItem,
  InvoicePayment,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  SendInvoiceRequest,
  RecordInvoicePaymentRequest,
  InvoiceSummary,
  InvoiceMetrics,
  RecurringInvoice,
  CreateRecurringInvoiceRequest
} from '../types/invoice';
import { sendEmail } from './emailService';
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
      .like('invoice_number', `INV-${year}${month}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    let sequence = 1;
    if (lastInvoice && lastInvoice.length > 0) {
      const lastNumber = lastInvoice[0].invoice_number;
      const lastSequence = parseInt(lastNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  // Create a new invoice
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

    const total = subtotal + taxAmount - (request.discount_cents || 0);

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        client_id: request.client_id,
        coach_id: request.coach_id,
        payment_id: request.payment_id,
        booking_id: request.booking_id,
        status: 'draft',
        issue_date: new Date(),
        due_date: new Date(request.due_date),
        subtotal_cents: subtotal,
        tax_rate: request.tax_rate || 0,
        tax_amount_cents: taxAmount,
        discount_cents: request.discount_cents || 0,
        total_cents: total,
        amount_paid_cents: 0,
        balance_due_cents: total,
        currency: 'USD',
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
      tax_amount_cents: item.tax_rate
        ? Math.round(item.quantity * item.unit_price_cents * item.tax_rate / 100)
        : 0,
      discount_percentage: item.discount_percentage,
      discount_amount_cents: item.discount_percentage
        ? Math.round(item.quantity * item.unit_price_cents * item.discount_percentage / 100)
        : 0,
      coach_rate_id: item.coach_rate_id,
      session_id: item.session_id,
      service_date: item.service_date ? new Date(item.service_date) : null
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    // Send immediately if requested
    if (request.send_immediately) {
      await this.sendInvoice({
        invoice_id: invoice.id
      });
    }

    return invoice;
  }

  // Update an existing invoice
  async updateInvoice(invoiceId: string, request: UpdateInvoiceRequest): Promise<Invoice> {
    const updateData: any = {};

    if (request.status) updateData.status = request.status;
    if (request.due_date) updateData.due_date = new Date(request.due_date);
    if (request.payment_terms) updateData.payment_terms = request.payment_terms;
    if (request.notes) updateData.notes = request.notes;
    if (request.terms_and_conditions) updateData.terms_and_conditions = request.terms_and_conditions;

    // If items are being updated, recalculate totals
    if (request.items) {
      // Delete existing items
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      // Calculate new totals
      let subtotal = 0;
      for (const item of request.items) {
        const itemAmount = item.quantity * item.unit_price_cents;
        const discountAmount = item.discount_percentage
          ? Math.round(itemAmount * item.discount_percentage / 100)
          : 0;
        subtotal += itemAmount - discountAmount;
      }

      const taxAmount = request.tax_rate !== undefined
        ? Math.round(subtotal * request.tax_rate / 100)
        : 0;

      const discount = request.discount_cents !== undefined
        ? request.discount_cents
        : 0;

      const total = subtotal + taxAmount - discount;

      updateData.subtotal_cents = subtotal;
      updateData.tax_amount_cents = taxAmount;
      updateData.discount_cents = discount;
      updateData.total_cents = total;
      updateData.balance_due_cents = total - (updateData.amount_paid_cents || 0);

      if (request.tax_rate !== undefined) {
        updateData.tax_rate = request.tax_rate;
      }

      // Insert new items
      const itemsToInsert = request.items.map(item => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        amount_cents: item.quantity * item.unit_price_cents,
        tax_rate: item.tax_rate,
        tax_amount_cents: item.tax_rate
          ? Math.round(item.quantity * item.unit_price_cents * item.tax_rate / 100)
          : 0,
        discount_percentage: item.discount_percentage,
        discount_amount_cents: item.discount_percentage
          ? Math.round(item.quantity * item.unit_price_cents * item.discount_percentage / 100)
          : 0,
        coach_rate_id: item.coach_rate_id,
        session_id: item.session_id,
        service_date: item.service_date ? new Date(item.service_date) : null
      }));

      await supabase
        .from('invoice_items')
        .insert(itemsToInsert);
    }

    updateData.updated_at = new Date();

    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;

    return invoice;
  }

  // Send invoice to client
  async sendInvoice(request: SendInvoiceRequest): Promise<void> {
    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        coach:coaches(*)
      `)
      .eq('id', request.invoice_id)
      .single();

    if (invoiceError) throw invoiceError;

    // Get invoice items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', request.invoice_id);

    if (itemsError) throw itemsError;

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice, items);

    // Prepare email
    const emailTo = request.email_to || [invoice.client.email];
    const subject = request.email_subject || `Invoice ${invoice.invoice_number} from ${invoice.coach.name}`;
    const message = request.email_message || `
      Dear ${invoice.client.name},

      Please find attached invoice ${invoice.invoice_number} for your recent sessions.

      Amount Due: $${(invoice.balance_due_cents / 100).toFixed(2)}
      Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

      ${invoice.payment_terms || ''}

      Thank you for your business.

      Best regards,
      ${invoice.coach.name}
    `;

    // Send email with attachment
    await sendEmail({
      to: emailTo,
      cc: request.email_cc,
      subject: subject,
      text: message,
      attachments: request.include_pdf !== false ? [{
        filename: `invoice-${invoice.invoice_number}.pdf`,
        content: pdfBuffer
      }] : undefined
    });

    // Update invoice status to sent
    await supabase
      .from('invoices')
      .update({
        status: 'sent',
        updated_at: new Date()
      })
      .eq('id', request.invoice_id);
  }

  // Record payment for an invoice
  async recordPayment(request: RecordInvoicePaymentRequest): Promise<InvoicePayment> {
    // Get current invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', request.invoice_id)
      .single();

    if (invoiceError) throw invoiceError;

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: request.invoice_id,
        payment_id: request.payment_id,
        amount_cents: request.amount_cents,
        payment_method: request.payment_method,
        payment_date: request.payment_date ? new Date(request.payment_date) : new Date(),
        transaction_reference: request.transaction_reference,
        notes: request.notes
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update invoice totals and status
    const newAmountPaid = invoice.amount_paid_cents + request.amount_cents;
    const newBalanceDue = invoice.total_cents - newAmountPaid;

    let newStatus = invoice.status;
    if (newBalanceDue <= 0) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'partially_paid';
    }

    await supabase
      .from('invoices')
      .update({
        amount_paid_cents: newAmountPaid,
        balance_due_cents: newBalanceDue,
        status: newStatus,
        paid_date: newBalanceDue <= 0 ? new Date() : null,
        updated_at: new Date()
      })
      .eq('id', request.invoice_id);

    return payment;
  }

  // Get invoice by ID
  async getInvoice(invoiceId: string): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*),
        payments:invoice_payments(*),
        client:clients(*),
        coach:coaches(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (error) throw error;

    return data;
  }

  // Get invoices for a coach
  async getCoachInvoices(coachId: string, filters?: {
    status?: string;
    clientId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<InvoiceSummary[]> {
    let query = supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        client:clients(name),
        coach:coaches(name),
        total_cents,
        balance_due_cents,
        status,
        issue_date,
        due_date
      `)
      .eq('coach_id', coachId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    if (filters?.dateFrom) {
      query = query.gte('issue_date', filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      query = query.lte('issue_date', filters.dateTo.toISOString());
    }

    const { data, error } = await query
      .order('issue_date', { ascending: false });

    if (error) throw error;

    return data.map((invoice: any) => ({
      ...invoice,
      client_name: invoice.client?.name || `${invoice.client?.first_name} ${invoice.client?.last_name}`,
      coach_name: invoice.coach?.name || `${invoice.coach?.first_name} ${invoice.coach?.last_name}`,
      is_overdue: invoice.status === 'pending' && new Date(invoice.due_date) < new Date()
    }));
  }

  // Get invoice metrics
  async getInvoiceMetrics(coachId?: string, dateFrom?: Date, dateTo?: Date): Promise<InvoiceMetrics> {
    let query = supabase
      .from('invoices')
      .select('*');

    if (coachId) {
      query = query.eq('coach_id', coachId);
    }
    if (dateFrom) {
      query = query.gte('issue_date', dateFrom.toISOString());
    }
    if (dateTo) {
      query = query.lte('issue_date', dateTo.toISOString());
    }

    const { data: invoices, error } = await query;

    if (error) throw error;

    const now = new Date();
    const metrics: InvoiceMetrics = {
      total_invoices: invoices.length,
      total_amount_cents: 0,
      total_paid_cents: 0,
      total_outstanding_cents: 0,
      overdue_invoices: 0,
      overdue_amount_cents: 0,
      average_payment_time_days: 0,
      payment_success_rate: 0
    };

    let totalPaymentDays = 0;
    let paidInvoicesCount = 0;

    for (const invoice of invoices) {
      metrics.total_amount_cents += invoice.total_cents;
      metrics.total_paid_cents += invoice.amount_paid_cents;
      metrics.total_outstanding_cents += invoice.balance_due_cents;

      if (invoice.status === 'overdue' ||
          (invoice.status === 'pending' && new Date(invoice.due_date) < now)) {
        metrics.overdue_invoices++;
        metrics.overdue_amount_cents += invoice.balance_due_cents;
      }

      if (invoice.paid_date) {
        paidInvoicesCount++;
        const paymentDays = Math.floor(
          (new Date(invoice.paid_date).getTime() - new Date(invoice.issue_date).getTime())
          / (1000 * 60 * 60 * 24)
        );
        totalPaymentDays += paymentDays;
      }
    }

    if (paidInvoicesCount > 0) {
      metrics.average_payment_time_days = Math.round(totalPaymentDays / paidInvoicesCount);
      metrics.payment_success_rate = (paidInvoicesCount / invoices.length) * 100;
    }

    return metrics;
  }

  // Create recurring invoice
  async createRecurringInvoice(request: CreateRecurringInvoiceRequest): Promise<RecurringInvoice> {
    // Calculate totals
    let subtotal = 0;
    for (const item of request.items) {
      const itemAmount = item.quantity * item.unit_price_cents;
      const discountAmount = item.discount_percentage
        ? Math.round(itemAmount * item.discount_percentage / 100)
        : 0;
      subtotal += itemAmount - discountAmount;
    }

    // Create recurring invoice
    const { data: recurringInvoice, error: recurringError } = await supabase
      .from('recurring_invoices')
      .insert({
        client_id: request.client_id,
        coach_id: request.coach_id,
        frequency: request.frequency,
        start_date: new Date(request.start_date),
        end_date: request.end_date ? new Date(request.end_date) : null,
        next_invoice_date: new Date(request.start_date),
        is_active: true,
        auto_send: request.auto_send || false,
        auto_charge: request.auto_charge || false,
        payment_schedule_id: request.payment_schedule_id,
        subtotal_cents: subtotal,
        tax_rate: request.tax_rate || 0,
        discount_cents: request.discount_cents || 0
      })
      .select()
      .single();

    if (recurringError) throw recurringError;

    // Create recurring invoice items
    const itemsToInsert = request.items.map(item => ({
      recurring_invoice_id: recurringInvoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      tax_rate: item.tax_rate,
      discount_percentage: item.discount_percentage,
      coach_rate_id: item.coach_rate_id
    }));

    await supabase
      .from('recurring_invoice_items')
      .insert(itemsToInsert);

    return recurringInvoice;
  }

  // Process recurring invoices (to be called by cron job)
  async processRecurringInvoices(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active recurring invoices due today
    const { data: recurringInvoices, error } = await supabase
      .from('recurring_invoices')
      .select(`
        *,
        items:recurring_invoice_items(*)
      `)
      .eq('is_active', true)
      .lte('next_invoice_date', today.toISOString());

    if (error) throw error;

    for (const recurring of recurringInvoices) {
      try {
        // Create invoice from recurring template
        const invoiceRequest: CreateInvoiceRequest = {
          client_id: recurring.client_id,
          coach_id: recurring.coach_id,
          due_date: this.calculateDueDate(today, 30).toISOString(),
          items: recurring.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
            tax_rate: item.tax_rate,
            discount_percentage: item.discount_percentage,
            coach_rate_id: item.coach_rate_id
          })),
          tax_rate: recurring.tax_rate,
          discount_cents: recurring.discount_cents,
          send_immediately: recurring.auto_send
        };

        const invoice = await this.createInvoice(invoiceRequest);

        // Calculate next invoice date
        const nextDate = this.calculateNextInvoiceDate(
          new Date(recurring.next_invoice_date),
          recurring.frequency
        );

        // Update recurring invoice
        await supabase
          .from('recurring_invoices')
          .update({
            last_invoice_date: today,
            next_invoice_date: nextDate,
            updated_at: new Date()
          })
          .eq('id', recurring.id);

        // Check if end date reached
        if (recurring.end_date && nextDate > new Date(recurring.end_date)) {
          await supabase
            .from('recurring_invoices')
            .update({
              is_active: false,
              updated_at: new Date()
            })
            .eq('id', recurring.id);
        }
      } catch (error) {
        console.error(`Failed to process recurring invoice ${recurring.id}:`, error);
      }
    }
  }

  // Helper functions
  private calculateDueDate(issueDate: Date, termsDays: number): Date {
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + termsDays);
    return dueDate;
  }

  private calculateNextInvoiceDate(currentDate: Date, frequency: string): Date {
    const nextDate = new Date(currentDate);

    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'annually':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }

  // Check for overdue invoices
  async checkOverdueInvoices(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update overdue invoices
    await supabase
      .from('invoices')
      .update({
        status: 'overdue',
        updated_at: new Date()
      })
      .in('status', ['pending', 'sent'])
      .lt('due_date', today.toISOString());

    // Get overdue invoices for reminders
    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        coach:coaches(*)
      `)
      .eq('status', 'overdue');

    // Send overdue reminders
    for (const invoice of overdueInvoices || []) {
      // Check if reminder already sent today
      const { data: existingReminder } = await supabase
        .from('invoice_reminders')
        .select('*')
        .eq('invoice_id', invoice.id)
        .eq('reminder_type', 'overdue')
        .gte('created_at', today.toISOString())
        .single();

      if (!existingReminder) {
        // Send overdue reminder
        await this.sendInvoiceReminder(invoice, 'overdue');

        // Record reminder
        await supabase
          .from('invoice_reminders')
          .insert({
            invoice_id: invoice.id,
            reminder_type: 'overdue',
            days_offset: 0,
            sent_at: new Date(),
            status: 'sent'
          });
      }
    }
  }

  private async sendInvoiceReminder(invoice: any, reminderType: string): Promise<void> {
    const subject = reminderType === 'overdue'
      ? `Overdue Invoice ${invoice.invoice_number}`
      : `Invoice ${invoice.invoice_number} Due Soon`;

    const message = reminderType === 'overdue'
      ? `Dear ${invoice.client.name},

This is a reminder that invoice ${invoice.invoice_number} is now overdue.

Amount Due: $${(invoice.balance_due_cents / 100).toFixed(2)}
Original Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

Please arrange payment at your earliest convenience.

Thank you,
${invoice.coach.name}`
      : `Dear ${invoice.client.name},

This is a reminder that invoice ${invoice.invoice_number} is due soon.

Amount Due: $${(invoice.balance_due_cents / 100).toFixed(2)}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

Thank you,
${invoice.coach.name}`;

    await sendEmail({
      to: [invoice.client.email],
      subject: subject,
      text: message
    });
  }
}

export const invoiceService = new InvoiceService();