import * as cron from 'node-cron';
import { invoiceService } from '../services/invoiceService';

export function initializeInvoiceJobs() {
  // DISABLED: Recurring invoices not needed for session-based billing
  // Sessions automatically generate invoices when completed

  // Check for overdue invoices daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Checking for overdue invoices...');
    try {
      await invoiceService.checkOverdueInvoices();
      console.log('Overdue invoices checked successfully');
    } catch (error) {
      console.error('Error checking overdue invoices:', error);
    }
  });

  console.log('Invoice cron jobs initialized');
}