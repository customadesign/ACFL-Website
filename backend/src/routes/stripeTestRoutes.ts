import { Router } from 'express';
import { stripeTestController } from '../controllers/stripeTestController';

const router = Router();

// Test routes
router.get('/test-connection', stripeTestController.testConnection);
router.post('/test-payment-intent', stripeTestController.createTestPaymentIntent);
router.post('/test-webhook', stripeTestController.testWebhook);

export default router;