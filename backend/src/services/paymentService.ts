import { supabase } from '../lib/supabase';
import stripe, { 
  createPaymentIntent, 
  createCustomer, 
  createRefund,
  retrieveAccount 
} from '../lib/stripe';
import { CoachRateService } from './coachRateService';
import { 
  Payment, 
  CreatePaymentIntentRequest, 
  CreatePaymentIntentResponse,
  CreateRefundRequest,
  CreateRefundResponse,
  PaymentLog 
} from '../types/payment';

export class PaymentService {
  private coachRateService: CoachRateService;

  constructor() {
    this.coachRateService = new CoachRateService();
  }

  async createPaymentIntent(
    clientId: string,
    request: CreatePaymentIntentRequest
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

    // Create Stripe payment intent
    const paymentIntent = await createPaymentIntent(
      coachRate.rate_cents,
      'usd',
      {
        client_id: clientId,
        coach_id: request.coach_id,
        coach_rate_id: request.coach_rate_id,
        session_type: coachRate.session_type,
        duration_minutes: coachRate.duration_minutes.toString(),
        ...(request.metadata || {}),
      }
    );

    // Create payment record
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
      status: 'pending',
      description: request.description || coachRate.title,
      metadata: request.metadata || {},
    };

    const { data: payment, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create payment record: ${error.message}`);
    }

    // Log payment creation
    await this.logPaymentEvent(payment.id, 'payment_created', {
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

  async confirmPayment(paymentIntentId: string): Promise<Payment> {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Find payment in database
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (error) {
      throw new Error(`Payment not found: ${error.message}`);
    }

    // Update payment status
    const newStatus = paymentIntent.status === 'succeeded' ? 'succeeded' : 'failed';
    const updateData: Partial<Payment> = {
      status: newStatus as Payment['status'],
      payment_method_type: (paymentIntent as any).charges?.data?.[0]?.payment_method_details?.type,
    };

    if (newStatus === 'succeeded') {
      updateData.paid_at = new Date();
    }

    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', payment.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update payment: ${updateError.message}`);
    }

    // Log status change
    await this.logPaymentEvent(payment.id, `payment_${newStatus}`, {
      stripe_payment_intent_id: paymentIntentId,
      old_status: payment.status,
      new_status: newStatus,
    });

    // If successful, transfer funds to coach (if they have connected account)
    if (newStatus === 'succeeded') {
      try {
        await this.transferFundsToCoach(updatedPayment);
      } catch (error) {
        console.error('Failed to transfer funds to coach:', error);
        // Don't throw error as payment is still successful
      }
    }

    return updatedPayment;
  }

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

    if (payment.status !== 'succeeded') {
      throw new Error('Can only refund successful payments');
    }

    const refundAmount = request.amount_cents || payment.amount_cents;
    
    // Create Stripe refund
    const stripeRefund = await createRefund(
      payment.stripe_payment_intent_id,
      refundAmount,
      request.reason === 'requested_by_customer' ? 'requested_by_customer' : undefined
    );

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

    // Update payment status
    const newPaymentStatus = refundAmount >= payment.amount_cents ? 'refunded' : 'partially_refunded';
    await supabase
      .from('payments')
      .update({ status: newPaymentStatus })
      .eq('id', request.payment_id);

    // Log refund creation
    await this.logRefundEvent(refund.id, 'refund_created', {
      stripe_refund_id: stripeRefund.id,
      amount_cents: refundAmount,
      reason: request.reason,
    });

    return {
      refund_id: refund.id,
      stripe_refund_id: stripeRefund.id,
      amount_cents: refundAmount,
      status: 'pending',
    };
  }

  async handleWebhook(event: any): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      case 'charge.dispute.created':
        await this.handleChargeDispute(event.data.object);
        break;
      case 'refund.updated':
        await this.handleRefundUpdated(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

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
    return await createCustomer(
      client.email,
      `${client.first_name} ${client.last_name}`,
      { client_id: clientId }
    );
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

  private async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    await this.confirmPayment(paymentIntent.id);
  }

  private async handlePaymentFailed(paymentIntent: any): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Failed to update payment status:', error);
    }
  }

  private async handleChargeDispute(dispute: any): Promise<void> {
    // Handle charge disputes
    console.log('Charge dispute created:', dispute.id);
  }

  private async handleRefundUpdated(refund: any): Promise<void> {
    const { data, error } = await supabase
      .from('refunds')
      .update({ 
        status: refund.status,
        processed_at: refund.status === 'succeeded' ? new Date() : null 
      })
      .eq('stripe_refund_id', refund.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update refund status:', error);
      return;
    }

    await this.logRefundEvent(data.id, 'refund_updated', {
      stripe_refund_id: refund.id,
      new_status: refund.status,
    });
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
}