import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
// import { authenticateUser, requireRole } from '../middleware/auth'; // Uncomment when available

const router = Router();

// Coach Rate Management Routes
router.get('/coaches/:coachId/rates', paymentController.getCoachRates);
router.post('/coaches/:coachId/rates', paymentController.createCoachRate);
router.put('/rates/:rateId', paymentController.updateCoachRate);
router.delete('/rates/:rateId', paymentController.deactivateCoachRate);
router.post('/rates/:rateId/duplicate', paymentController.duplicateCoachRate);
router.put('/coaches/:coachId/rates/bulk', paymentController.bulkUpdateCoachRates);

// Public Coach Rates (no authentication required)
router.get('/public/coaches/:coachId/rates', paymentController.getPublicCoachRates);
router.post('/public/calculate-package-discount', paymentController.calculatePackageDiscount);

// Payment Processing Routes
router.post('/create-payment-intent', paymentController.createPaymentIntent);
router.post('/confirm-payment/:paymentIntentId', paymentController.confirmPayment);
router.post('/refunds', paymentController.createRefund);

// Stripe Webhook
router.post('/webhook', paymentController.handleStripeWebhook);

export default router;