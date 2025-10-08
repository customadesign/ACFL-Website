import express from 'express';
import { invoiceController } from '../controllers/invoiceController';
import { authenticate } from '../middleware/auth';
import { requireAdminRole } from '../middleware/adminAuth';

const router = express.Router();

// Invoice operations (read-only - invoices are auto-generated from sessions)
router.get('/invoices/:id', authenticate, invoiceController.getInvoice);
// Note: Invoice creation happens automatically when sessions are completed
// Manual creation/update/delete is disabled to maintain data integrity

// Invoice actions
router.post('/invoices/:id/send', authenticate, invoiceController.sendInvoice);
router.post('/invoices/:id/payment', authenticate, invoiceController.recordPayment);
router.get('/invoices/:id/download', authenticate, invoiceController.downloadInvoicePDF);

// Coach invoices
router.get('/coaches/:coachId/invoices', authenticate, invoiceController.getCoachInvoices);

// Client invoices
router.get('/clients/:clientId/invoices', authenticate, invoiceController.getClientInvoices);

// Invoice metrics
router.get('/invoice-metrics', authenticate, invoiceController.getInvoiceMetrics);

// Admin only - check overdue invoices (usually called by cron)
router.post('/invoices/check-overdue',
  authenticate,
  requireAdminRole,
  invoiceController.checkOverdueInvoices
);

export default router;