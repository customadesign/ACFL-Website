import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { CoachRateService } from '../services/coachRateService';
import { 
  CreatePaymentIntentRequest, 
  CreateRefundRequest,
  CoachRateRequest 
} from '../types/payment';

export class PaymentController {
  private paymentService: PaymentService;
  private coachRateService: CoachRateService;

  constructor() {
    this.paymentService = new PaymentService();
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

  // Payment Processing
  createPaymentIntent = async (req: Request & { user?: any }, res: Response) => {
    try {
      const clientId = req.user?.id; // Assuming authentication middleware sets this
      if (!clientId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const request: CreatePaymentIntentRequest = req.body;
      const response = await this.paymentService.createPaymentIntent(clientId, request);
      res.status(201).json(response);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  confirmPayment = async (req: Request, res: Response) => {
    try {
      const { paymentIntentId } = req.params;
      const payment = await this.paymentService.confirmPayment(paymentIntentId);
      res.json(payment);
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

  // Webhook handler
  handleStripeWebhook = async (req: Request, res: Response) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        return res.status(500).json({ error: 'Webhook secret not configured' });
      }

      // Verify webhook signature
      const stripe = require('../lib/stripe').default;
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }

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