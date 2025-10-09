import { supabase } from '../lib/supabase';
import {
  BillingTransaction,
  RefundRequest,
  Payout,
  BillingReport,
  BillingHistoryRequest,
  CreateRefundRequestData,
  ProcessRefundRequest,
  PayoutRequest,
  BillingDashboardData,
  TransactionFilters,
  CoachBankAccount
} from '../types/payment';
import { bankAccountService } from './bankAccountService';

export class BillingService {
  // Get billing history for a user
  async getBillingHistory(request: BillingHistoryRequest): Promise<BillingTransaction[]> {
    let query = supabase
      .from('billing_transactions')
      .select('*')
      .eq('user_id', request.user_id)
      .eq('user_type', request.user_type);

    if (request.start_date) {
      query = query.gte('created_at', request.start_date.toISOString());
    }
    if (request.end_date) {
      query = query.lte('created_at', request.end_date.toISOString());
    }
    if (request.transaction_types && request.transaction_types.length > 0) {
      query = query.in('transaction_type', request.transaction_types);
    }
    if (request.status) {
      query = query.eq('status', request.status);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(request.limit || 50)
      .range(request.offset || 0, (request.offset || 0) + (request.limit || 50) - 1);

    if (error) throw error;
    return data || [];
  }


  // Create billing transaction
  async createBillingTransaction(transaction: Omit<BillingTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<BillingTransaction> {
    const { data, error } = await supabase
      .from('billing_transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create refund request
  async createRefundRequest(data: CreateRefundRequestData, requestedBy: string, requestedByType: 'client' | 'coach' | 'admin'): Promise<RefundRequest> {
    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', data.payment_id)
      .single();

    if (paymentError) throw paymentError;

    const refundAmount = data.amount_cents || payment.amount_cents;

    const { data: refundRequest, error } = await supabase
      .from('refund_requests')
      .insert({
        payment_id: data.payment_id,
        client_id: payment.client_id,
        coach_id: payment.coach_id,
        amount_cents: refundAmount,
        reason: data.reason,
        description: data.description,
        status: 'pending',
        requested_by: requestedBy,
        requested_by_type: requestedByType,
        refund_method: data.refund_method || 'original_payment',
        metadata: {}
      })
      .select()
      .single();

    if (error) throw error;

    // Create billing transaction for the refund request
    await this.createBillingTransaction({
      user_id: payment.client_id,
      user_type: 'client',
      transaction_type: 'refund',
      amount_cents: refundAmount,
      currency: payment.currency,
      status: 'pending',
      description: `Refund request: ${data.reason}`,
      reference_id: refundRequest.id,
      reference_type: 'refund',
      metadata: { reason: data.reason }
    });

    return refundRequest;
  }

  // Process refund request
  async processRefundRequest(request: ProcessRefundRequest, reviewedBy: string): Promise<RefundRequest> {
    const { data: refundRequest, error: fetchError } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('id', request.refund_request_id)
      .single();

    if (fetchError) throw fetchError;

    if (refundRequest.status !== 'pending') {
      throw new Error('Refund request has already been processed');
    }

    const updateData: any = {
      status: request.action === 'approve' ? 'approved' : 'rejected',
      reviewed_by: reviewedBy,
      reviewed_at: new Date(),
      updated_at: new Date()
    };

    if (request.action === 'reject') {
      updateData.rejection_reason = request.rejection_reason;
    } else {
      updateData.refund_method = request.refund_method || refundRequest.refund_method;
      updateData.processing_fee_cents = request.processing_fee_cents || 0;
      updateData.coach_penalty_cents = request.coach_penalty_cents || 0;
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('refund_requests')
      .update(updateData)
      .eq('id', request.refund_request_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update billing transactions
    await supabase
      .from('billing_transactions')
      .update({
        status: request.action === 'approve' ? 'completed' : 'cancelled',
        updated_at: new Date()
      })
      .eq('reference_id', request.refund_request_id)
      .eq('reference_type', 'refund');

    // Store credit refunds are no longer supported since we removed the credit system
    // All refunds go back to original payment method

    return updatedRequest;
  }

  // Create payout for coach (now directly linked to specific payments)
  async createPayout(request: PayoutRequest): Promise<Payout> {
    // Get payment details to determine payout amount
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', request.payment_id)
      .single();

    if (paymentError) throw paymentError;

    if (payment.coach_id !== request.coach_id) {
      throw new Error('Payment does not belong to specified coach');
    }

    // Verify bank account exists and is verified
    const { data: bankAccount, error: bankError } = await supabase
      .from('coach_bank_accounts')
      .select('*')
      .eq('id', request.bank_account_id)
      .eq('coach_id', request.coach_id)
      .eq('is_verified', true)
      .single();

    if (bankError) {
      throw new Error('Valid bank account not found');
    }

    const payoutAmount = payment.coach_earnings_cents;
    const fees = 0; // Square typically covers standard transfer fees
    const netAmount = payoutAmount - fees;

    const { data: payout, error } = await supabase
      .from('payouts')
      .insert({
        coach_id: request.coach_id,
        bank_account_id: request.bank_account_id,
        payment_id: request.payment_id,
        amount_cents: payoutAmount,
        currency: 'USD',
        status: 'pending',
        payout_method: 'bank_transfer',
        fees_cents: fees,
        net_amount_cents: netAmount,
        metadata: { notes: request.notes }
      })
      .select()
      .single();

    if (error) throw error;

    // Create billing transaction
    await this.createBillingTransaction({
      user_id: request.coach_id,
      user_type: 'coach',
      transaction_type: 'payout',
      amount_cents: payoutAmount,
      currency: 'USD',
      status: 'pending',
      description: `Payout to bank account`,
      reference_id: payout.id,
      reference_type: 'payout',
      metadata: { payment_id: request.payment_id }
    });

    return payout;
  }

  // Get billing dashboard data
  async getBillingDashboard(userId: string, userType: 'client' | 'coach'): Promise<BillingDashboardData> {
    // Get recent transactions
    const recentTransactions = await this.getBillingHistory({
      user_id: userId,
      user_type: userType,
      limit: 10
    });

    // Get monthly summary
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date();
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    monthEnd.setHours(23, 59, 59, 999);

    const monthlySummary = await this.getBillingReport(userId, userType, monthStart, monthEnd);

    // Calculate total earnings (since coaches are paid directly by clients)
    let totalEarnings = 0;
    if (userType === 'coach') {
      // Get all completed payments for this coach (lifetime earnings)
      const { data: allPayments } = await supabase
        .from('payments')
        .select('coach_earnings_cents')
        .eq('coach_id', userId)
        .eq('status', 'completed');

      totalEarnings = (allPayments || []).reduce((sum, payment) => sum + (payment.coach_earnings_cents || 0), 0);
    } else {
      // For clients, this could be credits or total spent
      totalEarnings = 0;
    }

    // Get pending refunds
    let pendingRefunds: RefundRequest[] = [];
    if (userType === 'client') {
      const { data: refunds } = await supabase
        .from('refund_requests')
        .select('*')
        .eq('client_id', userId)
        .in('status', ['pending', 'approved', 'processing']);

      pendingRefunds = refunds || [];
    }

    // Get coach bank accounts (for managing payment methods)
    let bankAccounts: CoachBankAccount[] = [];
    if (userType === 'coach') {
      bankAccounts = await bankAccountService.getBankAccounts(userId);
    }

    return {
      current_balance_cents: totalEarnings,
      recent_transactions: recentTransactions,
      monthly_summary: monthlySummary,
      pending_refunds: pendingRefunds,
      bank_accounts: userType === 'coach' ? bankAccounts : undefined
    };
  }

  // Get billing report
  async getBillingReport(userId: string, userType: 'client' | 'coach', startDate: Date, endDate: Date): Promise<BillingReport> {
    const { data: transactions, error } = await supabase
      .from('billing_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const payments = transactions?.filter(t => t.transaction_type === 'payment') || [];
    const refunds = transactions?.filter(t => t.transaction_type === 'refund') || [];

    const totalRevenue = payments.reduce((sum, t) => sum + t.amount_cents, 0);
    const totalRefunds = refunds.reduce((sum, t) => sum + t.amount_cents, 0);
    const totalFees = transactions?.filter(t => t.transaction_type === 'fee').reduce((sum, t) => sum + t.amount_cents, 0) || 0;

    return {
      period_start: startDate,
      period_end: endDate,
      total_revenue_cents: totalRevenue,
      total_refunds_cents: totalRefunds,
      total_fees_cents: totalFees,
      net_revenue_cents: totalRevenue - totalRefunds - totalFees,
      transaction_count: payments.length,
      refund_count: refunds.length,
      average_transaction_cents: payments.length > 0 ? Math.round(totalRevenue / payments.length) : 0,
      refund_rate_percentage: payments.length > 0 ? (refunds.length / payments.length) * 100 : 0
    };
  }

  // Get filtered transactions
  async getFilteredTransactions(userId: string, userType: 'client' | 'coach', filters: TransactionFilters): Promise<BillingTransaction[]> {
    let query = supabase
      .from('billing_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType);

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date.toISOString());
    }
    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date.toISOString());
    }
    if (filters.transaction_types && filters.transaction_types.length > 0) {
      query = query.in('transaction_type', filters.transaction_types);
    }
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    if (filters.min_amount_cents) {
      query = query.gte('amount_cents', filters.min_amount_cents);
    }
    if (filters.max_amount_cents) {
      query = query.lte('amount_cents', filters.max_amount_cents);
    }
    if (filters.search_term) {
      query = query.ilike('description', `%${filters.search_term}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get all refund requests for admin
  async getAllRefundRequests(status?: string): Promise<RefundRequest[]> {
    let query = supabase
      .from('refund_requests')
      .select(`
        *,
        client:clients(first_name, last_name, email),
        coach:coaches(first_name, last_name, email),
        payment:payments(amount_cents, currency)
      `);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get all payouts for admin
  async getAllPayouts(status?: string): Promise<Payout[]> {
    let query = supabase
      .from('payouts')
      .select(`
        *,
        coach:coaches(first_name, last_name, email)
      `);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Approve payout
  async approvePayout(payoutId: string, adminId: string, notes?: string): Promise<Payout> {
    // Get payout details
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .select('*')
      .eq('id', payoutId)
      .single();

    if (payoutError) throw payoutError;

    if (payout.status !== 'pending') {
      throw new Error(`Payout cannot be approved. Current status: ${payout.status}`);
    }

    // Import SquarePaymentService to initiate bank transfer
    const { SquarePaymentService } = await import('./squarePaymentService');
    const squareService = new SquarePaymentService();

    try {
      // Initiate bank transfer via Square
      await squareService.initiateCoachTransfer(
        payout.coach_id,
        payout.payment_id,
        payout.net_amount_cents
      );

      // Update payout status to completed
      const { data: updatedPayout, error: updateError } = await supabase
        .from('payouts')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          processed_by: adminId,
          metadata: {
            ...payout.metadata,
            admin_notes: notes,
            approved_at: new Date().toISOString()
          }
        })
        .eq('id', payoutId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update billing transaction
      await supabase
        .from('billing_transactions')
        .update({ status: 'completed' })
        .eq('reference_id', payoutId)
        .eq('reference_type', 'payout');

      return updatedPayout;
    } catch (error) {
      // If bank transfer fails, mark payout as failed
      await supabase
        .from('payouts')
        .update({
          status: 'failed',
          metadata: {
            ...payout.metadata,
            failure_reason: error instanceof Error ? error.message : 'Bank transfer failed',
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', payoutId);

      throw new Error(`Failed to process bank transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Reject payout
  async rejectPayout(payoutId: string, adminId: string, rejectionReason: string): Promise<Payout> {
    // Get payout details
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .select('*')
      .eq('id', payoutId)
      .single();

    if (payoutError) throw payoutError;

    if (payout.status !== 'pending') {
      throw new Error(`Payout cannot be rejected. Current status: ${payout.status}`);
    }

    // Update payout status to rejected
    const { data: updatedPayout, error: updateError } = await supabase
      .from('payouts')
      .update({
        status: 'rejected',
        processed_at: new Date().toISOString(),
        processed_by: adminId,
        metadata: {
          ...payout.metadata,
          rejection_reason: rejectionReason,
          rejected_at: new Date().toISOString()
        }
      })
      .eq('id', payoutId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update billing transaction
    await supabase
      .from('billing_transactions')
      .update({ status: 'failed' })
      .eq('reference_id', payoutId)
      .eq('reference_type', 'payout');

    return updatedPayout;
  }
}

export const billingService = new BillingService();