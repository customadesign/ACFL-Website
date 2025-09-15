import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { JWTPayload } from '../types/auth';

interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const financialController = {
  // Get payment transactions with filters
  async getTransactions(req: AuthRequest, res: Response) {
    try {
      const { 
        status, 
        start_date, 
        end_date, 
        client_id, 
        coach_id,
        page = 1,
        limit = 20
      } = req.query;
      
      let query = supabase
        .from('payment_transactions')
        .select(`
          *,
          client:clients(first_name, last_name, email),
          coach:coaches(first_name, last_name, email),
          session:sessions(scheduled_at, duration_minutes)
        `, { count: 'exact' });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (start_date) {
        query = query.gte('created_at', start_date);
      }
      
      if (end_date) {
        query = query.lte('created_at', end_date);
      }
      
      if (client_id) {
        query = query.eq('client_id', client_id);
      }
      
      if (coach_id) {
        query = query.eq('coach_id', coach_id);
      }
      
      // Pagination
      const offset = (Number(page) - 1) * Number(limit);
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      res.json({
        transactions: data,
        total: count,
        page: Number(page),
        totalPages: Math.ceil((count || 0) / Number(limit))
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  },

  // Get transaction statistics
  async getTransactionStats(req: AuthRequest, res: Response) {
    try {
      const { start_date, end_date } = req.query;
      
      // Base query for transactions
      let query = supabase
        .from('payment_transactions')
        .select('amount, status, created_at');
      
      if (start_date) {
        query = query.gte('created_at', start_date);
      }
      
      if (end_date) {
        query = query.lte('created_at', end_date);
      }
      
      const { data: transactions, error } = await query;
      
      if (error) throw error;
      
      // Calculate statistics
      const stats = {
        totalRevenue: 0,
        totalTransactions: transactions?.length || 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        pendingTransactions: 0,
        refundedAmount: 0,
        averageTransactionValue: 0,
        transactionsByStatus: {} as Record<string, number>,
        revenueByDay: {} as Record<string, number>
      };
      
      transactions?.forEach(transaction => {
        const amount = Number(transaction.amount);
        
        // Count by status
        stats.transactionsByStatus[transaction.status] = 
          (stats.transactionsByStatus[transaction.status] || 0) + 1;
        
        // Calculate totals
        if (transaction.status === 'completed') {
          stats.totalRevenue += amount;
          stats.successfulTransactions++;
          
          // Group by day
          const day = new Date(transaction.created_at).toISOString().split('T')[0];
          stats.revenueByDay[day] = (stats.revenueByDay[day] || 0) + amount;
        } else if (transaction.status === 'failed') {
          stats.failedTransactions++;
        } else if (transaction.status === 'pending') {
          stats.pendingTransactions++;
        } else if (transaction.status === 'refunded') {
          stats.refundedAmount += amount;
        }
      });
      
      if (stats.successfulTransactions > 0) {
        stats.averageTransactionValue = stats.totalRevenue / stats.successfulTransactions;
      }
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
      res.status(500).json({ error: 'Failed to fetch transaction statistics' });
    }
  },

  // Get financial reports
  async getFinancialReports(req: AuthRequest, res: Response) {
    try {
      const { report_type, start_date, end_date } = req.query;
      
      let query = supabase
        .from('financial_reports')
        .select('*')
        .order('generated_at', { ascending: false });
      
      if (report_type) {
        query = query.eq('report_type', report_type);
      }
      
      if (start_date) {
        query = query.gte('start_date', start_date);
      }
      
      if (end_date) {
        query = query.lte('end_date', end_date);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'Failed to fetch financial reports' });
    }
  },

  // Generate financial report
  async generateReport(req: AuthRequest, res: Response) {
    try {
      const { start_date, end_date, report_type } = req.body;
      
      // Fetch transactions for the period
      const { data: transactions, error: transError } = await supabase
        .from('payment_transactions')
        .select('*')
        .gte('created_at', start_date)
        .lte('created_at', end_date);
      
      if (transError) throw transError;
      
      // Calculate report metrics
      let totalRevenue = 0;
      let successfulTransactions = 0;
      let failedTransactions = 0;
      let refundedAmount = 0;
      let platformFees = 0;
      let coachPayouts = 0;
      
      const transactionsByCoach: Record<string, number> = {};
      const transactionsByClient: Record<string, number> = {};
      
      transactions?.forEach(transaction => {
        const amount = Number(transaction.amount);
        
        if (transaction.status === 'completed') {
          totalRevenue += amount;
          successfulTransactions++;
          
          // Assuming 20% platform fee
          const fee = amount * 0.20;
          platformFees += fee;
          coachPayouts += (amount - fee);
          
          // Group by coach
          if (transaction.coach_id) {
            transactionsByCoach[transaction.coach_id] = 
              (transactionsByCoach[transaction.coach_id] || 0) + amount;
          }
          
          // Group by client
          if (transaction.client_id) {
            transactionsByClient[transaction.client_id] = 
              (transactionsByClient[transaction.client_id] || 0) + 1;
          }
        } else if (transaction.status === 'failed') {
          failedTransactions++;
        } else if (transaction.status === 'refunded') {
          refundedAmount += amount;
        }
      });
      
      // Save report
      const { data: report, error: reportError } = await supabase
        .from('financial_reports')
        .insert({
          report_type,
          start_date,
          end_date,
          total_revenue: totalRevenue,
          total_transactions: transactions?.length || 0,
          successful_transactions: successfulTransactions,
          failed_transactions: failedTransactions,
          refunded_amount: refundedAmount,
          platform_fees: platformFees,
          coach_payouts: coachPayouts,
          report_data: {
            transactionsByCoach,
            transactionsByClient,
            dailyRevenue: calculateDailyRevenue(transactions),
            topCoaches: getTopCoaches(transactionsByCoach),
            topClients: getTopClients(transactionsByClient)
          },
          generated_by: req.user?.userId
        })
        .select()
        .single();
      
      if (reportError) throw reportError;
      
      res.json(report);
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: 'Failed to generate financial report' });
    }
  },

  // Get coach payouts
  async getCoachPayouts(req: AuthRequest, res: Response) {
    try {
      const { start_date, end_date } = req.query;
      
      // Fetch completed transactions grouped by coach
      let query = supabase
        .from('payment_transactions')
        .select(`
          coach_id,
          coaches!inner(first_name, last_name, email, hourly_rate_usd),
          amount
        `)
        .eq('status', 'completed');
      
      if (start_date) {
        query = query.gte('created_at', start_date);
      }
      
      if (end_date) {
        query = query.lte('created_at', end_date);
      }
      
      const { data: transactions, error } = await query;
      
      if (error) throw error;
      
      // Calculate payouts by coach
      const payoutsByCoach: Record<string, any> = {};
      
      transactions?.forEach((transaction: any) => {
        const coachId = transaction.coach_id;
        const amount = Number(transaction.amount);
        const platformFee = amount * 0.20; // 20% platform fee
        const payout = amount - platformFee;
        
        if (!payoutsByCoach[coachId]) {
          payoutsByCoach[coachId] = {
            coach: transaction.coaches,
            totalRevenue: 0,
            platformFees: 0,
            netPayout: 0,
            transactionCount: 0
          };
        }
        
        payoutsByCoach[coachId].totalRevenue += amount;
        payoutsByCoach[coachId].platformFees += platformFee;
        payoutsByCoach[coachId].netPayout += payout;
        payoutsByCoach[coachId].transactionCount++;
      });
      
      const payouts = Object.values(payoutsByCoach);
      
      res.json({
        payouts,
        summary: {
          totalRevenue: payouts.reduce((sum, p) => sum + p.totalRevenue, 0),
          totalPlatformFees: payouts.reduce((sum, p) => sum + p.platformFees, 0),
          totalPayouts: payouts.reduce((sum, p) => sum + p.netPayout, 0),
          coachCount: payouts.length
        }
      });
    } catch (error) {
      console.error('Error fetching coach payouts:', error);
      res.status(500).json({ error: 'Failed to fetch coach payouts' });
    }
  },

  // Process refund (restricted action)
  async processRefund(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      // Fetch the transaction
      const { data: transaction, error: fetchError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (transaction.status !== 'completed') {
        return res.status(400).json({ 
          error: 'Only completed transactions can be refunded' 
        });
      }
      
      // Update transaction status
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'refunded',
          metadata: {
            ...transaction.metadata,
            refund_reason: reason,
            refunded_by: req.user?.userId,
            refunded_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // TODO: Integrate with actual payment provider for refund processing
      
      res.json({ 
        message: 'Refund processed successfully',
        note: 'Payment provider refund integration pending'
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      res.status(500).json({ error: 'Failed to process refund' });
    }
  }
};

// Helper functions
function calculateDailyRevenue(transactions: any[]) {
  const dailyRevenue: Record<string, number> = {};
  
  transactions?.forEach(transaction => {
    if (transaction.status === 'completed') {
      const date = new Date(transaction.created_at).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + Number(transaction.amount);
    }
  });
  
  return dailyRevenue;
}

function getTopCoaches(transactionsByCoach: Record<string, number>, limit = 5) {
  return Object.entries(transactionsByCoach)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([coachId, revenue]) => ({ coachId, revenue }));
}

function getTopClients(transactionsByClient: Record<string, number>, limit = 5) {
  return Object.entries(transactionsByClient)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([clientId, count]) => ({ clientId, transactionCount: count }));
}