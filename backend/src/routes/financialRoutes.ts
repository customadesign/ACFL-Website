import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { financialController } from '../controllers/financialController';

const router = Router();

// All financial routes require authentication
router.use(authenticate);

// Admin-only financial oversight routes
router.use(authorize('admin'));

// Transaction management
router.get('/transactions', financialController.getTransactions);
router.get('/transactions/stats', financialController.getTransactionStats);
router.post('/transactions/:id/refund', financialController.processRefund);

// Reports
router.get('/reports', financialController.getFinancialReports);
router.post('/reports/generate', financialController.generateReport);

// Payouts
router.get('/payouts', financialController.getCoachPayouts);

export default router;