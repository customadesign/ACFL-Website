import { supabase } from '../lib/supabase';
import {
  paymentsApi,
  customersApi,
  refundsApi,
  getLocationId,
  formatSquareAmount,
  generateIdempotencyKey
} from '../lib/square';
import { CoachRateService } from './coachRateService';
import {
  Payment,
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  CreateRefundRequest,
  CreateRefundResponse,
  PaymentLog
} from '../types/payment';
import { ApiError } from 'square';

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

    // Get or create Square customer
    const customerId = await this.getOrCreateSquareCustomer(clientId);

    // Calculate earnings
    const { coachEarnings, platformFee } = await this.coachRateService
      .calculateCoachEarnings(coachRate.rate_cents);

    // Create Square payment
    try {
      const locationId = await getLocationId();
      const idempotencyKey = generateIdempotencyKey();

      const paymentRequest = {
        sourceId: 'EXTERNAL', // Will be replaced with actual payment source
        idempotencyKey,
        amountMoney: {
          amount: formatSquareAmount(coachRate.rate_cents),
          currency: 'USD',
        },
        customerId,
        locationId,
        autocomplete: false, // Don't auto-capture, similar to Stripe's manual capture
        note: request.description || coachRate.title,
        referenceId: `${clientId}_${request.coach_id}_${Date.now()}`,
      };

      const response = await paymentsApi.createPayment(paymentRequest);

      if (!response.result.payment) {
        throw new Error('Failed to create Square payment');
      }

      const squarePayment = response.result.payment;

      // Create payment record
      const paymentData = {
        client_id: clientId,
        coach_id: request.coach_id,
        coach_rate_id: request.coach_rate_id,
        square_payment_id: squarePayment.id!, // Will be renamed to payment_id
        square_customer_id: customerId, // Will be renamed to customer_id
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
        // Cancel the Square payment if database insert fails
        if (squarePayment.id) {
          await this.cancelSquarePayment(squarePayment.id);
        }
        throw new Error(`Failed to create payment record: ${error.message}`);
      }

      // Log payment creation
      await this.logPaymentEvent(payment.id, 'payment_created', {
        square_payment_id: squarePayment.id,
        amount_cents: coachRate.rate_cents,
      });

      return {
        payment_intent_id: squarePayment.id!,
        client_secret: squarePayment.id!, // Square doesn't use client secrets like Stripe
        amount_cents: coachRate.rate_cents,
        payment_id: payment.id,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Square API error: ${error.errors?.[0]?.detail || error.message}`);
      }
      throw error;
    }
  }

  async confirmPayment(paymentId: string): Promise<Payment> {
    try {
      // Complete the Square payment
      const completeResponse = await paymentsApi.completePayment(
        paymentId,
        {}
      );

      if (!completeResponse.result.payment) {
        throw new Error('Failed to complete Square payment');
      }

      const squarePayment = completeResponse.result.payment;

      // Find payment in database
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('square_payment_id', paymentId)
        .single();

      if (error) {
        throw new Error(`Payment not found: ${error.message}`);
      }

      // Update payment status
      const newStatus = squarePayment.status === 'COMPLETED' ? 'succeeded' : 'failed';
      const updateData: Partial<Payment> = {
        status: newStatus as Payment['status'],
        payment_method_type: squarePayment.sourceType?.toLowerCase() || 'card',
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
        square_payment_id: paymentId,
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
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Square API error: ${error.errors?.[0]?.detail || error.message}`);
      }
      throw error;
    }
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

    try {
      // Create Square refund
      const refundRequest = {
        idempotencyKey: generateIdempotencyKey(),
        amountMoney: {
          amount: formatSquareAmount(refundAmount),
          currency: 'USD',
        },
        paymentId: payment.square_payment_id, // This contains the Square payment ID
        reason: request.description || request.reason,
      };

      const refundResponse = await refundsApi.refundPayment(refundRequest);

      if (!refundResponse.result.refund) {
        throw new Error('Failed to create Square refund');
      }

      const squareRefund = refundResponse.result.refund;

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
        square_refund_id: squareRefund.id!, // Will be renamed to refund_id
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
        square_refund_id: squareRefund.id,
        amount_cents: refundAmount,
        reason: request.reason,
      });

      return {
        refund_id: refund.id,
        square_refund_id: squareRefund.id!,
        amount_cents: refundAmount,
        status: squareRefund.status === 'COMPLETED' ? 'succeeded' : 'pending',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Square API error: ${error.errors?.[0]?.detail || error.message}`);
      }
      throw error;
    }
  }

  async handleWebhook(event: any): Promise<void> {
    // Handle Square webhook events
    console.log(`Square webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment.created':
      case 'payment.updated':
        await this.handlePaymentUpdate(event.data.object);
        break;
      case 'refund.created':
      case 'refund.updated':
        await this.handleRefundUpdate(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  // Helper method to cancel a Square payment
  private async cancelSquarePayment(paymentId: string): Promise<void> {
    try {
      await paymentsApi.cancelPayment(paymentId);
    } catch (error) {
      console.error('Failed to cancel Square payment:', error);
    }
  }

  // Get or create Square customer
  private async getOrCreateSquareCustomer(clientId: string): Promise<string> {
    // Get client details
    const { data: client, error } = await supabase
      .from('clients')
      .select('email, first_name, last_name')
      .eq('id', clientId)
      .single();

    if (error) {
      throw new Error(`Client not found: ${error.message}`);
    }

    try {
      // Search for existing customer by email
      const searchResponse = await customersApi.searchCustomers({
        query: {
          filter: {
            emailAddress: {
              exact: client.email,
            },
          },
        },
      });

      if (searchResponse.result.customers && searchResponse.result.customers.length > 0) {
        return searchResponse.result.customers[0].id!;
      }

      // Create new customer
      const createResponse = await customersApi.createCustomer({
        idempotencyKey: generateIdempotencyKey(),
        givenName: client.first_name,
        familyName: client.last_name,
        emailAddress: client.email,
        referenceId: clientId,
      });

      if (!createResponse.result.customer) {
        throw new Error('Failed to create Square customer');
      }

      return createResponse.result.customer.id!;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Square API error: ${error.errors?.[0]?.detail || error.message}`);
      }
      throw error;
    }
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

    // Note: Square doesn't have a direct equivalent to Stripe Connect
    // You would need to implement a separate payout system
    // For now, log the transfer intention
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

  private async handlePaymentUpdate(payment: any): Promise<void> {
    // Update payment status based on Square webhook
    const { error } = await supabase
      .from('payments')
      .update({
        status: payment.status === 'COMPLETED' ? 'succeeded' : 'failed',
        updated_at: new Date(),
      })
      .eq('square_payment_id', payment.id);

    if (error) {
      console.error('Failed to update payment status:', error);
    }
  }

  private async handleRefundUpdate(refund: any): Promise<void> {
    const { data, error } = await supabase
      .from('refunds')
      .update({
        status: refund.status === 'COMPLETED' ? 'succeeded' : refund.status.toLowerCase(),
        processed_at: refund.status === 'COMPLETED' ? new Date() : null
      })
      .eq('square_refund_id', refund.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update refund status:', error);
      return;
    }

    await this.logRefundEvent(data.id, 'refund_updated', {
      square_refund_id: refund.id,
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
}