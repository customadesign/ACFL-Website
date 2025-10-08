import { supabase } from '../lib/supabase';
import { 
  PaymentSummary, 
  FinancialSummary, 
  CoachEarningsReport, 
  PlatformFinancials 
} from '../types/payment';

export class FinancialReportingService {
  async getPaymentSummary(
    startDate?: Date,
    endDate?: Date,
    coachId?: string,
    clientId?: string
  ): Promise<PaymentSummary[]> {
    let query = supabase
      .from('payment_summary')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }
    if (coachId) {
      query = query.eq('coach_id', coachId);
    }
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch payment summary: ${error.message}`);
    }

    return data || [];
  }

  async getFinancialSummary(
    startDate?: Date,
    endDate?: Date
  ): Promise<FinancialSummary[]> {
    let query = supabase
      .from('financial_summary')
      .select('*')
      .order('month', { ascending: false });

    if (startDate) {
      query = query.gte('month', startDate.toISOString().split('T')[0]);
    }
    if (endDate) {
      query = query.lte('month', endDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch financial summary: ${error.message}`);
    }

    return data || [];
  }

  async getCoachEarningsReport(
    coachId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CoachEarningsReport[]> {
    let query = supabase
      .from('payments')
      .select(`
        coach_id,
        coaches!inner(first_name, last_name),
        coach_earnings_cents,
        created_at
      `)
      .eq('status', 'succeeded');

    if (coachId) {
      query = query.eq('coach_id', coachId);
    }
    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: payments, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch coach earnings: ${error.message}`);
    }

    // Group by coach and calculate metrics
    const coachMap = new Map<string, {
      coach_id: string;
      coach_name: string;
      total_earnings_cents: number;
      total_sessions: number;
      earnings_array: number[];
    }>();

    payments?.forEach((payment: any) => {
      const coachId = payment.coach_id;
      const coachName = `${payment.coaches.first_name} ${payment.coaches.last_name}`;
      
      if (!coachMap.has(coachId)) {
        coachMap.set(coachId, {
          coach_id: coachId,
          coach_name: coachName,
          total_earnings_cents: 0,
          total_sessions: 0,
          earnings_array: [],
        });
      }

      const coach = coachMap.get(coachId)!;
      coach.total_earnings_cents += payment.coach_earnings_cents;
      coach.total_sessions += 1;
      coach.earnings_array.push(payment.coach_earnings_cents);
    });

    // Convert to report format
    const reports: CoachEarningsReport[] = [];
    for (const coach of coachMap.values()) {
      const averageEarnings = coach.earnings_array.length > 0 
        ? Math.round(coach.earnings_array.reduce((a, b) => a + b, 0) / coach.earnings_array.length)
        : 0;

      reports.push({
        coach_id: coach.coach_id,
        coach_name: coach.coach_name,
        total_sessions: coach.total_sessions,
        total_earnings_cents: coach.total_earnings_cents,
        average_session_rate_cents: averageEarnings,
        pending_payouts_cents: 0, // Would need to calculate from Stripe
        last_payout_date: undefined, // Would need to fetch from Stripe
      });
    }

    return reports.sort((a, b) => b.total_earnings_cents - a.total_earnings_cents);
  }

  async getPlatformFinancials(
    startDate?: Date,
    endDate?: Date
  ): Promise<PlatformFinancials> {
    // Base query for payments
    let paymentsQuery = supabase
      .from('payments')
      .select('*')
      .eq('status', 'succeeded');

    if (startDate) {
      paymentsQuery = paymentsQuery.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      paymentsQuery = paymentsQuery.lte('created_at', endDate.toISOString());
    }

    const { data: payments, error: paymentsError } = await paymentsQuery;

    if (paymentsError) {
      throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
    }

    // Calculate refunds
    let refundsQuery = supabase
      .from('refunds')
      .select('amount_cents')
      .eq('status', 'succeeded');

    if (startDate) {
      refundsQuery = refundsQuery.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      refundsQuery = refundsQuery.lte('created_at', endDate.toISOString());
    }

    const { data: refunds, error: refundsError } = await refundsQuery;

    if (refundsError) {
      throw new Error(`Failed to fetch refunds: ${refundsError.message}`);
    }

    // Get unique coach count
    const { data: coaches, error: coachesError } = await supabase
      .from('coaches')
      .select('id')
      .eq('is_active', true);

    if (coachesError) {
      throw new Error(`Failed to fetch coaches: ${coachesError.message}`);
    }

    // Calculate metrics
    const totalRevenue = payments?.reduce((sum, p) => sum + p.amount_cents, 0) || 0;
    const totalFees = payments?.reduce((sum, p) => sum + p.platform_fee_cents, 0) || 0;
    const totalRefunds = refunds?.reduce((sum, r) => sum + r.amount_cents, 0) || 0;
    const totalSessions = payments?.length || 0;
    const activeCoaches = coaches?.length || 0;

    const averageSessionValue = totalSessions > 0 
      ? Math.round(totalRevenue / totalSessions)
      : 0;

    const refundRate = totalRevenue > 0 
      ? Math.round((totalRefunds / totalRevenue) * 10000) / 100 // 2 decimal places
      : 0;

    return {
      total_revenue_cents: totalRevenue,
      total_fees_collected_cents: totalFees,
      active_coaches: activeCoaches,
      total_sessions: totalSessions,
      average_session_value_cents: averageSessionValue,
      refund_rate_percentage: refundRate,
    };
  }

  async getRevenueByMonth(
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{
    month: string;
    revenue_cents: number;
    fees_cents: number;
    sessions_count: number;
  }>> {
    let query = supabase.rpc('get_revenue_by_month', {
      start_date: startDate?.toISOString().split('T')[0],
      end_date: endDate?.toISOString().split('T')[0],
    });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch revenue by month: ${error.message}`);
    }

    return data || [];
  }

  async getTopPerformingCoaches(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{
    coach_id: string;
    coach_name: string;
    total_earnings_cents: number;
    session_count: number;
    avg_rating: number;
  }>> {
    let query = supabase
      .from('payments')
      .select(`
        coach_id,
        coach_earnings_cents,
        coaches!inner(first_name, last_name)
      `)
      .eq('status', 'succeeded');

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: payments, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch top coaches: ${error.message}`);
    }

    // Group and sort
    const coachMap = new Map();
    payments?.forEach((payment: any) => {
      const key = payment.coach_id;
      if (!coachMap.has(key)) {
        coachMap.set(key, {
          coach_id: payment.coach_id,
          coach_name: `${payment.coaches.first_name} ${payment.coaches.last_name}`,
          total_earnings_cents: 0,
          session_count: 0,
          avg_rating: 4.5, // Would need actual rating system
        });
      }
      const coach = coachMap.get(key);
      coach.total_earnings_cents += payment.coach_earnings_cents;
      coach.session_count += 1;
    });

    return Array.from(coachMap.values())
      .sort((a, b) => b.total_earnings_cents - a.total_earnings_cents)
      .slice(0, limit);
  }

  async getPaymentMethodDistribution(): Promise<Array<{
    payment_method: string;
    count: number;
    percentage: number;
  }>> {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('payment_method_type')
      .eq('status', 'succeeded');

    if (error) {
      throw new Error(`Failed to fetch payment methods: ${error.message}`);
    }

    const methodMap = new Map<string, number>();
    const total = payments?.length || 0;

    payments?.forEach((payment) => {
      const method = payment.payment_method_type || 'unknown';
      methodMap.set(method, (methodMap.get(method) || 0) + 1);
    });

    return Array.from(methodMap.entries()).map(([method, count]) => ({
      payment_method: method,
      count,
      percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    }));
  }

  async getRefundAnalysis(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total_refunds: number;
    total_refund_amount_cents: number;
    refund_by_reason: Array<{
      reason: string;
      count: number;
      amount_cents: number;
    }>;
    refund_by_initiator: Array<{
      initiated_by_type: string;
      count: number;
      amount_cents: number;
    }>;
  }> {
    let query = supabase
      .from('refunds')
      .select('*')
      .eq('status', 'succeeded');

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: refunds, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch refunds: ${error.message}`);
    }

    const totalRefunds = refunds?.length || 0;
    const totalRefundAmount = refunds?.reduce((sum, r) => sum + r.amount_cents, 0) || 0;

    // Group by reason
    const reasonMap = new Map();
    const initiatorMap = new Map();

    refunds?.forEach((refund) => {
      // By reason
      const reason = refund.reason;
      if (!reasonMap.has(reason)) {
        reasonMap.set(reason, { count: 0, amount_cents: 0 });
      }
      const reasonData = reasonMap.get(reason);
      reasonData.count += 1;
      reasonData.amount_cents += refund.amount_cents;

      // By initiator
      const initiator = refund.initiated_by_type;
      if (!initiatorMap.has(initiator)) {
        initiatorMap.set(initiator, { count: 0, amount_cents: 0 });
      }
      const initiatorData = initiatorMap.get(initiator);
      initiatorData.count += 1;
      initiatorData.amount_cents += refund.amount_cents;
    });

    return {
      total_refunds: totalRefunds,
      total_refund_amount_cents: totalRefundAmount,
      refund_by_reason: Array.from(reasonMap.entries()).map(([reason, data]) => ({
        reason,
        ...data,
      })),
      refund_by_initiator: Array.from(initiatorMap.entries()).map(([type, data]) => ({
        initiated_by_type: type,
        ...data,
      })),
    };
  }
}