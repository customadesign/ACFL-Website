import * as cron from 'node-cron';
import { invoiceService } from '../services/invoiceService';

export function initializeInvoiceJobs() {
  // Process recurring invoices daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Processing recurring invoices...');
    try {
      await invoiceService.processRecurringInvoices();
      console.log('Recurring invoices processed successfully');
    } catch (error) {
      console.error('Error processing recurring invoices:', error);
    }
  });

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