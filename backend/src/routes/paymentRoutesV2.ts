import { Router } from 'express';
import { paymentControllerV2 } from '../controllers/paymentControllerV2';
// import { authenticateUser, requireRole } from '../middleware/auth'; // Uncomment when available

const router = Router();

// Authorization/Capture Payment Flow
router.post('/authorize', paymentControllerV2.createPaymentAuthorization);
router.post('/capture', paymentControllerV2.capturePayment);
router.get('/status/:paymentId', paymentControllerV2.getPaymentStatus);

// Session Management
router.get('/sessions', paymentControllerV2.getSessions);
router.get('/sessions/:sessionId', paymentControllerV2.getSessionById);
router.post('/sessions/complete', paymentControllerV2.completeSession);
router.post('/sessions/:sessionId/cancel', paymentControllerV2.cancelSession);

// Refund Management with Approval Flow
router.post('/refunds/request', paymentControllerV2.createRefundRequest);
router.post('/refunds/approve', paymentControllerV2.approveRefund);
router.get('/admin/refunds/pending', paymentControllerV2.getPendingRefundApprovals);

// Automatic Processing
router.post('/admin/process-automatic-refunds', paymentControllerV2.processAutomaticRefunds);
router.get('/admin/expiring-authorizations', paymentControllerV2.getExpiringAuthorizations);

// Legacy Coach Rate Management Routes (for backward compatibility)
router.get('/coaches/:coachId/rates', paymentControllerV2.getCoachRates);
router.post('/coaches/:coachId/rates', paymentControllerV2.createCoachRate);
router.get('/public/coaches/:coachId/rates', paymentControllerV2.getPublicCoachRates);

// Square Webhook
router.post('/webhook', paymentControllerV2.handleSquareWebhook);

export default router;