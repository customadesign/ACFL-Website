import express from 'express';
import { invoiceController } from '../controllers/invoiceController';
import { authenticate } from '../middleware/auth';
import { requireAdminRole } from '../middleware/adminAuth';

const router = express.Router();

// Invoice CRUD operations
router.post('/invoices', authenticate, invoiceController.createInvoice);
router.get('/invoices/:id', authenticate, invoiceController.getInvoice);
router.put('/invoices/:id', authenticate, invoiceController.updateInvoice);
router.delete('/invoices/:id', authenticate, invoiceController.deleteInvoice);

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

// Recurring invoices
router.post('/recurring-invoices', authenticate, invoiceController.createRecurringInvoice);

// Admin only - process recurring invoices (usually called by cron)
router.post('/invoices/process-recurring',
  authenticate,
  requireAdminRole,
  invoiceController.processRecurringInvoices
);

// Admin only - check overdue invoices (usually called by cron)
router.post('/invoices/check-overdue',
  authenticate,
  requireAdminRole,
  invoiceController.checkOverdueInvoices
);

export default router;