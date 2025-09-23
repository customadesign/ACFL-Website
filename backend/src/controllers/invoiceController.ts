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
  // Create a new invoice
  async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      const invoiceData: CreateInvoiceRequest = req.body;
      const invoice = await invoiceService.createInvoice(invoiceData);
      res.status(201).json({
        success: true,
        data: invoice
      });
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create invoice'
      });
    }
  }

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

  // Update invoice
  async updateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateInvoiceRequest = req.body;

      const invoice = await invoiceService.updateInvoice(id, updateData);

      res.json({
        success: true,
        data: invoice
      });
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update invoice'
      });
    }
  }

  // Delete invoice
  async deleteInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if invoice can be deleted (only draft or cancelled)
      const invoice = await invoiceService.getInvoice(id);

      if (!invoice) {
        res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
        return;
      }

      if (!['draft', 'cancelled'].includes(invoice.status)) {
        res.status(400).json({
          success: false,
          error: 'Only draft or cancelled invoices can be deleted'
        });
        return;
      }

      // Update status to cancelled instead of hard delete
      await invoiceService.updateInvoice(id, { status: 'cancelled' });

      res.json({
        success: true,
        message: 'Invoice cancelled successfully'
      });
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete invoice'
      });
    }
  }

  // Send invoice to client
  async sendInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const sendData: Omit<SendInvoiceRequest, 'invoice_id'> = req.body;

      await invoiceService.sendInvoice({
        invoice_id: id,
        ...sendData
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

  // Record payment for invoice
  async recordPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const paymentData: Omit<RecordInvoicePaymentRequest, 'invoice_id'> = req.body;

      const payment = await invoiceService.recordPayment({
        invoice_id: id,
        ...paymentData
      });

      res.json({
        success: true,
        data: payment
      });
    } catch (error: any) {
      console.error('Error recording payment:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to record payment'
      });
    }
  }

  // Get coach invoices
  async getCoachInvoices(req: Request, res: Response): Promise<void> {
    try {
      const { coachId } = req.params;
      const { status, clientId, dateFrom, dateTo } = req.query;

      const filters = {
        status: status as string,
        clientId: clientId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined
      };

      const invoices = await invoiceService.getCoachInvoices(coachId, filters);

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

  // Get client invoices
  async getClientInvoices(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      const { status, coachId, dateFrom, dateTo } = req.query;

      // Similar to getCoachInvoices but filtered by client
      // Implementation would be similar with client filter

      res.json({
        success: true,
        data: []
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
      const { coachId, dateFrom, dateTo } = req.query;

      const metrics = await invoiceService.getInvoiceMetrics(
        coachId as string,
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined
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

  // Create recurring invoice
  async createRecurringInvoice(req: Request, res: Response): Promise<void> {
    try {
      const recurringData: CreateRecurringInvoiceRequest = req.body;
      const recurringInvoice = await invoiceService.createRecurringInvoice(recurringData);

      res.status(201).json({
        success: true,
        data: recurringInvoice
      });
    } catch (error: any) {
      console.error('Error creating recurring invoice:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create recurring invoice'
      });
    }
  }

  // Process recurring invoices (called by cron job)
  async processRecurringInvoices(req: Request, res: Response): Promise<void> {
    try {
      await invoiceService.processRecurringInvoices();

      res.json({
        success: true,
        message: 'Recurring invoices processed successfully'
      });
    } catch (error: any) {
      console.error('Error processing recurring invoices:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process recurring invoices'
      });
    }
  }

  // Check for overdue invoices
  async checkOverdueInvoices(req: Request, res: Response): Promise<void> {
    try {
      await invoiceService.checkOverdueInvoices();

      res.json({
        success: true,
        message: 'Overdue invoices checked successfully'
      });
    } catch (error: any) {
      console.error('Error checking overdue invoices:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to check overdue invoices'
      });
    }
  }

  // Download invoice as PDF
  async downloadInvoicePDF(req: Request, res: Response): Promise<void> {
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

      // Generate PDF (implementation in pdfGenerator)
      // This would use the generateInvoicePDF utility

      res.json({
        success: true,
        message: 'PDF generation endpoint - implementation pending'
      });
    } catch (error: any) {
      console.error('Error downloading invoice PDF:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to download invoice PDF'
      });
    }
  }
}

export const invoiceController = new InvoiceController();