import { Router } from 'express';
import { billingController } from '../controllers/billingController';
import { authenticate } from '../middleware/auth';
import { requireAdminRole } from '../middleware/adminAuth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Billing history and dashboard routes
router.get('/history', billingController.getBillingHistory);
router.get('/dashboard/:userId/:userType', billingController.getBillingDashboard);
router.get('/report/:userId/:userType', billingController.getBillingReport);
router.get('/transactions/:userId/:userType', billingController.getFilteredTransactions);

// Bank account management routes (coach only)
router.get('/bank-accounts', billingController.getBankAccounts);
router.post('/bank-accounts', billingController.addBankAccount);
router.delete('/bank-accounts/:bank_account_id', billingController.deleteBankAccount);
router.post('/bank-accounts/:bank_account_id/set-default', billingController.setDefaultBankAccount);

// Refund management routes
router.post('/refunds', billingController.createRefundRequest);
router.put('/refunds/process', requireAdminRole, billingController.processRefundRequest);
router.get('/refunds', requireAdminRole, billingController.getAllRefundRequests);

// Payout management routes (admin only)
router.post('/payouts', requireAdminRole, billingController.createPayout);
router.get('/payouts', requireAdminRole, billingController.getAllPayouts);
router.put('/payouts/:payout_id/approve', requireAdminRole, billingController.approvePayout);
router.put('/payouts/:payout_id/reject', requireAdminRole, billingController.rejectPayout);

export default router;