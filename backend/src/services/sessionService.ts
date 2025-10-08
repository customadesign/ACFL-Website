import { supabase } from '../lib/supabase';
import { invoiceService } from './invoiceService';
import { CreateInvoiceWithTaxRequest } from '../types/invoice';

export interface CompleteSessionRequest {
  session_id: string;
  session_notes?: string;
  auto_capture_payment?: boolean;
  generate_invoice?: boolean;
}

export interface Session {
  id: string;
  coach_id: string;
  client_id: string;
  payment_id?: string;
  booking_id?: string;
  session_date: Date;
  duration_minutes: number;
  status: string;
  session_notes?: string;
  session_type?: string;
  area_of_focus?: string;
  completion_confirmed_by?: string;
  completed_at?: Date;
  created_at: Date;
  updated_at?: Date;
}

export class SessionService {
  /**
   * Complete a session and automatically generate an invoice
   */
  async completeSession(
    request: CompleteSessionRequest,
    completedBy: string
  ): Promise<{ session: Session; invoice?: any }> {
    try {
      // 1. Get session details with related booking and payment info
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          bookings:booking_id (
            id,
            coach_rate_id,
            coach_adjusted_price_cents,
            session_type,
            area_of_focus
          ),
          payments:payment_id (
            id,
            amount_cents,
            coach_earnings_cents,
            platform_fee_cents,
            payment_method,
            stripe_payment_intent_id,
            square_payment_id
          ),
          coaches:coach_id (
            id,
            first_name,
            last_name,
            email,
            business_name,
            business_tax_id
          ),
          clients:client_id (
            id,
            first_name,
            last_name,
            email,
            address
          )
        `)
        .eq('id', request.session_id)
        .single();

      if (sessionError || !session) {
        throw new Error(`Session not found: ${request.session_id}`);
      }

      // Check if session is already completed
      if (session.status === 'completed') {
        throw new Error('Session is already completed');
      }

      // 2. Update session status to completed
      const { data: updatedSession, error: updateError } = await supabase
        .from('sessions')
        .update({
          status: 'completed',
          session_notes: request.session_notes || session.session_notes,
          completion_confirmed_by: completedBy,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', request.session_id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update session: ${updateError.message}`);
      }

      // 3. Capture payment if using authorization flow
      if (request.auto_capture_payment && session.payments) {
        // This would integrate with your payment service
        // For now, we'll assume payment is already captured
        console.log('Payment capture would happen here for payment:', session.payment_id);
      }

      // 4. Generate invoice automatically
      let invoice = null;
      if (request.generate_invoice !== false) { // Default to true
        invoice = await this.generateInvoiceForSession(
          updatedSession,
          session.bookings,
          session.payments,
          session.coaches,
          session.clients
        );
      }

      // 5. Send notifications
      await this.sendSessionCompletionNotifications(
        updatedSession,
        session.coaches,
        session.clients,
        invoice
      );

      return {
        session: updatedSession,
        invoice
      };
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  }

  /**
   * Generate an invoice for a completed session
   */
  private async generateInvoiceForSession(
    session: Session,
    booking: any,
    payment: any,
    coach: any,
    client: any
  ): Promise<any> {
    try {
      // Determine the price from booking or payment
      const priceInCents = booking?.coach_adjusted_price_cents ||
                           payment?.coach_earnings_cents ||
                           payment?.amount_cents || 0;

      // Build invoice request
      const invoiceRequest: CreateInvoiceWithTaxRequest = {
        client_id: session.client_id,
        coach_id: session.coach_id,
        booking_id: booking?.id,
        payment_id: payment?.id,
        due_date: new Date().toISOString(), // Due upon receipt
        items: [{
          description: this.buildServiceDescription(session, booking),
          quantity: 1,
          unit_price_cents: priceInCents,
          service_date: session.session_date.toString(),
          service_type: booking?.session_type || 'coaching_session',
          session_duration_minutes: session.duration_minutes,
          session_id: session.id,
          taxable: true,
          tax_category: 'professional_services'
        }],
        payment_terms: 'Due upon receipt',
        notes: session.session_notes,
        // Add tax information if available
        client_address: client.address || undefined,
        business_name: coach.business_name || undefined,
        business_tax_id: coach.business_tax_id || undefined
      };

      // Create the invoice with tax calculation (session completion only)
      const invoice = await invoiceService.createInvoiceWithTax(invoiceRequest);

      // If payment already exists, record it against the invoice
      if (payment && payment.amount_cents > 0) {
        await invoiceService.recordPayment({
          invoice_id: invoice.id,
          amount_cents: payment.amount_cents,
          payment_method: payment.payment_method || 'square',
          payment_date: new Date().toISOString(),
          payment_id: payment.id,
          transaction_reference: payment.stripe_payment_intent_id || payment.square_payment_id,
          notes: 'Automatic payment recording from session completion'
        });
      }

      return invoice;
    } catch (error) {
      console.error('Error generating invoice for session:', error);
      // Don't throw - invoice generation failure shouldn't fail session completion
      return null;
    }
  }

  /**
   * Build a descriptive service description for the invoice
   */
  private buildServiceDescription(session: any, booking: any): string {
    const sessionType = booking?.session_type || 'Coaching Session';
    const areaOfFocus = booking?.area_of_focus || session.area_of_focus;
    const duration = session.duration_minutes;

    let description = `${sessionType} - ${duration} minutes`;

    if (areaOfFocus) {
      description += `\nArea of Focus: ${areaOfFocus}`;
    }

    if (session.session_notes) {
      description += `\nSession Notes: ${session.session_notes}`;
    }

    const sessionDate = new Date(session.session_date);
    description += `\nSession Date: ${sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`;

    return description;
  }

  /**
   * Send notifications about session completion
   */
  private async sendSessionCompletionNotifications(
    session: Session,
    coach: any,
    client: any,
    invoice: any
  ): Promise<void> {
    try {
      // Send email to client with invoice
      if (invoice && client.email) {
        await invoiceService.sendInvoice({
          invoice_id: invoice.id,
          email_to: [client.email],
          email_subject: `Invoice for your coaching session with ${coach.first_name} ${coach.last_name}`,
          email_message: `
            Dear ${client.first_name},

            Thank you for completing your coaching session. Your invoice is attached.

            Session Details:
            - Date: ${new Date(session.session_date).toLocaleDateString()}
            - Duration: ${session.duration_minutes} minutes
            - Coach: ${coach.first_name} ${coach.last_name}

            Best regards,
            ACT Coaching Platform
          `,
          include_pdf: true
        });
      }

      // Log notification for coach
      console.log(`Session completion notification sent for session ${session.id}`);
    } catch (error) {
      console.error('Error sending session completion notifications:', error);
      // Don't throw - notification failure shouldn't fail the process
    }
  }

  /**
   * Get all sessions for a coach
   */
  async getCoachSessions(coachId: string, status?: string): Promise<Session[]> {
    try {
      let query = supabase
        .from('sessions')
        .select(`
          *,
          clients:client_id (
            id,
            first_name,
            last_name,
            email
          ),
          invoices (
            id,
            invoice_number,
            total_cents,
            status
          )
        `)
        .eq('coach_id', coachId)
        .order('session_date', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching coach sessions:', error);
      throw error;
    }
  }

  /**
   * Get all sessions for a client
   */
  async getClientSessions(clientId: string, status?: string): Promise<Session[]> {
    try {
      let query = supabase
        .from('sessions')
        .select(`
          *,
          coaches:coach_id (
            id,
            first_name,
            last_name,
            email
          ),
          invoices (
            id,
            invoice_number,
            total_cents,
            status
          )
        `)
        .eq('client_id', clientId)
        .order('session_date', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching client sessions:', error);
      throw error;
    }
  }

  /**
   * Get session by ID with invoice
   */
  async getSessionWithInvoice(sessionId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          coaches:coach_id (
            id,
            first_name,
            last_name,
            email
          ),
          clients:client_id (
            id,
            first_name,
            last_name,
            email
          ),
          invoices (
            *
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching session with invoice:', error);
      throw error;
    }
  }
}

export const sessionService = new SessionService();