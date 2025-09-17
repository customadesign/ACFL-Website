import { Router } from 'express';
import { bookingController } from '../controllers/bookingController';

const router = Router();

// Client routes
/**
 * @route POST /api/bookings/request
 * @desc Create a new booking request
 * @access Client
 */
router.post('/request', bookingController.createBookingRequest);

/**
 * @route GET /api/bookings/client/requests
 * @desc Get all booking requests for the authenticated client
 * @access Client
 */
router.get('/client/requests', bookingController.getClientBookingRequests);

/**
 * @route GET /api/bookings/client/requests/:bookingRequestId
 * @desc Get a specific booking request by ID
 * @access Client
 */
router.get('/client/requests/:bookingRequestId', bookingController.getBookingRequestById);

/**
 * @route POST /api/bookings/client/requests/:bookingRequestId/pay
 * @desc Process payment for an accepted booking request
 * @access Client
 */
router.post('/client/requests/:bookingRequestId/pay', bookingController.processBookingPayment);

// Coach routes
/**
 * @route GET /api/bookings/coach/pending
 * @desc Get all pending booking requests for the authenticated coach
 * @access Coach
 */
router.get('/coach/pending', bookingController.getCoachPendingBookings);

/**
 * @route GET /api/bookings/coach/requests/:bookingRequestId
 * @desc Get a specific booking request by ID (coach view)
 * @access Coach
 */
router.get('/coach/requests/:bookingRequestId', bookingController.getCoachBookingRequest);

/**
 * @route POST /api/bookings/coach/requests/:bookingRequestId/accept
 * @desc Accept a booking request with final pricing
 * @access Coach
 */
router.post('/coach/requests/:bookingRequestId/accept', bookingController.acceptBookingRequest);

/**
 * @route POST /api/bookings/coach/requests/:bookingRequestId/reject
 * @desc Reject a booking request
 * @access Coach
 */
router.post('/coach/requests/:bookingRequestId/reject', bookingController.rejectBookingRequest);

// Payment routes
/**
 * @route GET /api/bookings/payments/:paymentId/status
 * @desc Get payment status
 * @access Client/Coach (owner only)
 */
router.get('/payments/:paymentId/status', bookingController.getPaymentStatus);

// Admin routes
/**
 * @route POST /api/bookings/admin/refunds
 * @desc Create a refund for a payment
 * @access Admin
 */
router.post('/admin/refunds', bookingController.createRefund);

// Webhook routes
/**
 * @route POST /api/bookings/webhooks/square
 * @desc Handle Square webhook events
 * @access Public (with signature verification)
 */
router.post('/webhooks/square', bookingController.handleSquareWebhook);

// Utility routes
/**
 * @route GET /api/bookings/overview
 * @desc Get booking requests overview for the authenticated user
 * @access Client/Coach
 */
router.get('/overview', bookingController.getBookingRequestsOverview);

export default router;