import { supabase } from '../lib/supabase';
import { CoachRateService } from './coachRateService';
import { billingService } from './billingService';
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

    // Create or get Square customer (with buyer name if provided)
    const customerId = await this.getOrCreateSquareCustomer(clientId, request.buyer_name);

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
      buyerEmailAddress: request.buyer_email,
    };

    const { result: paymentResult } = await paymentsApi.createPayment(createPaymentRequest);
    const paymentIntentId = paymentResult.payment?.id!;
    const clientSecret = paymentResult.payment?.receiptUrl || '';

    // Create payment record with 'authorized' status (authorized but not captured)
    const paymentData = {
      client_id: clientId,
      coach_id: request.coach_id,
      coach_rate_id: request.coach_rate_id,
      square_payment_id: paymentIntentId, // Using correct Square column name
      square_customer_id: customerId.id, // Using correct Square column name
      amount_cents: coachRate.rate_cents,
      currency: 'usd',
      platform_fee_cents: platformFee,
      coach_earnings_cents: coachEarnings,
      status: 'authorized', // Payment is authorized but not yet captured
      session_id: request.sessionId,
      description: request.description || coachRate.title,
      metadata: {
        ...(request.metadata || {}),
        buyer_name: request.buyer_name,
        buyer_email: request.buyer_email,
      },
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
      square_payment_id: paymentIntentId,
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

    if (payment.status !== 'pending' && payment.status !== 'authorized') {
      throw new Error(`Payment cannot be captured. Current status: ${payment.status}`);
    }

    try {
      console.log(`Capturing payment ${paymentId} with Square payment ID: ${payment.square_payment_id}`);

      // Capture the Square payment
      const { result: captureResult } = await paymentsApi.completePayment(payment.square_payment_id, {});

      console.log(`Square capture result status: ${captureResult.payment?.status}`);
      const captureStatus = captureResult.payment?.status === 'COMPLETED' ? 'succeeded' : 'failed';

      // Update payment status with available fields
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'succeeded',
          paid_at: new Date(),
        })
        .eq('id', paymentId)
        .select()
        .single();

      console.log(`Payment ${paymentId} status updated to succeeded in database`);

      if (updateError) {
        throw new Error(`Failed to update payment: ${updateError.message}`);
      }

      // Log payment capture
      await this.logPaymentEvent(paymentId, 'payment_captured', {
        square_payment_id: payment.square_payment_id,
        amount_cents: payment.amount_cents,
      });

      // Create billing transactions and transfer funds to coach
      try {
        // Create billing transaction for client (payment)
        await billingService.createBillingTransaction({
          user_id: updatedPayment.client_id,
          user_type: 'client',
          transaction_type: 'payment',
          amount_cents: updatedPayment.amount_cents,
          currency: updatedPayment.currency.toUpperCase(),
          status: 'completed',
          description: `Payment to coach: ${updatedPayment.description || 'Coaching session'}`,
          reference_id: updatedPayment.id,
          reference_type: 'payment',
          metadata: {
            coach_id: updatedPayment.coach_id,
            square_payment_id: updatedPayment.square_payment_id
          }
        });

        // Create billing transaction for coach (earning)
        await billingService.createBillingTransaction({
          user_id: updatedPayment.coach_id,
          user_type: 'coach',
          transaction_type: 'payment',
          amount_cents: updatedPayment.coach_earnings_cents,
          currency: updatedPayment.currency.toUpperCase(),
          status: 'completed',
          description: `Earning from client: ${updatedPayment.description || 'Coaching session'}`,
          reference_id: updatedPayment.id,
          reference_type: 'payment',
          metadata: {
            client_id: updatedPayment.client_id,
            platform_fee_cents: updatedPayment.platform_fee_cents,
            square_payment_id: updatedPayment.square_payment_id
          }
        });

        // Create billing transaction for platform fee
        if (updatedPayment.platform_fee_cents > 0) {
          await billingService.createBillingTransaction({
            user_id: updatedPayment.coach_id,
            user_type: 'coach',
            transaction_type: 'fee',
            amount_cents: updatedPayment.platform_fee_cents,
            currency: updatedPayment.currency.toUpperCase(),
            status: 'completed',
            description: `Platform fee for coaching session`,
            reference_id: updatedPayment.id,
            reference_type: 'payment',
            metadata: {
              client_id: updatedPayment.client_id,
              square_payment_id: updatedPayment.square_payment_id
            }
          });
        }

        await this.transferFundsToCoach(updatedPayment);
      } catch (error) {
        console.error('Failed to create billing transactions or transfer funds:', error);
      }

      return updatedPayment;
    } catch (error) {
      // Update payment status to failed
      await supabase
        .from('payments')
        .update({
          status: 'failed',
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

    if (payment.status !== 'pending' && payment.status !== 'authorized') {
      throw new Error(`Cannot cancel payment with status: ${payment.status}`);
    }

    // Cancel the Square payment
    await paymentsApi.cancelPayment(payment.square_payment_id);

    // Update payment status
    await supabase
      .from('payments')
      .update({
        status: 'canceled',
      })
      .eq('id', paymentId);

    // Log cancellation
    await this.logPaymentEvent(paymentId, 'payment_cancelled', {
      reason,
      square_payment_id: payment.square_payment_id,
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
      square_refund_id: 'pending_' + Date.now(), // Temporary ID
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
        paymentId: payment.square_payment_id,
        reason: request.reason || 'Customer requested refund',
        locationId
      });

      const refundId = refundResult.refund?.id!;

      // Update refund record with actual refund ID
      await supabase
        .from('refunds')
        .update({
          square_refund_id: refundId,
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

      // Create billing transactions for the refund
      try {
        await billingService.createBillingTransaction({
          user_id: payment.client_id,
          user_type: 'client',
          transaction_type: 'refund',
          amount_cents: refundAmount,
          currency: payment.currency.toUpperCase(),
          status: 'completed',
          description: `Refund for payment: ${request.reason.replace(/_/g, ' ')}`,
          reference_id: refund.id,
          reference_type: 'refund',
          metadata: {
            payment_id: payment.id,
            square_refund_id: refundId,
            reason: request.reason
          }
        });

        // Create billing transaction for coach (deduction)
        if (coachPenalty > 0) {
          await billingService.createBillingTransaction({
            user_id: payment.coach_id,
            user_type: 'coach',
            transaction_type: 'refund',
            amount_cents: coachPenalty,
            currency: payment.currency.toUpperCase(),
            status: 'completed',
            description: `Refund deduction: ${request.reason.replace(/_/g, ' ')}`,
            reference_id: refund.id,
            reference_type: 'refund',
            metadata: {
              payment_id: payment.id,
              square_refund_id: refundId,
              reason: request.reason
            }
          });
        }
      } catch (error) {
        console.error('Failed to create billing transactions for refund:', error);
        // Don't throw error as refund is still successful
      }

      // Log refund creation
      await this.logRefundEvent(refund.id, 'refund_created', {
        square_refund_id: refundId,
        amount_cents: refundAmount,
        reason: request.reason,
      });

      return {
        refund_id: refund.id,
        square_refund_id: refundId,
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
    const actualRefundId = refund.square_refund_id;

    // Update refund status
    await supabase
      .from('refunds')
      .update({
        square_refund_id: actualRefundId,
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
      square_refund_id: actualRefundId,
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

  private async getOrCreateSquareCustomer(clientId: string, buyerName?: string) {
    // Get client details
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

  private async transferFundsToCoach(payment: Payment): Promise<void> {
    try {
      // Since we removed the credit system, this method now initiates direct payout
      // This is a placeholder - in production you would integrate with Square's payout API

      const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.logPaymentEvent(payment.id, 'funds_transferred', {
        transfer_id: transferId,
        amount_cents: payment.coach_earnings_cents,
        note: 'Direct payout to coach bank account initiated'
      });

      console.log(`Initiated payout for coach ${payment.coach_id}: $${payment.coach_earnings_cents / 100}`);
    } catch (error) {
      await this.logPaymentEvent(payment.id, 'transfer_failed', {
        error: (error as Error).message,
      });
      console.error('Failed to transfer funds to coach:', error);
      // Don't throw error as this is a background process
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
      square_event_id: details.square_event_id,
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
      square_event_id: details.square_event_id,
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
      .eq('square_payment_id', payment.id)
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
      .eq('square_refund_id', refund.id)
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