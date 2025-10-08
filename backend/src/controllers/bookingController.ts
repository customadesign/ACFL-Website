import { Request, Response } from 'express';
import { BookingService } from '../services/bookingService';
import { SquarePaymentService } from '../services/squarePaymentService';
import {
  CreateBookingRequestRequest,
  AcceptBookingRequest,
  ProcessBookingPaymentRequest
} from '../types/booking';

export class BookingController {
  private bookingService: BookingService;
  private paymentService: SquarePaymentService;

  constructor() {
    this.bookingService = new BookingService();
    this.paymentService = new SquarePaymentService();
  }

  // Client endpoints
  createBookingRequest = async (req: Request & { user?: any }, res: Response) => {
    try {
      const clientId = req.user?.id;
      if (!clientId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const request: CreateBookingRequestRequest = req.body;
      const response = await this.bookingService.createBookingRequest(clientId, request);

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating booking request:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getClientBookingRequests = async (req: Request & { user?: any }, res: Response) => {
    try {
      const clientId = req.user?.id;
      if (!clientId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const bookingRequests = await this.bookingService.getClientBookingRequests(clientId);
      res.json(bookingRequests);
    } catch (error) {
      console.error('Error fetching client booking requests:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getBookingRequestById = async (req: Request & { user?: any }, res: Response) => {
    try {
      const clientId = req.user?.id;
      if (!clientId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { bookingRequestId } = req.params;
      const bookingRequest = await this.bookingService.getBookingRequestById(
        bookingRequestId,
        clientId,
        'client'
      );

      if (!bookingRequest) {
        return res.status(404).json({ error: 'Booking request not found' });
      }

      res.json(bookingRequest);
    } catch (error) {
      console.error('Error fetching booking request:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  processBookingPayment = async (req: Request & { user?: any }, res: Response) => {
    try {
      const clientId = req.user?.id;
      if (!clientId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { bookingRequestId } = req.params;
      const paymentRequest: ProcessBookingPaymentRequest = req.body;

      const response = await this.bookingService.processBookingPayment(
        clientId,
        bookingRequestId,
        paymentRequest
      );

      res.json(response);
    } catch (error) {
      console.error('Error processing booking payment:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Coach endpoints
  getCoachPendingBookings = async (req: Request & { user?: any }, res: Response) => {
    try {
      const coachId = req.user?.id;
      if (!coachId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const pendingBookings = await this.bookingService.getCoachPendingBookings(coachId);
      res.json(pendingBookings);
    } catch (error) {
      console.error('Error fetching coach pending bookings:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getCoachBookingRequest = async (req: Request & { user?: any }, res: Response) => {
    try {
      const coachId = req.user?.id;
      if (!coachId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { bookingRequestId } = req.params;
      const bookingRequest = await this.bookingService.getBookingRequestById(
        bookingRequestId,
        coachId,
        'coach'
      );

      if (!bookingRequest) {
        return res.status(404).json({ error: 'Booking request not found' });
      }

      res.json(bookingRequest);
    } catch (error) {
      console.error('Error fetching coach booking request:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  acceptBookingRequest = async (req: Request & { user?: any }, res: Response) => {
    try {
      const coachId = req.user?.id;
      if (!coachId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { bookingRequestId } = req.params;
      const acceptance: AcceptBookingRequest = req.body;

      // Validate required fields
      if (!acceptance.final_price_cents || acceptance.final_price_cents <= 0) {
        return res.status(400).json({ error: 'Valid final price is required' });
      }

      const response = await this.bookingService.acceptBookingRequest(
        coachId,
        bookingRequestId,
        acceptance
      );

      res.json(response);
    } catch (error) {
      console.error('Error accepting booking request:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  rejectBookingRequest = async (req: Request & { user?: any }, res: Response) => {
    try {
      const coachId = req.user?.id;
      if (!coachId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { bookingRequestId } = req.params;
      const { reason } = req.body;

      await this.bookingService.rejectBookingRequest(coachId, bookingRequestId, reason);

      res.json({
        message: 'Booking request rejected successfully',
        booking_request_id: bookingRequestId
      });
    } catch (error) {
      console.error('Error rejecting booking request:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Payment status endpoints
  getPaymentStatus = async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { paymentId } = req.params;
      const payment = await this.paymentService.getPaymentStatus(paymentId);

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Verify user has access to this payment
      const userType = req.user?.role; // Assuming role is available
      if (userType === 'client' && payment.client_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (userType === 'coach' && payment.coach_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(payment);
    } catch (error) {
      console.error('Error fetching payment status:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Admin endpoints
  createRefund = async (req: Request & { user?: any }, res: Response) => {
    try {
      const adminId = req.user?.role === 'admin' ? req.user.id : null;
      if (!adminId) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const refundRequest = req.body;
      const response = await this.paymentService.createRefund(adminId, refundRequest);

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating refund:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Webhook endpoints
  handleSquareWebhook = async (req: Request, res: Response) => {
    try {
      // TODO: Add webhook signature verification for Square
      const event = req.body;
      await this.paymentService.handleWebhook(event);
      res.json({ received: true });
    } catch (error) {
      console.error('Square webhook error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  // Utility endpoints for development/testing
  getBookingRequestsOverview = async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      let bookingRequests;
      if (userRole === 'client') {
        bookingRequests = await this.bookingService.getClientBookingRequests(userId);
      } else if (userRole === 'coach') {
        bookingRequests = await this.bookingService.getCoachPendingBookings(userId);
      } else {
        return res.status(403).json({ error: 'Invalid user role' });
      }

      // Group by status for overview
      const overview = bookingRequests.reduce((acc, request) => {
        const status = request.status;
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(request);
        return acc;
      }, {} as Record<string, any[]>);

      res.json({
        overview,
        total: bookingRequests.length,
        by_status: Object.keys(overview).reduce((acc, status) => {
          acc[status] = overview[status].length;
          return acc;
        }, {} as Record<string, number>)
      });
    } catch (error) {
      console.error('Error fetching booking requests overview:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };
}

export const bookingController = new BookingController();