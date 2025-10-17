import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Coach Rate Management Routes (protected)
router.get('/coaches/:coachId/rates', authenticate, paymentController.getCoachRates);
router.post('/coaches/:coachId/rates', authenticate, paymentController.createCoachRate);
router.put('/rates/:rateId', authenticate, paymentController.updateCoachRate);
router.delete('/rates/:rateId', authenticate, paymentController.deactivateCoachRate);
router.post('/rates/:rateId/duplicate', authenticate, paymentController.duplicateCoachRate);
router.put('/coaches/:coachId/rates/bulk', authenticate, paymentController.bulkUpdateCoachRates);

// Public Coach Rates (no authentication required)
router.get('/public/coaches/:coachId/rates', paymentController.getPublicCoachRates);
router.post('/public/calculate-package-discount', paymentController.calculatePackageDiscount);

// Test endpoint for Square payment (temporary - remove in production)
router.post('/test-payment-authorization', paymentController.testPaymentAuthorization);

// Square Payment Processing Routes (protected)
router.post('/create-payment-authorization', authenticate, paymentController.createPaymentIntent); // Creates authorization
router.post('/capture-payment/:paymentId', authenticate, paymentController.capturePayment); // Captures after session
router.post('/cancel-authorization/:paymentId', authenticate, paymentController.cancelAuthorization); // Cancels authorization
router.post('/refunds', authenticate, paymentController.createRefund);

// Square Payment Webhook (no auth - called by Square)
router.post('/webhook/square', paymentController.handlePaymentWebhook);
router.post('/webhook', paymentController.handlePaymentWebhook); // Alternative webhook path for Square

// Legacy routes for backward compatibility (protected)
router.post('/create-payment-intent', authenticate, paymentController.createPaymentIntent);
router.post('/confirm-payment/:paymentIntentId', authenticate, paymentController.capturePayment);

export default router;
