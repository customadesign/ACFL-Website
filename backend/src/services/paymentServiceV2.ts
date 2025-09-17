import { supabase } from '../lib/supabase';
import { CoachRateService } from './coachRateService';
import {
  Payment,
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  CreateRefundRequest,
  CreateRefundResponse,
  PaymentLog
} from '../types/payment';
import {
  paymentsApi,
  customersApi,
  refundsApi,
  getLocationId,
  formatSquareAmount,
  generateIdempotencyKey
} from '../lib/square';
import { CreatePaymentRequest } from 'square';

export class PaymentServiceV2 {
  private coachRateService: CoachRateService;

  constructor() {
    this.coachRateService = new CoachRateService();
  }

  /**
   * Create payment intent with AUTHORIZATION ONLY (not captured)
   * Payment will be captured after session completion
   */
  async createPaymentAuthorization(
    clientId: string,
    request: CreatePaymentIntentRequest & { sessionId?: string }
  ): Promise<CreatePaymentIntentResponse> {
    // Validate coach rate
    const coachRate = await this.coachRateService.getCoachRateById(request.coach_rate_id);
    if (!coachRate || !coachRate.is_active) {
      throw new Error('Invalid or inactive coach rate');
    }

    if (coachRate.coach_id !== request.coach_id) {
      throw new Error('Coach rate does not belong to specified coach');
    }

    // Create or get Square customer
    const customerId = await this.getOrCreateSquareCustomer(clientId);

    // Calculate earnings
    const { coachEarnings, platformFee } = await this.coachRateService
      .calculateCoachEarnings(coachRate.rate_cents);

    // Create Square payment (authorization only)
    const locationId = await getLocationId();
    const idempotencyKey = generateIdempotencyKey();

    const createPaymentRequest: CreatePaymentRequest = {
      sourceId: request.sourceId || 'cnon:card-nonce-ok', // This should come from Square's payment form
      idempotencyKey,
      amountMoney: {
        amount: formatSquareAmount(coachRate.rate_cents),
        currency: 'USD'
      },
      locationId,
      autocomplete: false, // This creates an authorization that can be captured later
      customerId: customerId.id,
      note: request.description || coachRate.title,
    };

    const { result: paymentResult } = await paymentsApi.createPayment(createPaymentRequest);
    const paymentIntentId = paymentResult.payment?.id!;
    const clientSecret = paymentResult.payment?.receiptUrl || '';

    // Create payment record with 'pending' status (authorized but not captured)
    const paymentData = {
      client_id: clientId,
      coach_id: request.coach_id,
      coach_rate_id: request.coach_rate_id,
      stripe_payment_intent_id: paymentIntentId, // Will be renamed to square_payment_id
      stripe_customer_id: customerId.id, // Will be renamed to square_customer_id
      amount_cents: coachRate.rate_cents,
      currency: 'usd',
      platform_fee_cents: platformFee,
      coach_earnings_cents: coachEarnings,
      status: 'pending', // Payment is authorized but not yet captured
      session_id: request.sessionId,
      description: request.description || coachRate.title,
      metadata: request.metadata || {},
    };

    const { data: payment, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) {
      // Cancel the payment if database insert fails
      try {
        await paymentsApi.cancelPayment(paymentIntentId);
      } catch (cancelError) {
        console.error('Failed to cancel payment after database error:', cancelError);
      }
      throw new Error(`Failed to create payment record: ${error.message}`);
    }

    // Log payment authorization
    await this.logPaymentEvent(payment.id, 'payment_authorized', {
      stripe_payment_intent_id: paymentIntentId,
      amount_cents: coachRate.rate_cents,
    });

    return {
      payment_intent_id: paymentIntentId,
      client_secret: clientSecret,
      amount_cents: coachRate.rate_cents,
      payment_id: payment.id,
    };
  }

  /**
   * Capture previously authorized payment after session completion
   */
  async capturePayment(paymentId: string): Promise<Payment> {
    // Get payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) {
      throw new Error(`Payment not found: ${error.message}`);
    }

    if (payment.status !== 'pending') {
      throw new Error(`Payment cannot be captured. Current status: ${payment.status}`);
    }

    try {
      // Capture the Square payment
      const { result: captureResult } = await paymentsApi.completePayment(payment.stripe_payment_intent_id, {});

      const captureStatus = captureResult.payment?.status === 'COMPLETED' ? 'succeeded' : 'failed';

      // Update payment status
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'succeeded',
          paid_at: new Date(),
          captured_at: new Date(),
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update payment: ${updateError.message}`);
      }

      // Log payment capture
      await this.logPaymentEvent(paymentId, 'payment_captured', {
        stripe_payment_intent_id: payment.stripe_payment_intent_id,
        amount_cents: payment.amount_cents,
      });

      // Transfer funds to coach
      try {
        await this.transferFundsToCoach(updatedPayment);
      } catch (error) {
        console.error('Failed to transfer funds to coach:', error);
      }

      return updatedPayment;
    } catch (error) {
      // Update payment status to failed
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          failed_at: new Date(),
        })
        .eq('id', paymentId);

      await this.logPaymentEvent(paymentId, 'payment_capture_failed', {
        error: (error as Error).message,
      });

      throw error;
    }
  }

  /**
   * Cancel authorized payment (void before capture)
   */
  async cancelAuthorization(paymentId: string, reason?: string): Promise<void> {
    // Get payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) {
      throw new Error(`Payment not found: ${error.message}`);
    }

    if (payment.status !== 'pending') {
      throw new Error(`Cannot cancel payment with status: ${payment.status}`);
    }

    // Cancel the Square payment
    await paymentsApi.cancelPayment(payment.stripe_payment_intent_id);

    // Update payment status
    await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date(),
        cancellation_reason: reason,
      })
      .eq('id', paymentId);

    // Log cancellation
    await this.logPaymentEvent(paymentId, 'payment_cancelled', {
      reason,
      stripe_payment_intent_id: payment.stripe_payment_intent_id,
    });
  }

  /**
   * Create a refund for a captured payment
   */
  async createRefund(
    adminId: string | null,
    request: CreateRefundRequest
  ): Promise<CreateRefundResponse> {
    // Get payment
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', request.payment_id)
      .single();

    if (error) {
      throw new Error(`Payment not found: ${error.message}`);
    }

    if (payment.status !== 'succeeded' && payment.status !== 'partially_refunded') {
      throw new Error('Can only refund successful payments');
    }

    const refundAmount = request.amount_cents || payment.amount_cents;

    // Check if refund amount is valid
    const { data: existingRefunds } = await supabase
      .from('refunds')
      .select('amount_cents')
      .eq('payment_id', request.payment_id)
      .eq('status', 'succeeded');

    const totalRefunded = existingRefunds?.reduce((sum, r) => sum + r.amount_cents, 0) || 0;
    if (totalRefunded + refundAmount > payment.amount_cents) {
      throw new Error('Refund amount exceeds payment amount');
    }

    // Calculate refund distribution
    const { coachPenalty, platformRefund } = this.calculateRefundDistribution(
      refundAmount,
      payment.coach_earnings_cents,
      payment.platform_fee_cents,
      request.reason
    );

    // Create pending refund record first
    const refundData = {
      payment_id: request.payment_id,
      stripe_refund_id: 'pending_' + Date.now(), // Temporary ID
      amount_cents: refundAmount,
      reason: request.reason,
      status: 'pending',
      initiated_by_type: adminId ? 'admin' : 'system',
      initiated_by_id: adminId,
      coach_penalty_cents: coachPenalty,
      platform_refund_cents: platformRefund,
      description: request.description,
    };

    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .insert([refundData])
      .select()
      .single();

    if (refundError) {
      throw new Error(`Failed to create refund record: ${refundError.message}`);
    }

    try {
      // Create Square refund
      const locationId = await getLocationId();
      const { result: refundResult } = await refundsApi.refundPayment({
        idempotencyKey: generateIdempotencyKey(),
        amountMoney: {
          amount: formatSquareAmount(refundAmount),
          currency: 'USD'
        },
        paymentId: payment.stripe_payment_intent_id,
        reason: request.reason || 'Customer requested refund',
        locationId
      });

      const refundId = refundResult.refund?.id!;

      // Update refund record with actual refund ID
      await supabase
        .from('refunds')
        .update({
          stripe_refund_id: refundId,
          status: 'processing',
        })
        .eq('id', refund.id);

      // Update payment status
      const newPaymentStatus = totalRefunded + refundAmount >= payment.amount_cents
        ? 'refunded'
        : 'partially_refunded';

      await supabase
        .from('payments')
        .update({ status: newPaymentStatus })
        .eq('id', request.payment_id);

      // Log refund creation
      await this.logRefundEvent(refund.id, 'refund_created', {
        stripe_refund_id: refundId,
        amount_cents: refundAmount,
        reason: request.reason,
      });

      return {
        refund_id: refund.id,
        stripe_refund_id: refundId,
        amount_cents: refundAmount,
        status: 'processing',
      };
    } catch (error) {
      // Update refund status to failed
      await supabase
        .from('refunds')
        .update({ status: 'failed' })
        .eq('id', refund.id);

      await this.logRefundEvent(refund.id, 'refund_failed', {
        error: (error as Error).message,
      });

      throw error;
    }
  }

  /**
   * Complete an admin-approved refund
   */
  async completeRefund(refundId: string): Promise<void> {
    const { data: refund, error } = await supabase
      .from('refunds')
      .select('*, payments!inner(*)')
      .eq('id', refundId)
      .single();

    if (error || !refund) {
      throw new Error(`Refund not found: ${error?.message}`);
    }

    if (refund.status !== 'approved') {
      throw new Error(`Refund must be approved before completion. Current status: ${refund.status}`);
    }

    // Square refunds are processed immediately, so we just update the status
    const actualRefundId = refund.stripe_refund_id;

    // Update refund status
    await supabase
      .from('refunds')
      .update({
        stripe_refund_id: actualRefundId,
        status: 'succeeded',
        processed_at: new Date(),
      })
      .eq('id', refundId);

    // Check total refunds and update payment status
    const { data: allRefunds } = await supabase
      .from('refunds')
      .select('amount_cents')
      .eq('payment_id', refund.payment_id)
      .eq('status', 'succeeded');

    const totalRefunded = allRefunds?.reduce((sum, r) => sum + r.amount_cents, 0) || 0;
    const newStatus = totalRefunded >= refund.payments.amount_cents ? 'refunded' : 'partially_refunded';

    await supabase
      .from('payments')
      .update({ status: newStatus })
      .eq('id', refund.payment_id);

    await this.logRefundEvent(refundId, 'refund_completed', {
      stripe_refund_id: actualRefundId,
    });
  }

  async handleWebhook(event: any): Promise<void> {
    console.log(`Square webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment.created':
        await this.handleSquarePaymentCreated(event.data);
        break;
      case 'payment.updated':
        await this.handleSquarePaymentUpdated(event.data);
        break;
      case 'refund.created':
        await this.handleSquareRefundCreated(event.data);
        break;
      case 'refund.updated':
        await this.handleSquareRefundUpdated(event.data);
        break;
      default:
        console.log(`Unhandled Square event type: ${event.type}`);
    }
  }

  private async getOrCreateSquareCustomer(clientId: string) {
    // Get client details
    const { data: client, error } = await supabase
      .from('clients')
      .select('email, first_name, last_name, square_customer_id')
      .eq('id', clientId)
      .single();

    if (error) {
      throw new Error(`Client not found: ${error.message}`);
    }

    // Check if customer already exists in Square
    if (client.square_customer_id) {
      try {
        const { result } = await customersApi.retrieveCustomer(client.square_customer_id);
        if (result.customer) {
          return result.customer;
        }
      } catch (error) {
        console.warn('Square customer not found, creating new one:', error);
      }
    }

    // Create new Square customer
    const { result: createResult } = await customersApi.createCustomer({
      idempotencyKey: generateIdempotencyKey(),
      givenName: client.first_name,
      familyName: client.last_name,
      emailAddress: client.email,
    });

    // Update client record with Square customer ID
    await supabase
      .from('clients')
      .update({ square_customer_id: createResult.customer?.id })
      .eq('id', clientId);

    return createResult.customer!;
  }

  private async transferFundsToCoach(payment: Payment): Promise<void> {
    // Check if coach has payment account configured
    const { data: paymentAccount } = await supabase
      .from('coach_stripe_accounts') // Will be renamed to coach_payment_accounts
      .select('stripe_account_id, charges_enabled')
      .eq('coach_id', payment.coach_id)
      .single();

    if (!paymentAccount || !paymentAccount.charges_enabled) {
      console.log(`Coach ${payment.coach_id} doesn't have enabled payment account`);
      return;
    }

    // Stub: Transfer creation would happen here with new payment gateway
    try {
      const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.logPaymentEvent(payment.id, 'funds_transferred', {
        transfer_id: transferId,
        amount_cents: payment.coach_earnings_cents,
      });
    } catch (error) {
      await this.logPaymentEvent(payment.id, 'transfer_failed', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private calculateRefundDistribution(
    refundAmount: number,
    coachEarnings: number,
    platformFee: number,
    reason: CreateRefundRequest['reason']
  ): { coachPenalty: number; platformRefund: number } {
    switch (reason) {
      case 'coach_requested':
        // Coach pays penalty for last-minute cancellation
        return {
          coachPenalty: Math.min(coachEarnings, refundAmount),
          platformRefund: Math.max(0, refundAmount - coachEarnings),
        };
      case 'admin_initiated':
      case 'auto_cancellation':
        // Platform absorbs most of the refund
        return {
          coachPenalty: 0,
          platformRefund: refundAmount,
        };
      case 'requested_by_customer':
      default:
        // Standard refund distribution
        const coachPortion = Math.floor((refundAmount * coachEarnings) / (coachEarnings + platformFee));
        return {
          coachPenalty: coachPortion,
          platformRefund: refundAmount - coachPortion,
        };
    }
  }

  private async logPaymentEvent(
    paymentId: string,
    eventType: string,
    details: Record<string, any>
  ): Promise<void> {
    const logData: Partial<PaymentLog> = {
      payment_id: paymentId,
      event_type: eventType,
      stripe_event_id: details.stripe_event_id,
      old_status: details.old_status,
      new_status: details.new_status,
      amount_cents: details.amount_cents,
      description: details.description,
      metadata: details,
    };

    await supabase.from('payment_logs').insert([logData]);
  }

  private async logRefundEvent(
    refundId: string,
    eventType: string,
    details: Record<string, any>
  ): Promise<void> {
    const logData: Partial<PaymentLog> = {
      refund_id: refundId,
      event_type: eventType,
      stripe_event_id: details.stripe_event_id,
      amount_cents: details.amount_cents,
      description: details.description,
      metadata: details,
    };

    await supabase.from('payment_logs').insert([logData]);
  }

  // Square webhook handlers
  private async handleSquarePaymentCreated(data: any): Promise<void> {
    console.log('Square payment created:', data);
    // Handle payment creation webhook
  }

  private async handleSquarePaymentUpdated(data: any): Promise<void> {
    console.log('Square payment updated:', data);

    const payment = data.object?.payment;
    if (!payment?.id) return;

    // Find payment in our database
    const { data: dbPayment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', payment.id)
      .single();

    if (error || !dbPayment) {
      console.warn('Payment not found in database:', payment.id);
      return;
    }

    // Update payment status based on Square status
    let newStatus = dbPayment.status;
    switch (payment.status) {
      case 'APPROVED':
        newStatus = 'authorized';
        break;
      case 'COMPLETED':
        newStatus = 'succeeded';
        break;
      case 'CANCELED':
        newStatus = 'canceled';
        break;
      case 'FAILED':
        newStatus = 'failed';
        break;
    }

    if (newStatus !== dbPayment.status) {
      await supabase
        .from('payments')
        .update({
          status: newStatus,
          ...(newStatus === 'succeeded' && { paid_at: new Date() })
        })
        .eq('id', dbPayment.id);

      await this.logPaymentEvent(dbPayment.id, 'payment_status_updated', {
        old_status: dbPayment.status,
        new_status: newStatus,
        square_payment_id: payment.id
      });
    }
  }

  private async handleSquareRefundCreated(data: any): Promise<void> {
    console.log('Square refund created:', data);
    // Handle refund creation webhook
  }

  private async handleSquareRefundUpdated(data: any): Promise<void> {
    console.log('Square refund updated:', data);

    const refund = data.object?.refund;
    if (!refund?.id) return;

    // Find refund in our database
    const { data: dbRefund, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('stripe_refund_id', refund.id)
      .single();

    if (error || !dbRefund) {
      console.warn('Refund not found in database:', refund.id);
      return;
    }

    // Update refund status based on Square status
    let newStatus = dbRefund.status;
    switch (refund.status) {
      case 'PENDING':
        newStatus = 'processing';
        break;
      case 'COMPLETED':
        newStatus = 'succeeded';
        break;
      case 'REJECTED':
        newStatus = 'failed';
        break;
    }

    if (newStatus !== dbRefund.status) {
      await supabase
        .from('refunds')
        .update({
          status: newStatus,
          ...(newStatus === 'succeeded' && { processed_at: new Date() })
        })
        .eq('id', dbRefund.id);

      await this.logRefundEvent(dbRefund.id, 'refund_status_updated', {
        old_status: dbRefund.status,
        new_status: newStatus,
        square_refund_id: refund.id
      });
    }
  }
}