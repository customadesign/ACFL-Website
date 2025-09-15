import { supabase } from '../lib/supabase';
import stripe from '../lib/stripe';
import { CoachRateService } from './coachRateService';
import { 
  Payment, 
  CreatePaymentIntentRequest, 
  CreatePaymentIntentResponse,
  CreateRefundRequest,
  CreateRefundResponse,
  PaymentLog 
} from '../types/payment';

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

    // Get or create Stripe customer
    const stripeCustomer = await this.getOrCreateStripeCustomer(clientId);
    
    // Calculate earnings
    const { coachEarnings, platformFee } = await this.coachRateService
      .calculateCoachEarnings(coachRate.rate_cents);

    // Create Stripe payment intent with MANUAL capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: coachRate.rate_cents,
      currency: 'usd',
      customer: stripeCustomer.id,
      capture_method: 'manual', // IMPORTANT: Don't capture immediately
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        client_id: clientId,
        coach_id: request.coach_id,
        coach_rate_id: request.coach_rate_id,
        session_id: request.sessionId || '',
        session_type: coachRate.session_type,
        duration_minutes: coachRate.duration_minutes.toString(),
        ...(request.metadata || {}),
      }
    });

    // Create payment record with 'authorized' status
    const paymentData = {
      client_id: clientId,
      coach_id: request.coach_id,
      coach_rate_id: request.coach_rate_id,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_customer_id: stripeCustomer.id,
      amount_cents: coachRate.rate_cents,
      currency: 'usd',
      platform_fee_cents: platformFee,
      coach_earnings_cents: coachEarnings,
      status: 'authorized', // New status for authorized but not captured
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
      // Cancel the payment intent if database insert fails
      await stripe.paymentIntents.cancel(paymentIntent.id);
      throw new Error(`Failed to create payment record: ${error.message}`);
    }

    // Log payment authorization
    await this.logPaymentEvent(payment.id, 'payment_authorized', {
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents: coachRate.rate_cents,
    });

    return {
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret!,
      amount_cents: coachRate.rate_cents,
      payment_id: payment.id,
    };
  }

  /**
   * Capture payment after session completion
   */
  async capturePayment(paymentId: string): Promise<Payment> {
    // Get payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'authorized') {
      throw new Error(`Cannot capture payment with status: ${payment.status}`);
    }

    try {
      // Capture the payment in Stripe
      const paymentIntent = await stripe.paymentIntents.capture(
        payment.stripe_payment_intent_id
      );

      // Update payment status
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'succeeded',
          paid_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Log capture event
      await this.logPaymentEvent(paymentId, 'payment_captured', {
        stripe_payment_intent_id: payment.stripe_payment_intent_id,
        amount_cents: payment.amount_cents,
      });

      // Transfer funds to coach
      await this.transferFundsToCoach(updatedPayment);

      return updatedPayment;
    } catch (error) {
      // Log capture failure
      await this.logPaymentEvent(paymentId, 'capture_failed', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Cancel authorized payment (before capture)
   */
  async cancelAuthorization(paymentId: string, reason: string): Promise<void> {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'authorized') {
      throw new Error(`Cannot cancel payment with status: ${payment.status}`);
    }

    // Cancel in Stripe
    await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id, {
      cancellation_reason: 'requested_by_customer',
    });

    // Update payment status
    await supabase
      .from('payments')
      .update({ 
        status: 'canceled',
        metadata: { ...payment.metadata, cancellation_reason: reason }
      })
      .eq('id', paymentId);

    // Log cancellation
    await this.logPaymentEvent(paymentId, 'payment_canceled', {
      reason,
    });
  }

  /**
   * Process refund with different flows based on initiator
   */
  async createRefund(
    initiatorId: string,
    initiatorType: 'admin' | 'coach' | 'client' | 'system',
    request: CreateRefundRequest
  ): Promise<CreateRefundResponse> {
    // Get payment
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', request.payment_id)
      .single();

    if (error || !payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'succeeded') {
      throw new Error('Can only refund successful payments');
    }

    const refundAmount = request.amount_cents || payment.amount_cents;
    
    // Determine if refund needs approval
    const needsApproval = initiatorType === 'coach';
    
    if (needsApproval) {
      // Create pending refund request
      return await this.createPendingRefundRequest(
        payment,
        refundAmount,
        request,
        initiatorId,
        initiatorType
      );
    } else {
      // Process immediate refund (admin or automatic)
      return await this.processImmediateRefund(
        payment,
        refundAmount,
        request,
        initiatorId,
        initiatorType
      );
    }
  }

  /**
   * Create pending refund request (requires approval)
   */
  private async createPendingRefundRequest(
    payment: Payment,
    refundAmount: number,
    request: CreateRefundRequest,
    initiatorId: string,
    initiatorType: string
  ): Promise<CreateRefundResponse> {
    // Calculate refund distribution
    const { coachPenalty, platformRefund } = this.calculateRefundDistribution(
      refundAmount,
      payment.coach_earnings_cents,
      payment.platform_fee_cents,
      request.reason
    );

    // Create refund record with 'pending_approval' status
    const refundData = {
      payment_id: request.payment_id,
      stripe_refund_id: 'pending_' + Date.now(), // Temporary ID
      amount_cents: refundAmount,
      reason: request.reason,
      status: 'pending_approval', // New status
      initiated_by_type: initiatorType,
      initiated_by_id: initiatorId,
      coach_penalty_cents: coachPenalty,
      platform_refund_cents: platformRefund,
      description: request.description,
      metadata: {
        requires_approval: true,
        requested_at: new Date().toISOString(),
      },
    };

    const { data: refund, error } = await supabase
      .from('refunds')
      .insert([refundData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create refund request: ${error.message}`);
    }

    // Log refund request
    await this.logRefundEvent(refund.id, 'refund_requested', {
      amount_cents: refundAmount,
      reason: request.reason,
      requires_approval: true,
    });

    // Notify admin for approval
    await this.notifyAdminForRefundApproval(refund);

    return {
      refund_id: refund.id,
      stripe_refund_id: refund.stripe_refund_id,
      amount_cents: refundAmount,
      status: 'pending_approval',
    };
  }

  /**
   * Process immediate refund (admin-initiated or automatic)
   */
  private async processImmediateRefund(
    payment: Payment,
    refundAmount: number,
    request: CreateRefundRequest,
    initiatorId: string,
    initiatorType: string
  ): Promise<CreateRefundResponse> {
    // Create Stripe refund
    const stripeRefund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      amount: refundAmount,
      reason: request.reason === 'requested_by_customer' ? 'requested_by_customer' : undefined,
    });

    // Calculate refund distribution
    const { coachPenalty, platformRefund } = this.calculateRefundDistribution(
      refundAmount,
      payment.coach_earnings_cents,
      payment.platform_fee_cents,
      request.reason
    );

    // Create refund record
    const refundData = {
      payment_id: request.payment_id,
      stripe_refund_id: stripeRefund.id,
      amount_cents: refundAmount,
      reason: request.reason,
      status: 'succeeded',
      initiated_by_type: initiatorType,
      initiated_by_id: initiatorId,
      coach_penalty_cents: coachPenalty,
      platform_refund_cents: platformRefund,
      description: request.description,
      processed_at: new Date().toISOString(),
    };

    const { data: refund, error } = await supabase
      .from('refunds')
      .insert([refundData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create refund record: ${error.message}`);
    }

    // Update payment status
    const newPaymentStatus = refundAmount >= payment.amount_cents ? 'refunded' : 'partially_refunded';
    await supabase
      .from('payments')
      .update({ status: newPaymentStatus })
      .eq('id', request.payment_id);

    // Log refund
    await this.logRefundEvent(refund.id, 'refund_processed', {
      stripe_refund_id: stripeRefund.id,
      amount_cents: refundAmount,
      immediate: true,
    });

    return {
      refund_id: refund.id,
      stripe_refund_id: stripeRefund.id,
      amount_cents: refundAmount,
      status: 'succeeded',
    };
  }

  /**
   * Approve pending refund request
   */
  async approveRefund(refundId: string, adminId: string): Promise<void> {
    const { data: refund, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('id', refundId)
      .single();

    if (error || !refund) {
      throw new Error('Refund request not found');
    }

    if (refund.status !== 'pending_approval') {
      throw new Error('Refund is not pending approval');
    }

    // Get payment
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', refund.payment_id)
      .single();

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Create Stripe refund
    const stripeRefund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      amount: refund.amount_cents,
    });

    // Update refund record
    await supabase
      .from('refunds')
      .update({
        stripe_refund_id: stripeRefund.id,
        status: 'succeeded',
        processed_at: new Date().toISOString(),
        metadata: {
          ...refund.metadata,
          approved_by: adminId,
          approved_at: new Date().toISOString(),
        },
      })
      .eq('id', refundId);

    // Update payment status
    const newPaymentStatus = refund.amount_cents >= payment.amount_cents 
      ? 'refunded' 
      : 'partially_refunded';
    
    await supabase
      .from('payments')
      .update({ status: newPaymentStatus })
      .eq('id', refund.payment_id);

    // Log approval
    await this.logRefundEvent(refundId, 'refund_approved', {
      approved_by: adminId,
      stripe_refund_id: stripeRefund.id,
    });
  }

  /**
   * Reject pending refund request
   */
  async rejectRefund(refundId: string, adminId: string, reason: string): Promise<void> {
    const { data: refund, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('id', refundId)
      .single();

    if (error || !refund) {
      throw new Error('Refund request not found');
    }

    if (refund.status !== 'pending_approval') {
      throw new Error('Refund is not pending approval');
    }

    // Update refund record
    await supabase
      .from('refunds')
      .update({
        status: 'rejected',
        metadata: {
          ...refund.metadata,
          rejected_by: adminId,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
        },
      })
      .eq('id', refundId);

    // Log rejection
    await this.logRefundEvent(refundId, 'refund_rejected', {
      rejected_by: adminId,
      reason,
    });
  }

  /**
   * Automatic refund for cancelled sessions
   */
  async processAutomaticRefund(
    sessionId: string,
    cancellationTime: Date
  ): Promise<void> {
    // Get payment for session
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'succeeded')
      .single();

    if (error || !payment) {
      console.log('No payment found for automatic refund');
      return;
    }

    // Get session details
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return;
    }

    const sessionTime = new Date(session.scheduled_at);
    const hoursBeforeSession = (sessionTime.getTime() - cancellationTime.getTime()) / (1000 * 60 * 60);

    // Determine refund amount based on cancellation policy
    let refundPercentage = 0;
    let reason: 'auto_cancellation' = 'auto_cancellation';
    
    if (hoursBeforeSession >= 24) {
      refundPercentage = 100; // Full refund if cancelled 24+ hours before
    } else if (hoursBeforeSession >= 12) {
      refundPercentage = 50; // 50% refund if cancelled 12-24 hours before
    } else {
      refundPercentage = 0; // No refund if cancelled less than 12 hours before
    }

    if (refundPercentage > 0) {
      const refundAmount = Math.floor(payment.amount_cents * (refundPercentage / 100));
      
      await this.createRefund('system', 'system', {
        payment_id: payment.id,
        amount_cents: refundAmount,
        reason,
        description: `Automatic refund: Session cancelled ${hoursBeforeSession.toFixed(1)} hours before scheduled time (${refundPercentage}% refund)`,
      });
    }
  }

  // Helper methods remain the same as original
  private async getOrCreateStripeCustomer(clientId: string) {
    // Get client details
    const { data: client, error } = await supabase
      .from('clients')
      .select('email, first_name, last_name')
      .eq('id', clientId)
      .single();

    if (error) {
      throw new Error(`Client not found: ${error.message}`);
    }

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: client.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create new customer
    return await stripe.customers.create({
      email: client.email,
      name: `${client.first_name} ${client.last_name}`,
      metadata: { client_id: clientId }
    });
  }

  private async transferFundsToCoach(payment: Payment): Promise<void> {
    // Get coach Stripe account
    const { data: stripeAccount } = await supabase
      .from('coach_stripe_accounts')
      .select('stripe_account_id, charges_enabled')
      .eq('coach_id', payment.coach_id)
      .single();

    if (!stripeAccount || !stripeAccount.charges_enabled) {
      console.log(`Coach ${payment.coach_id} doesn't have enabled Stripe account`);
      return;
    }

    // Create transfer
    try {
      const transfer = await stripe.transfers.create({
        amount: payment.coach_earnings_cents,
        currency: 'usd',
        destination: stripeAccount.stripe_account_id,
        metadata: {
          payment_id: payment.id,
          coach_id: payment.coach_id,
        },
      });

      await this.logPaymentEvent(payment.id, 'funds_transferred', {
        transfer_id: transfer.id,
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
    await supabase.from('payment_logs').insert([{
      payment_id: paymentId,
      event_type: eventType,
      metadata: details,
    }]);
  }

  private async logRefundEvent(
    refundId: string,
    eventType: string,
    details: Record<string, any>
  ): Promise<void> {
    await supabase.from('payment_logs').insert([{
      refund_id: refundId,
      event_type: eventType,
      metadata: details,
    }]);
  }

  private async notifyAdminForRefundApproval(refund: any): Promise<void> {
    // Send notification to admin
    console.log(`Refund approval required for refund ${refund.id}`);
    // Implement your notification logic here (email, in-app notification, etc.)
  }
}