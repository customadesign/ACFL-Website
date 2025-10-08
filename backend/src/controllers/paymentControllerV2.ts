import { Request, Response } from 'express';
import { PaymentServiceV2 } from '../services/paymentServiceV2';
import { CoachRateService } from '../services/coachRateService';
import { 
  CreatePaymentAuthorizationRequest,
  CapturePaymentRequest,
  CreateRefundRequest,
  RefundApprovalRequest,
  SessionCompletionRequest,
  CoachRateRequest,
  CreatePaymentIntentRequest
} from '../types/payment';

export class PaymentControllerV2 {
  private paymentService: PaymentServiceV2;
  private coachRateService: CoachRateService;

  constructor() {
    this.paymentService = new PaymentServiceV2();
    this.coachRateService = new CoachRateService();
  }

  // Authorization/Capture Payment Flow
  createPaymentAuthorization = async (req: Request & { user?: any }, res: Response) => {
    try {
      const clientId = req.user?.id;
      if (!clientId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const request: CreatePaymentIntentRequest = req.body;
      const response = await this.paymentService.createPaymentAuthorization(clientId, request as any);
      res.status(201).json(response);
    } catch (error) {
      console.error('Create payment authorization error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  capturePayment = async (req: Request & { user?: any }, res: Response) => {
    try {
      const { payment_id } = req.body;
      const response = await this.paymentService.capturePayment(payment_id);
      res.json(response);
    } catch (error) {
      console.error('Capture payment error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Session Management - Complete session and generate invoice
  completeSession = async (req: Request & { user?: any }, res: Response) => {
    try {
      const { session_id, session_notes, auto_capture_payment, generate_invoice } = req.body;

      if (!session_id) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      // Import session service
      const { sessionService } = await import('../services/sessionService');

      // Complete the session (user ID should come from auth middleware)
      const userId = req.user?.id || 'system'; // Replace with actual user ID from auth

      const result = await sessionService.completeSession(
        {
          session_id,
          session_notes,
          auto_capture_payment: auto_capture_payment !== false,
          generate_invoice: generate_invoice !== false
        },
        userId
      );

      res.json({
        success: true,
        data: {
          session: result.session,
          invoice: result.invoice,
          message: 'Session completed successfully. Invoice has been generated and sent to the client.'
        }
      });
    } catch (error) {
      console.error('Complete session error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  cancelSession = async (req: Request & { user?: any }, res: Response) => {
    try {
      res.status(501).json({ error: 'Session cancellation not implemented yet' });
    } catch (error) {
      console.error('Cancel session error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Refund Management - Use existing method from PaymentServiceV2
  createRefundRequest = async (req: Request & { user?: any }, res: Response) => {
    try {
      const adminId = req.user?.role === 'admin' ? req.user.id : null;
      const request: CreateRefundRequest = req.body;
      
      // For now, just use the existing payment service until we implement full refund workflow
      res.status(501).json({ error: 'Advanced refund workflow not implemented yet' });
    } catch (error) {
      console.error('Create refund request error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  approveRefund = async (req: Request & { user?: any }, res: Response) => {
    try {
      res.status(501).json({ error: 'Refund approval not implemented yet' });
    } catch (error) {
      console.error('Approve refund error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Automatic Refund Processing
  processAutomaticRefunds = async (req: Request, res: Response) => {
    try {
      res.status(501).json({ error: 'Automatic refund processing not implemented yet' });
    } catch (error) {
      console.error('Process automatic refunds error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Admin Management Endpoints
  getPendingRefundApprovals = async (req: Request & { user?: any }, res: Response) => {
    try {
      res.status(501).json({ error: 'Pending refund approvals not implemented yet' });
    } catch (error) {
      console.error('Get pending refund approvals error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getExpiringAuthorizations = async (req: Request & { user?: any }, res: Response) => {
    try {
      res.status(501).json({ error: 'Expiring authorizations not implemented yet' });
    } catch (error) {
      console.error('Get expiring authorizations error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Session Management Endpoints
  getSessions = async (req: Request & { user?: any }, res: Response) => {
    try {
      const { coach_id, client_id, status } = req.query;

      // Import session service
      const { sessionService } = await import('../services/sessionService');

      let sessions;
      if (coach_id) {
        sessions = await sessionService.getCoachSessions(coach_id as string, status as string);
      } else if (client_id) {
        sessions = await sessionService.getClientSessions(client_id as string, status as string);
      } else {
        return res.status(400).json({ error: 'Either coach_id or client_id is required' });
      }

      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getSessionById = async (req: Request & { user?: any }, res: Response) => {
    try {
      const { sessionId } = req.params;

      // Import session service
      const { sessionService } = await import('../services/sessionService');

      const session = await sessionService.getSessionWithInvoice(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      console.error('Get session by ID error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Payment Status Endpoints
  getPaymentStatus = async (req: Request & { user?: any }, res: Response) => {
    try {
      res.status(501).json({ error: 'Get payment status not implemented yet' });
    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Legacy endpoints for backward compatibility (delegate to original controller)
  getCoachRates = async (req: Request, res: Response) => {
    try {
      const { coachId } = req.params;
      const rates = await this.coachRateService.getCoachRates(coachId);
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  createCoachRate = async (req: Request, res: Response) => {
    try {
      const { coachId } = req.params;
      const rateRequest: CoachRateRequest = req.body;
      
      const rate = await this.coachRateService.createCoachRate(coachId, rateRequest);
      res.status(201).json(rate);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getPublicCoachRates = async (req: Request, res: Response) => {
    try {
      const { coachId } = req.params;
      const { sessionType } = req.query;
      
      let rates;
      if (sessionType && typeof sessionType === 'string') {
        rates = await this.coachRateService.getCoachRatesByType(
          coachId, 
          sessionType as any
        );
      } else {
        rates = await this.coachRateService.getPublicCoachRates(coachId);
      }
      
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Webhook handler for Stripe events
  handleStripeWebhook = async (req: Request, res: Response) => {
    try {
      res.status(501).json({ error: 'Webhook handling not implemented yet' });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };
}

export const paymentControllerV2 = new PaymentControllerV2();