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
  CreateRefundRequest,
  CreateRefundResponse,
  PaymentLog
} from '../types/payment';
import { CreatePaymentRequest } from 'square';

export interface ImmediatePaymentRequest {
  client_id: string;
  coach_id: string;
  amount_cents: number;
  source_id: string; // Square payment source
  coach_rate_id?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ImmediatePaymentResponse {
  payment_id: string;
  square_payment_id: string;
  amount_cents: number;
  status: 'succeeded' | 'failed' | 'processing';
  paid_at?: Date;
}

/**
 * Square Payment Service for immediate payments (no authorization/capture flow)
 * This service handles direct payment processing for the new booking flow
 */
export class SquarePaymentService {
  private coachRateService: CoachRateService;

  constructor() {
    this.coachRateService = new CoachRateService();
  }

  /**
   * Process immediate payment (no authorization, direct charge)
   */
  async processImmediatePayment(
    request: ImmediatePaymentRequest
  ): Promise<ImmediatePaymentResponse> {
    try {
      // Get or create Square customer
      const squareCustomer = await this.getOrCreateSquareCustomer(request.client_id);

      // Calculate earnings
      const { coachEarnings, platformFee } = await this.coachRateService
        .calculateCoachEarnings(request.amount_cents);

      // Create Square payment with immediate completion
      const locationId = await getLocationId();
      const idempotencyKey = generateIdempotencyKey();

      const createPaymentRequest: CreatePaymentRequest = {
        sourceId: request.source_id,
        idempotencyKey,
        amountMoney: {
          amount: formatSquareAmount(request.amount_cents),
          currency: 'USD'
        },
        locationId,
        autocomplete: true, // Immediate payment completion
        customerId: squareCustomer.id,
        note: request.description || 'Session payment',
      };

      const { result: paymentResult } = await paymentsApi.createPayment(createPaymentRequest);

      if (!paymentResult.payment) {
        throw new Error('Failed to create Square payment');
      }

      const squarePayment = paymentResult.payment;
      const paymentStatus = squarePayment.status === 'COMPLETED' ? 'succeeded' :
                           squarePayment.status === 'FAILED' ? 'failed' : 'processing';

      // Create payment record in database
      const paymentData = {
        client_id: request.client_id,
        coach_id: request.coach_id,
        coach_rate_id: request.coach_rate_id,
        square_payment_id: squarePayment.id!,
        square_customer_id: squareCustomer.id!,
        amount_cents: request.amount_cents,
        currency: 'usd',
        platform_fee_cents: platformFee,
        coach_earnings_cents: coachEarnings,
        status: paymentStatus,
        payment_method_type: squarePayment.sourceType?.toLowerCase() || 'card',
        paid_at: paymentStatus === 'succeeded' ? new Date() : null,
        description: request.description || 'Session payment',
        metadata: {
          ...request.metadata,
          immediate_payment: true,
          square_payment_status: squarePayment.status
        }
      };

      const { data: payment, error } = await supabase
        .from('payments')
        .insert([paymentData])
        .select()
        .single();

      if (error) {
        // If database insert fails, we should try to refund the Square payment
        console.error('Payment database error:', error);
        try {
          await this.attemptRefund(squarePayment.id!, request.amount_cents, 'Database error');
        } catch (refundError) {
          console.error('Failed to refund payment after database error:', refundError);
        }
        throw new Error(`Payment processed but record creation failed: ${error.message}`);
      }

      // Log payment creation
      await this.logPaymentEvent(payment.id, 'immediate_payment_created', {
        square_payment_id: squarePayment.id,
        amount_cents: request.amount_cents,
        status: paymentStatus
      });

      // If successful, initiate fund transfer to coach
      if (paymentStatus === 'succeeded') {
        try {
          await this.initiateCoachTransfer(payment);
        } catch (error) {
          console.error('Failed to initiate coach transfer:', error);
          // Don't throw error as payment is still successful
        }
      }

      return {
        payment_id: payment.id,
        square_payment_id: squarePayment.id!,
        amount_cents: request.amount_cents,
        status: paymentStatus,
        paid_at: paymentStatus === 'succeeded' ? new Date(payment.paid_at) : undefined
      };
    } catch (error) {
      console.error('Error processing immediate payment:', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }

    return data;
  }

  /**
   * Create refund for immediate payment
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

    if (payment.status !== 'succeeded') {
      throw new Error('Can only refund successful payments');
    }

    const refundAmount = request.amount_cents || payment.amount_cents;

    // Check existing refunds
    const { data: existingRefunds } = await supabase
      .from('refunds')
      .select('amount_cents')
      .eq('payment_id', request.payment_id)
      .eq('status', 'succeeded');

    const totalRefunded = existingRefunds?.reduce((sum, r) => sum + r.amount_cents, 0) || 0;
    if (totalRefunded + refundAmount > payment.amount_cents) {
      throw new Error('Refund amount exceeds payment amount');
    }

    try {
      // Create Square refund
      const { result: refundResult } = await refundsApi.refundPayment({
        idempotencyKey: generateIdempotencyKey(),
        amountMoney: {
          amount: formatSquareAmount(refundAmount),
          currency: 'USD'
        },
        paymentId: payment.square_payment_id,
        reason: request.reason || 'Customer requested refund',
      });

      if (!refundResult.refund) {
        throw new Error('Failed to create Square refund');
      }

      const squareRefund = refundResult.refund;

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
        square_refund_id: squareRefund.id!,
        amount_cents: refundAmount,
        reason: request.reason,
        status: squareRefund.status === 'COMPLETED' ? 'succeeded' : 'processing',
        initiated_by_type: adminId ? 'admin' : 'system',
        initiated_by_id: adminId,
        coach_penalty_cents: coachPenalty,
        platform_refund_cents: platformRefund,
        description: request.description,
        processed_at: squareRefund.status === 'COMPLETED' ? new Date() : null
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
      const newPaymentStatus = totalRefunded + refundAmount >= payment.amount_cents
        ? 'refunded'
        : 'partially_refunded';

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
        square_refund_id: squareRefund.id!, // Square refund ID
        amount_cents: refundAmount,
        status: squareRefund.status === 'COMPLETED' ? 'succeeded' : 'processing',
      };
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }

  /**
   * Handle Square webhook events
   */
  async handleWebhook(event: any): Promise<void> {
    console.log(`Square webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment.created':
      case 'payment.updated':
        await this.handleSquarePaymentUpdate(event.data.object?.payment);
        break;
      case 'refund.created':
      case 'refund.updated':
        await this.handleSquareRefundUpdate(event.data.object?.refund);
        break;
      default:
        console.log(`Unhandled Square event type: ${event.type}`);
    }
  }

  /**
   * Helper methods
   */
  private async getOrCreateSquareCustomer(clientId: string) {
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

  private async attemptRefund(squarePaymentId: string, amountCents: number, reason: string): Promise<void> {
    try {
      await refundsApi.refundPayment({
        idempotencyKey: generateIdempotencyKey(),
        amountMoney: {
          amount: formatSquareAmount(amountCents),
          currency: 'USD'
        },
        paymentId: squarePaymentId,
        reason,
      });
    } catch (error) {
      console.error('Failed to create emergency refund:', error);
      throw error;
    }
  }

  private async initiateCoachTransfer(payment: Payment): Promise<void> {
    // Check if coach has payment account configured
    const { data: paymentAccount } = await supabase
      .from('coach_payment_accounts')
      .select('account_id, is_enabled')
      .eq('coach_id', payment.coach_id)
      .single();

    if (!paymentAccount || !paymentAccount.is_enabled) {
      console.log(`Coach ${payment.coach_id} doesn't have enabled payment account`);
      return;
    }

    // For now, just log the transfer intention
    // In a real implementation, you would integrate with a payout service
    try {
      const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.logPaymentEvent(payment.id, 'coach_transfer_initiated', {
        transfer_id: transferId,
        amount_cents: payment.coach_earnings_cents,
        coach_account_id: paymentAccount.account_id
      });
    } catch (error) {
      await this.logPaymentEvent(payment.id, 'coach_transfer_failed', {
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
        // Coach pays penalty for cancellation
        return {
          coachPenalty: Math.min(coachEarnings, refundAmount),
          platformRefund: Math.max(0, refundAmount - coachEarnings),
        };
      case 'admin_initiated':
      case 'auto_cancellation':
        // Platform absorbs the refund
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

  private async handleSquarePaymentUpdate(payment: any): Promise<void> {
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
      case 'COMPLETED':
        newStatus = 'succeeded';
        break;
      case 'CANCELED':
        newStatus = 'cancelled';
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

  private async handleSquareRefundUpdate(refund: any): Promise<void> {
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
      case 'COMPLETED':
        newStatus = 'succeeded';
        break;
      case 'REJECTED':
        newStatus = 'failed';
        break;
      case 'PENDING':
        newStatus = 'processing';
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

  private async logPaymentEvent(
    paymentId: string,
    eventType: string,
    details: Record<string, any>
  ): Promise<void> {
    const logData: Partial<PaymentLog> = {
      payment_id: paymentId,
      event_type: eventType,
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
      amount_cents: details.amount_cents,
      description: details.description,
      metadata: details,
    };

    await supabase.from('payment_logs').insert([logData]);
  }
}