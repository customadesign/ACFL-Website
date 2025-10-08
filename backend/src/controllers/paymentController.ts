import { Request, Response } from 'express';
import { PaymentServiceV2 } from '../services/paymentServiceV2';
import { CoachRateService } from '../services/coachRateService';
import { 
  CreatePaymentIntentRequest, 
  CreateRefundRequest,
  CoachRateRequest 
} from '../types/payment';

export class PaymentController {
  private paymentService: PaymentServiceV2;
  private coachRateService: CoachRateService;

  constructor() {
    this.paymentService = new PaymentServiceV2();
    this.coachRateService = new CoachRateService();
  }

  // Coach Rate Management
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

  updateCoachRate = async (req: Request, res: Response) => {
    try {
      const { rateId } = req.params;
      const updates: Partial<CoachRateRequest> = req.body;
      
      const rate = await this.coachRateService.updateCoachRate(rateId, updates);
      res.json(rate);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  deactivateCoachRate = async (req: Request, res: Response) => {
    try {
      const { rateId } = req.params;
      await this.coachRateService.deactivateCoachRate(rateId);
      res.json({ message: 'Coach rate deactivated successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  duplicateCoachRate = async (req: Request, res: Response) => {
    try {
      const { rateId } = req.params;
      const rate = await this.coachRateService.duplicateCoachRate(rateId);
      res.status(201).json(rate);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Test payment endpoint (no auth required)
  testPaymentAuthorization = async (req: Request, res: Response) => {
    try {
      const request: CreatePaymentIntentRequest = req.body;
      // Use a test client ID for testing purposes
      const testClientId = 'test-client-123';

      const response = await this.paymentService.createPaymentAuthorization(testClientId, request);
      res.status(201).json(response);
    } catch (error) {
      console.error('Test payment authorization error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Payment Processing
  createPaymentIntent = async (req: Request & { user?: any }, res: Response) => {
    try {
      // Use userId from JWT payload (see types/auth.ts JWTPayload interface)
      const clientId = req.user?.userId || req.user?.id;
      if (!clientId) {
        console.error('No user ID found in request. User object:', req.user);
        return res.status(401).json({ error: 'Authentication required' });
      }

      const request: CreatePaymentIntentRequest = req.body;
      const response = await this.paymentService.createPaymentAuthorization(clientId, request);
      res.status(201).json(response);
    } catch (error) {
      console.error('Payment intent creation error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  capturePayment = async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      const payment = await this.paymentService.capturePayment(paymentId);
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  cancelAuthorization = async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      const { reason } = req.body;
      await this.paymentService.cancelAuthorization(paymentId, reason);
      res.json({ message: 'Payment authorization cancelled successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  createRefund = async (req: Request & { user?: any }, res: Response) => {
    try {
      const adminId = req.user?.role === 'admin' ? req.user.id : null;
      const request: CreateRefundRequest = req.body;
      
      const response = await this.paymentService.createRefund(adminId, request);
      res.status(201).json(response);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Webhook handler - Stubbed for new payment gateway
  handlePaymentWebhook = async (req: Request, res: Response) => {
    try {
      // Stub: Webhook verification would happen here with new payment gateway
      // For now, just pass the event to the service
      const event = req.body;

      await this.paymentService.handleWebhook(event);
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Public endpoints
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

  calculatePackageDiscount = async (req: Request, res: Response) => {
    try {
      const { individualRateCents, packageSessions, discountPercentage } = req.body;
      
      const packagePrice = await this.coachRateService.calculatePackageDiscount(
        individualRateCents,
        packageSessions,
        discountPercentage
      );
      
      res.json({
        individualTotal: individualRateCents * packageSessions,
        packagePrice,
        savings: (individualRateCents * packageSessions) - packagePrice,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Bulk operations
  bulkUpdateCoachRates = async (req: Request, res: Response) => {
    try {
      const { coachId } = req.params;
      const { updates } = req.body;
      
      const results = await this.coachRateService.bulkUpdateCoachRates(coachId, updates);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };
}

export const paymentController = new PaymentController();