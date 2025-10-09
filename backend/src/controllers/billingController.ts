import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
import { billingService } from '../services/billingService';
// Removed mock billing service - using real data only
import {
  BillingHistoryRequest,
  CreateRefundRequestData,
  ProcessRefundRequest,
  PayoutRequest,
  TransactionFilters,
  CoachBankAccountRequest
} from '../types/payment';
import { bankAccountService } from '../services/bankAccountService';

export class BillingController {
  // Get billing history for a user
  async getBillingHistory(req: Request, res: Response) {
    try {
      const { user_id, user_type, start_date, end_date, transaction_types, status, limit, offset } = req.query;

      if (!user_id || !user_type) {
        return res.status(400).json({ error: 'user_id and user_type are required' });
      }

      const request: BillingHistoryRequest = {
        user_id: user_id as string,
        user_type: user_type as 'client' | 'coach',
        start_date: start_date ? new Date(start_date as string) : undefined,
        end_date: end_date ? new Date(end_date as string) : undefined,
        transaction_types: transaction_types ? (transaction_types as string).split(',') : undefined,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const history = await billingService.getBillingHistory(request);
      res.json(history);
    } catch (error) {
      console.error('Error getting billing history:', error);
      res.status(500).json({ error: 'Failed to retrieve billing history' });
    }
  }

  // Get coach bank accounts
  async getBankAccounts(req: AuthRequest, res: Response) {
    try {
      const coach_id = req.user?.id;
      if (!coach_id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const bankAccounts = await bankAccountService.getBankAccounts(coach_id);
      res.json(bankAccounts);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      res.status(500).json({ error: 'Failed to fetch bank accounts' });
    }
  }

  // Add bank account for coach
  async addBankAccount(req: AuthRequest, res: Response) {
    try {
      const coach_id = req.user?.id;
      if (!coach_id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const bankAccountData: CoachBankAccountRequest = req.body;
      const bankAccount = await bankAccountService.addBankAccount(coach_id, bankAccountData);
      res.status(201).json(bankAccount);
    } catch (error) {
      console.error('Error adding bank account:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to add bank account' });
    }
  }

  // Create refund request
  async createRefundRequest(req: Request, res: Response) {
    try {
      const data: CreateRefundRequestData = req.body;
      const { requestedBy, requestedByType } = req.body;

      if (!data.payment_id || !data.reason || !requestedBy || !requestedByType) {
        return res.status(400).json({ error: 'payment_id, reason, requestedBy, and requestedByType are required' });
      }

      const refundRequest = await billingService.createRefundRequest(
        data,
        requestedBy,
        requestedByType as 'client' | 'coach' | 'admin'
      );
      res.status(201).json(refundRequest);
    } catch (error) {
      console.error('Error creating refund request:', error);
      res.status(500).json({ error: 'Failed to create refund request' });
    }
  }

  // Process refund request (admin only)
  async processRefundRequest(req: Request, res: Response) {
    try {
      const request: ProcessRefundRequest = req.body;
      const { reviewedBy } = req.body;

      if (!request.refund_request_id || !request.action || !reviewedBy) {
        return res.status(400).json({ error: 'refund_request_id, action, and reviewedBy are required' });
      }

      if (request.action === 'reject' && !request.rejection_reason) {
        return res.status(400).json({ error: 'rejection_reason is required when rejecting' });
      }

      const refundRequest = await billingService.processRefundRequest(request, reviewedBy);
      res.json(refundRequest);
    } catch (error) {
      console.error('Error processing refund request:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to process refund request' });
    }
  }

  // Create payout for coach (admin only)
  async createPayout(req: Request, res: Response) {
    try {
      const request: PayoutRequest = req.body;

      if (!request.coach_id || !request.bank_account_id || !request.payment_id) {
        return res.status(400).json({ error: 'coach_id, bank_account_id, and payment_id are required' });
      }

      const payout = await billingService.createPayout(request);
      res.status(201).json(payout);
    } catch (error) {
      console.error('Error creating payout:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create payout' });
    }
  }

  // Get billing dashboard data
  async getBillingDashboard(req: Request, res: Response) {
    try {
      const { userId, userType } = req.params;

      if (!userId || !userType) {
        return res.status(400).json({ error: 'userId and userType are required' });
      }

      // Use real billing service only - no mock fallback
      const dashboard = await billingService.getBillingDashboard(userId, userType as 'client' | 'coach');

      res.json(dashboard);
    } catch (error) {
      console.error('Error getting billing dashboard:', error);
      res.status(500).json({ error: 'Failed to retrieve billing dashboard' });
    }
  }

  // Get billing report
  async getBillingReport(req: Request, res: Response) {
    try {
      const { userId, userType } = req.params;
      const { start_date, end_date } = req.query;

      if (!userId || !userType || !start_date || !end_date) {
        return res.status(400).json({ error: 'userId, userType, start_date, and end_date are required' });
      }

      const startDate = new Date(start_date as string);
      const endDate = new Date(end_date as string);

      const report = await billingService.getBillingReport(userId, userType as 'client' | 'coach', startDate, endDate);
      res.json(report);
    } catch (error) {
      console.error('Error getting billing report:', error);
      res.status(500).json({ error: 'Failed to retrieve billing report' });
    }
  }

  // Get filtered transactions
  async getFilteredTransactions(req: Request, res: Response) {
    try {
      const { userId, userType } = req.params;
      const filters: TransactionFilters = {
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
        transaction_types: req.query.transaction_types ? (req.query.transaction_types as string).split(',') : undefined,
        status: req.query.status ? (req.query.status as string).split(',') : undefined,
        min_amount_cents: req.query.min_amount_cents ? parseInt(req.query.min_amount_cents as string) : undefined,
        max_amount_cents: req.query.max_amount_cents ? parseInt(req.query.max_amount_cents as string) : undefined,
        search_term: req.query.search_term as string
      };

      // Use real billing service only - no mock fallback
      const transactions = await billingService.getFilteredTransactions(userId, userType as 'client' | 'coach', filters);

      res.json(transactions);
    } catch (error) {
      console.error('Error getting filtered transactions:', error);
      res.status(500).json({ error: 'Failed to retrieve transactions' });
    }
  }

  // Admin endpoints
  async getAllRefundRequests(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const refunds = await billingService.getAllRefundRequests(status as string);
      res.json(refunds);
    } catch (error) {
      console.error('Error getting refund requests:', error);
      res.status(500).json({ error: 'Failed to retrieve refund requests' });
    }
  }

  async getAllPayouts(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const payouts = await billingService.getAllPayouts(status as string);
      res.json(payouts);
    } catch (error) {
      console.error('Error getting payouts:', error);
      res.status(500).json({ error: 'Failed to retrieve payouts' });
    }
  }

  // Approve payout (admin only)
  async approvePayout(req: Request, res: Response) {
    try {
      const { payout_id } = req.params;
      const { admin_id, notes } = req.body;

      if (!admin_id) {
        return res.status(400).json({ error: 'admin_id is required' });
      }

      const payout = await billingService.approvePayout(payout_id, admin_id, notes);
      res.json(payout);
    } catch (error) {
      console.error('Error approving payout:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to approve payout' });
    }
  }

  // Reject payout (admin only)
  async rejectPayout(req: Request, res: Response) {
    try {
      const { payout_id } = req.params;
      const { admin_id, rejection_reason } = req.body;

      if (!admin_id) {
        return res.status(400).json({ error: 'admin_id is required' });
      }

      if (!rejection_reason) {
        return res.status(400).json({ error: 'rejection_reason is required' });
      }

      const payout = await billingService.rejectPayout(payout_id, admin_id, rejection_reason);
      res.json(payout);
    } catch (error) {
      console.error('Error rejecting payout:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to reject payout' });
    }
  }

  // Delete bank account
  async deleteBankAccount(req: AuthRequest, res: Response) {
    try {
      const coach_id = req.user?.id;
      const { bank_account_id } = req.params;

      if (!coach_id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await bankAccountService.deleteBankAccount(coach_id, bank_account_id);
      res.json({ message: 'Bank account deleted successfully' });
    } catch (error) {
      console.error('Error deleting bank account:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete bank account' });
    }
  }

  // Set default bank account
  async setDefaultBankAccount(req: AuthRequest, res: Response) {
    try {
      const coach_id = req.user?.id;
      const { bank_account_id } = req.params;

      if (!coach_id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await bankAccountService.setDefaultBankAccount(coach_id, bank_account_id);
      res.json({ message: 'Default bank account updated successfully' });
    } catch (error) {
      console.error('Error setting default bank account:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to set default bank account' });
    }
  }

  // Coach requests payout
  async requestPayout(req: AuthRequest, res: Response) {
    try {
      const coach_id = req.user?.id;

      if (!coach_id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { bank_account_id, notes } = req.body;

      const payout = await billingService.requestCoachPayout(coach_id, bank_account_id, notes);
      res.status(201).json(payout);
    } catch (error) {
      console.error('Error requesting payout:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to request payout' });
    }
  }

  // Get coach's payout requests
  async getMyPayoutRequests(req: AuthRequest, res: Response) {
    try {
      const coach_id = req.user?.id;

      if (!coach_id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { status } = req.query;
      const payouts = await billingService.getCoachPayoutRequests(coach_id, status as string);
      res.json(payouts);
    } catch (error) {
      console.error('Error getting payout requests:', error);
      res.status(500).json({ error: 'Failed to retrieve payout requests' });
    }
  }

  // Get coach's pending earnings
  async getPendingEarnings(req: AuthRequest, res: Response) {
    try {
      const coach_id = req.user?.id;

      if (!coach_id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const earnings = await billingService.getCoachPendingEarnings(coach_id);
      res.json(earnings);
    } catch (error) {
      console.error('Error getting pending earnings:', error);
      res.status(500).json({ error: 'Failed to retrieve pending earnings' });
    }
  }
}

export const billingController = new BillingController();