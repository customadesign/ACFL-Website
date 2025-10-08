import { Request, Response } from 'express';
import { invoiceService } from '../services/invoiceService';
import {
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  SendInvoiceRequest,
  RecordInvoicePaymentRequest,
  CreateRecurringInvoiceRequest
} from '../types/invoice';

export class InvoiceController {
  // DISABLED: Manual invoice creation - invoices are auto-generated from completed sessions
  /*
  async createInvoice(req: Request, res: Response): Promise<void> {
    // Invoices are now automatically created when coaching sessions are completed
  }
  */

  // Get invoice by ID
  async getInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.getInvoice(id);

      if (!invoice) {
        res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
        return;
      }

      res.json({
        success: true,
        data: invoice
      });
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch invoice'
      });
    }
  }

  // DISABLED: Manual invoice updates - invoices are auto-generated from sessions
  /*
  async updateInvoice(req: Request, res: Response): Promise<void> {
    // Invoice updates disabled for session-based billing
  }
  */

  // DISABLED: Manual invoice deletion - invoices are auto-generated from sessions
  /*
  async deleteInvoice(req: Request, res: Response): Promise<void> {
    // Invoice deletion disabled for session-based billing
  }
  */

  // Send invoice to client
  async sendInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const sendData: SendInvoiceRequest = req.body;

      await invoiceService.sendInvoice({
        ...sendData,
        invoice_id: id
      });

      res.json({
        success: true,
        message: 'Invoice sent successfully'
      });
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send invoice'
      });
    }
  }

  // Record payment against invoice
  async recordPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const paymentData: RecordInvoicePaymentRequest = req.body;

      await invoiceService.recordPayment({
        ...paymentData,
        invoice_id: id
      });

      res.json({
        success: true,
        message: 'Payment recorded successfully'
      });
    } catch (error: any) {
      console.error('Error recording payment:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to record payment'
      });
    }
  }

  // Download invoice PDF
  async downloadInvoicePDF(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const pdfBuffer = await invoiceService.generateInvoicePDF(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate PDF'
      });
    }
  }

  // Get invoices for a coach
  async getCoachInvoices(req: Request, res: Response): Promise<void> {
    try {
      const { coachId } = req.params;
      const invoices = await invoiceService.getCoachInvoices(coachId);

      res.json({
        success: true,
        data: invoices
      });
    } catch (error: any) {
      console.error('Error fetching coach invoices:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch coach invoices'
      });
    }
  }

  // Get invoices for a client
  async getClientInvoices(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      const invoices = await invoiceService.getClientInvoices(clientId);

      res.json({
        success: true,
        data: invoices
      });
    } catch (error: any) {
      console.error('Error fetching client invoices:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch client invoices'
      });
    }
  }

  // Get invoice metrics
  async getInvoiceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { coachId, startDate, endDate } = req.query;

      const metrics = await invoiceService.getInvoiceMetrics(
        coachId as string,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      console.error('Error fetching invoice metrics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch invoice metrics'
      });
    }
  }

  // DISABLED: Recurring invoices not needed for session-based billing
  /*
  async createRecurringInvoice(req: Request, res: Response): Promise<void> {
    // Recurring invoices disabled - sessions are billed individually
  }
  */

  // DISABLED: Process recurring invoices (not needed for session-based billing)
  /*
  async processRecurringInvoices(req: Request, res: Response): Promise<void> {
    // Recurring invoice processing disabled
  }
  */

  // Check overdue invoices (useful for session-based invoices too)
  async checkOverdueInvoices(req: Request, res: Response): Promise<void> {
    try {
      const overdueInvoices = await invoiceService.checkOverdueInvoices();

      res.json({
        success: true,
        data: overdueInvoices,
        message: `Found ${overdueInvoices.length} overdue invoices`
      });
    } catch (error: any) {
      console.error('Error checking overdue invoices:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to check overdue invoices'
      });
    }
  }
}

export const invoiceController = new InvoiceController();