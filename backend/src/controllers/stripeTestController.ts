import { Request, Response } from 'express';
import stripe from '../lib/stripe';

export class StripeTestController {
  // Test Stripe connection
  testConnection = async (req: Request, res: Response) => {
    try {
      // Try to list products (this will test our API key)
      const products = await stripe.products.list({ limit: 1 });
      
      res.json({
        success: true,
        message: 'Stripe connection successful',
        account: {
          apiVersion: '2025-08-27.basil',
          mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'live'
        },
        productCount: products.data.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Stripe connection failed',
        error: (error as Error).message
      });
    }
  };

  // Create a test payment intent
  createTestPaymentIntent = async (req: Request, res: Response) => {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 5000, // $50.00
        currency: 'usd',
        metadata: {
          test: 'true',
          description: 'Test payment intent'
        }
      });

      res.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        status: paymentIntent.status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  // Test webhook endpoint
  testWebhook = async (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Webhook endpoint is accessible',
      timestamp: new Date().toISOString(),
      headers: {
        'stripe-signature': req.headers['stripe-signature'] || 'not-present'
      }
    });
  };
}

export const stripeTestController = new StripeTestController();