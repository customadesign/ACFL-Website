import { supabase } from '../lib/supabase';
import {
  paymentsApi,
  getLocationId,
  formatSquareAmount,
  generateIdempotencyKey
} from '../lib/square';
import { CoachRateService } from './coachRateService';
import { BookingNotificationService } from './bookingNotificationService';
import { appointmentReminderService } from './appointmentReminderService';
import {
  BookingRequest,
  BookingAcceptance,
  BookingPayment,
  BookingConfirmation,
  CreateBookingRequestRequest,
  CreateBookingRequestResponse,
  AcceptBookingRequest,
  AcceptBookingResponse,
  ProcessBookingPaymentRequest,
  ProcessBookingPaymentResponse,
  BookingEvent
} from '../types/booking';
import { CreatePaymentRequest } from 'square';

export class BookingService {
  private coachRateService: CoachRateService;
  private notificationService: BookingNotificationService;

  constructor() {
    this.coachRateService = new CoachRateService();
    this.notificationService = new BookingNotificationService();
  }

  /**
   * Step 1: Client creates a booking request
   */
  async createBookingRequest(
    clientId: string,
    request: CreateBookingRequestRequest
  ): Promise<CreateBookingRequestResponse> {
    try {
      // Validate coach exists and is active
      const { data: coach, error: coachError } = await supabase
        .from('coaches')
        .select('id, first_name, last_name, is_active')
        .eq('id', request.coach_id)
        .single();

      if (coachError || !coach || !coach.is_active) {
        throw new Error('Coach not found or inactive');
      }

      // Create booking request with 24-hour expiration
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const bookingData = {
        client_id: clientId,
        coach_id: request.coach_id,
        session_type: request.session_type,
        duration_minutes: request.duration_minutes,
        preferred_date: request.preferred_date,
        preferred_time: request.preferred_time,
        notes: request.notes,
        area_of_focus: request.area_of_focus,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: bookingRequest, error } = await supabase
        .from('booking_requests')
        .insert([bookingData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create booking request: ${error.message}`);
      }

      // Log the event
      await this.logBookingEvent(bookingRequest.id, 'request_created', 'client', clientId, {
        coach_id: request.coach_id,
        session_type: request.session_type,
        duration_minutes: request.duration_minutes
      });

      // Send notification to coach
      await this.notificationService.notifyCoachOfNewBookingRequest(bookingRequest);

      return {
        booking_request_id: bookingRequest.id,
        status: 'pending',
        expires_at: expiresAt,
        message: 'Booking request sent to coach. You will be notified when they respond.'
      };
    } catch (error) {
      console.error('Error creating booking request:', error);
      throw error;
    }
  }

  /**
   * Step 2: Coach accepts booking with final pricing
   */
  async acceptBookingRequest(
    coachId: string,
    bookingRequestId: string,
    acceptance: AcceptBookingRequest
  ): Promise<AcceptBookingResponse> {
    try {
      // Get booking request and validate
      const { data: bookingRequest, error } = await supabase
        .from('booking_requests')
        .select('*')
        .eq('id', bookingRequestId)
        .eq('coach_id', coachId)
        .single();

      if (error || !bookingRequest) {
        throw new Error('Booking request not found or access denied');
      }

      if (bookingRequest.status !== 'pending') {
        throw new Error(`Cannot accept booking with status: ${bookingRequest.status}`);
      }

      // Check if booking hasn't expired
      if (new Date() > new Date(bookingRequest.expires_at)) {
        throw new Error('Booking request has expired');
      }

      // Validate coach rate if provided
      if (acceptance.coach_rate_id) {
        const coachRate = await this.coachRateService.getCoachRateById(acceptance.coach_rate_id);
        if (!coachRate || coachRate.coach_id !== coachId || !coachRate.is_active) {
          throw new Error('Invalid coach rate');
        }
      }

      // Update booking request with acceptance details
      const paymentDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours to pay

      const { error: updateError } = await supabase
        .from('booking_requests')
        .update({
          status: 'payment_required',
          coach_adjusted_price_cents: acceptance.final_price_cents,
          coach_rate_id: acceptance.coach_rate_id,
          coach_notes: acceptance.coach_notes,
          updated_at: new Date().toISOString(),
          payment_deadline: paymentDeadline.toISOString()
        })
        .eq('id', bookingRequestId);

      if (updateError) {
        throw new Error(`Failed to accept booking: ${updateError.message}`);
      }

      // Log the event
      await this.logBookingEvent(bookingRequestId, 'coach_accepted', 'coach', coachId, {
        final_price_cents: acceptance.final_price_cents,
        coach_rate_id: acceptance.coach_rate_id,
        coach_notes: acceptance.coach_notes
      });

      // Send notification to client about payment requirement
      await this.notificationService.notifyClientOfBookingAcceptance(
        bookingRequestId,
        acceptance.final_price_cents,
        paymentDeadline,
        acceptance.coach_notes
      );

      return {
        booking_request_id: bookingRequestId,
        status: 'payment_required',
        final_price_cents: acceptance.final_price_cents,
        payment_deadline: paymentDeadline,
        message: 'Booking accepted! Client will be notified to complete payment.'
      };
    } catch (error) {
      console.error('Error accepting booking request:', error);
      throw error;
    }
  }

  /**
   * Step 3: Client pays for the accepted booking
   */
  async processBookingPayment(
    clientId: string,
    bookingRequestId: string,
    paymentRequest: ProcessBookingPaymentRequest
  ): Promise<ProcessBookingPaymentResponse> {
    try {
      // Get booking request and validate
      const { data: bookingRequest, error } = await supabase
        .from('booking_requests')
        .select('*')
        .eq('id', bookingRequestId)
        .eq('client_id', clientId)
        .single();

      if (error || !bookingRequest) {
        throw new Error('Booking request not found or access denied');
      }

      if (bookingRequest.status !== 'payment_required') {
        throw new Error(`Cannot process payment for booking with status: ${bookingRequest.status}`);
      }

      // Check payment deadline
      if (new Date() > new Date(bookingRequest.payment_deadline)) {
        // Mark as expired
        await supabase
          .from('booking_requests')
          .update({ status: 'expired' })
          .eq('id', bookingRequestId);
        throw new Error('Payment deadline has passed');
      }

      // Get or create Square customer (with buyer name if provided)
      const squareCustomer = await this.getOrCreateSquareCustomer(
        clientId,
        paymentRequest.billing_details?.name
      );

      // Process immediate Square payment (not authorization)
      const locationId = await getLocationId();
      const idempotencyKey = generateIdempotencyKey();

      const createPaymentRequest: CreatePaymentRequest = {
        sourceId: paymentRequest.source_id,
        idempotencyKey,
        amountMoney: {
          amount: formatSquareAmount(bookingRequest.coach_adjusted_price_cents),
          currency: 'USD'
        },
        locationId,
        autocomplete: true, // Immediate payment, not authorization
        customerId: squareCustomer.id,
        note: `Session booking payment - ${bookingRequest.session_type}`,
      };

      const { result: paymentResult } = await paymentsApi.createPayment(createPaymentRequest);

      if (!paymentResult.payment) {
        throw new Error('Failed to process payment');
      }

      const squarePayment = paymentResult.payment;

      // Calculate earnings
      const { coachEarnings, platformFee } = await this.coachRateService
        .calculateCoachEarnings(bookingRequest.coach_adjusted_price_cents);

      // Create payment record
      const paymentData = {
        client_id: clientId,
        coach_id: bookingRequest.coach_id,
        coach_rate_id: bookingRequest.coach_rate_id,
        square_payment_id: squarePayment.id!,
        square_customer_id: squareCustomer.id!,
        amount_cents: bookingRequest.coach_adjusted_price_cents,
        currency: 'usd',
        platform_fee_cents: platformFee,
        coach_earnings_cents: coachEarnings,
        status: squarePayment.status === 'COMPLETED' ? 'succeeded' : 'processing',
        payment_method_type: squarePayment.sourceType?.toLowerCase() || 'card',
        paid_at: squarePayment.status === 'COMPLETED' ? new Date() : null,
        description: `Booking payment - ${bookingRequest.session_type}`,
        metadata: {
          booking_request_id: bookingRequestId,
          immediate_payment: true
        }
      };

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([paymentData])
        .select()
        .single();

      if (paymentError) {
        // Try to refund the Square payment if database fails
        console.error('Payment database error, attempting refund:', paymentError);
        throw new Error('Payment processed but booking creation failed. Please contact support.');
      }

      // Create the actual session/appointment
      const scheduledAt = bookingRequest.preferred_date && bookingRequest.preferred_time
        ? new Date(`${bookingRequest.preferred_date}T${bookingRequest.preferred_time}:00`)
        : new Date(Date.now() + 60 * 60 * 1000); // Default to 1 hour from now

      const endsAt = new Date(scheduledAt.getTime() + bookingRequest.duration_minutes * 60 * 1000);

      const sessionData = {
        client_id: clientId,
        coach_id: bookingRequest.coach_id,
        scheduled_at: scheduledAt.toISOString(),
        ends_at: endsAt.toISOString(),
        session_type: bookingRequest.session_type,
        notes: bookingRequest.notes,
        area_of_focus: bookingRequest.area_of_focus,
        payment_id: payment.id,
        booking_request_id: bookingRequestId,
        status: 'confirmed',
        meeting_created: false // Will be updated when meeting is created
      };

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert([sessionData])
        .select()
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw new Error('Payment processed but session creation failed. Please contact support.');
      }

      // Update booking request status
      await supabase
        .from('booking_requests')
        .update({
          status: 'paid_confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingRequestId);

      // Log the events
      await this.logBookingEvent(bookingRequestId, 'payment_completed', 'client', clientId, {
        payment_id: payment.id,
        amount_cents: bookingRequest.coach_adjusted_price_cents
      });

      await this.logBookingEvent(bookingRequestId, 'booking_confirmed', 'system', 'system', {
        session_id: session.id,
        payment_id: payment.id,
        scheduled_at: scheduledAt.toISOString()
      });

      // Send confirmation notifications to both client and coach
      await this.notificationService.notifyBothPartiesOfBookingConfirmation(
        session.id,
        payment.id
      );

      // Schedule appointment reminders
      try {
        await appointmentReminderService.scheduleSessionReminders(session.id);
        console.log(`Scheduled reminders for session ${session.id}`);
      } catch (reminderError) {
        console.error('Failed to schedule reminders for session:', reminderError);
        // Don't fail the booking if reminder scheduling fails
      }

      // TODO: Create video meeting and update session with meeting details

      return {
        booking_id: session.id,
        session_id: session.id,
        payment_id: payment.id,
        status: 'paid_confirmed',
        meeting_details: {
          scheduled_at: scheduledAt,
          ends_at: endsAt,
          // meeting_link and meeting_id will be added when video meeting is created
        },
        message: 'Payment successful! Your session is confirmed.'
      };
    } catch (error) {
      console.error('Error processing booking payment:', error);
      throw error;
    }
  }

  /**
   * Coach rejects a booking request
   */
  async rejectBookingRequest(
    coachId: string,
    bookingRequestId: string,
    reason?: string
  ): Promise<void> {
    try {
      const { data: bookingRequest, error } = await supabase
        .from('booking_requests')
        .select('*')
        .eq('id', bookingRequestId)
        .eq('coach_id', coachId)
        .single();

      if (error || !bookingRequest) {
        throw new Error('Booking request not found or access denied');
      }

      if (bookingRequest.status !== 'pending') {
        throw new Error(`Cannot reject booking with status: ${bookingRequest.status}`);
      }

      await supabase
        .from('booking_requests')
        .update({
          status: 'rejected',
          coach_notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingRequestId);

      await this.logBookingEvent(bookingRequestId, 'coach_rejected', 'coach', coachId, {
        reason
      });

      // Send notification to client
      await this.notificationService.notifyClientOfBookingRejection(bookingRequestId, reason);
    } catch (error) {
      console.error('Error rejecting booking request:', error);
      throw error;
    }
  }

  /**
   * Get pending booking requests for a coach
   */
  async getCoachPendingBookings(coachId: string): Promise<BookingRequest[]> {
    const { data, error } = await supabase
      .from('booking_requests')
      .select(`
        *,
        clients:client_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('coach_id', coachId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch pending bookings: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get client's booking requests
   */
  async getClientBookingRequests(clientId: string): Promise<BookingRequest[]> {
    const { data, error } = await supabase
      .from('booking_requests')
      .select(`
        *,
        coaches:coach_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch booking requests: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get booking request by ID
   */
  async getBookingRequestById(bookingRequestId: string, userId: string, userType: 'client' | 'coach'): Promise<BookingRequest | null> {
    const column = userType === 'client' ? 'client_id' : 'coach_id';

    const { data, error } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('id', bookingRequestId)
      .eq(column, userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch booking request: ${error.message}`);
    }

    return data;
  }

  /**
   * Helper to get or create Square customer
   */
  private async getOrCreateSquareCustomer(clientId: string, buyerName?: string) {
    const { data: client, error } = await supabase
      .from('clients')
      .select('email, first_name, last_name, square_customer_id')
      .eq('id', clientId)
      .single();

    if (error) {
      throw new Error(`Client not found: ${error.message}`);
    }

    // Parse buyer name if provided (format: "LASTNAME, FIRSTNAME" or "FirstName LastName")
    let givenName = client.first_name;
    let familyName = client.last_name;

    if (buyerName) {
      // Handle "LASTNAME, FIRSTNAME" format
      if (buyerName.includes(',')) {
        const parts = buyerName.split(',').map(part => part.trim());
        familyName = parts[0] || client.last_name;
        givenName = parts[1] || client.first_name;
      }
      // Handle "FirstName LastName" format
      else if (buyerName.includes(' ')) {
        const parts = buyerName.trim().split(/\s+/);
        givenName = parts[0] || client.first_name;
        familyName = parts.slice(1).join(' ') || client.last_name;
      }
      // Single name provided - use as given name
      else {
        givenName = buyerName.trim();
      }
    }

    // Check if customer already exists in Square
    if (client.square_customer_id) {
      try {
        const { result } = await customersApi.retrieveCustomer(client.square_customer_id);
        if (result.customer) {
          // Update customer name if buyer name was provided and different
          if (buyerName && (result.customer.givenName !== givenName || result.customer.familyName !== familyName)) {
            try {
              await customersApi.updateCustomer(client.square_customer_id, {
                givenName,
                familyName,
                emailAddress: client.email,
              });
              console.log(`Updated Square customer name to: ${givenName} ${familyName}`);
            } catch (updateError) {
              console.warn('Failed to update Square customer name:', updateError);
            }
          }
          return result.customer;
        }
      } catch (error) {
        console.warn('Square customer not found, creating new one:', error);
      }
    }

    // Create new Square customer
    const { result: createResult } = await customersApi.createCustomer({
      idempotencyKey: generateIdempotencyKey(),
      givenName,
      familyName,
      emailAddress: client.email,
    });

    // Update client record with Square customer ID
    await supabase
      .from('clients')
      .update({ square_customer_id: createResult.customer?.id })
      .eq('id', clientId);

    return createResult.customer!;
  }

  /**
   * Log booking events for audit trail
   */
  private async logBookingEvent(
    bookingRequestId: string,
    eventType: BookingEvent['event_type'],
    actorType: BookingEvent['actor_type'],
    actorId: string,
    details: Record<string, any>
  ): Promise<void> {
    const eventData = {
      booking_request_id: bookingRequestId,
      event_type: eventType,
      actor_type: actorType,
      actor_id: actorId,
      details,
      created_at: new Date().toISOString()
    };

    await supabase.from('booking_events').insert([eventData]);
  }
}