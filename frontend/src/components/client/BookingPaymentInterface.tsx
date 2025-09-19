'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  Clock,
  User,
  CreditCard,
  CheckCircle,
  AlertCircle,
  DollarSign,
  MessageSquare,
  Timer
} from 'lucide-react';
import SquareProvider from '@/components/payments/SquareProvider';
import SquarePaymentForm from '@/components/payments/SquarePaymentForm';
import { toast } from 'react-toastify';
import { getApiUrl } from '@/lib/api';

interface BookingRequest {
  id: string;
  coach_id: string;
  session_type: 'individual' | 'group' | 'package';
  duration_minutes: number;
  preferred_date?: string;
  preferred_time?: string;
  notes?: string;
  area_of_focus?: string;
  status: 'pending' | 'coach_accepted' | 'payment_required' | 'paid_confirmed' | 'rejected' | 'cancelled';
  coach_adjusted_price_cents?: number;
  coach_notes?: string;
  payment_deadline?: string;
  created_at: string;
  coaches?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface PaymentRequiredBooking extends BookingRequest {
  status: 'payment_required';
  coach_adjusted_price_cents: number;
  payment_deadline: string;
}

const BookingPaymentInterface: React.FC = () => {
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [paymentRequiredBookings, setPaymentRequiredBookings] = useState<PaymentRequiredBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingRequests();
  }, []);

  const fetchBookingRequests = async () => {
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/bookings/client/requests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookingRequests(data);

        // Filter out payment required bookings
        const paymentRequired = data.filter((booking: BookingRequest): booking is PaymentRequiredBooking =>
          booking.status === 'payment_required' &&
          booking.coach_adjusted_price_cents !== undefined &&
          booking.payment_deadline !== undefined
        );
        setPaymentRequiredBookings(paymentRequired);
      } else {
        throw new Error('Failed to fetch booking requests');
      }
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      toast.error('Failed to load booking requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (
    bookingId: string,
    result: {
      paymentId: string;
      token: string;
      amount: number;
    }
  ) => {
    try {
      // The payment should have been processed by the Square payment form
      // Now we just need to refresh the booking list
      await fetchBookingRequests();
      setShowPaymentForm(null);
      setProcessingPayment(null);

      toast.success('Payment successful! Your session is confirmed.');
    } catch (error) {
      console.error('Error handling payment success:', error);
      toast.error('Payment completed but there was an issue updating your booking. Please contact support.');
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
    setProcessingPayment(null);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDateTime = (date?: string, time?: string) => {
    if (!date || !time) return 'To be scheduled';

    try {
      const dateObj = new Date(`${date}T${time}:00`);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return `${date} at ${time}`;
    }
  };

  const getTimeUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return 'Expired';
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} left`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else {
      return `${minutes}m left`;
    }
  };

  const isDeadlineExpired = (deadline: string) => {
    return new Date() > new Date(deadline);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'coach_accepted': return 'bg-green-100 text-green-800';
      case 'payment_required': return 'bg-blue-100 text-blue-800';
      case 'paid_confirmed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'individual': return 'bg-blue-100 text-blue-800';
      case 'group': return 'bg-green-100 text-green-800';
      case 'package': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show payment form if selected
  if (showPaymentForm) {
    const booking = paymentRequiredBookings.find(b => b.id === showPaymentForm);
    if (!booking) {
      setShowPaymentForm(null);
      return null;
    }

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => setShowPaymentForm(null)}
            variant="outline"
            className="mb-4"
          >
            ← Back to Booking Requests
          </Button>

          {/* Session Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Complete Your Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{booking.coaches?.first_name} {booking.coaches?.last_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{booking.duration_minutes} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  <span>{formatDateTime(booking.preferred_date, booking.preferred_time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-green-600">
                    {formatPrice(booking.coach_adjusted_price_cents)}
                  </span>
                </div>
              </div>

              {booking.coach_notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-800 mb-1">Message from Coach:</p>
                  <p className="text-sm text-blue-700">{booking.coach_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <SquareProvider>
          <SquarePaymentForm
            amount={booking.coach_adjusted_price_cents}
            coachName={`${booking.coaches?.first_name} ${booking.coaches?.last_name}`}
            sessionTitle={`${booking.session_type} session`}
            bookingRequestId={booking.id}
            onSuccess={(result) => handlePaymentSuccess(booking.id, result)}
            onError={handlePaymentError}
            onCancel={() => setShowPaymentForm(null)}
            immediatePayment={true}
          />
        </SquareProvider>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Booking Requests</h1>
        <Button
          onClick={fetchBookingRequests}
          variant="outline"
        >
          Refresh
        </Button>
      </div>

      {/* Payment Required Section */}
      {paymentRequiredBookings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-orange-800">Payment Required</h2>
          </div>

          {paymentRequiredBookings.map((booking) => (
            <Card key={booking.id} className="border-orange-200 bg-orange-50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-orange-900">
                      <CreditCard className="h-5 w-5" />
                      Session with {booking.coaches?.first_name} {booking.coaches?.last_name}
                      <Badge className="bg-orange-100 text-orange-800 ml-2">
                        Payment Required
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <Badge className={getSessionTypeBadgeColor(booking.session_type)}>
                        {booking.session_type}
                      </Badge>
                      <span className="text-orange-700">
                        <Timer className="h-4 w-4 inline mr-1" />
                        {getTimeUntilDeadline(booking.payment_deadline)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(booking.coach_adjusted_price_cents)}
                    </div>
                    <div className="text-sm text-gray-600">Final Price</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{booking.duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <span>{formatDateTime(booking.preferred_date, booking.preferred_time)}</span>
                  </div>
                </div>

                {booking.coach_notes && (
                  <div className="mb-4 bg-white border border-orange-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-orange-800 mb-1">Message from Coach:</p>
                    <p className="text-sm text-orange-700">{booking.coach_notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowPaymentForm(booking.id)}
                    disabled={isDeadlineExpired(booking.payment_deadline) || processingPayment === booking.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now - {formatPrice(booking.coach_adjusted_price_cents)}
                  </Button>
                  {isDeadlineExpired(booking.payment_deadline) && (
                    <div className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Payment deadline expired
                    </div>
                  )}
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Payment deadline: {new Date(booking.payment_deadline).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* All Booking Requests Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Booking Requests</h2>

        {bookingRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Booking Requests</h3>
              <p className="text-gray-500">
                You haven't made any booking requests yet. Start by finding a coach and requesting a session.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {bookingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {request.coaches?.first_name} {request.coaches?.last_name}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <Badge className={getSessionTypeBadgeColor(request.session_type)}>
                          {request.session_type}
                        </Badge>
                        <Badge className={getStatusBadgeColor(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    {request.coach_adjusted_price_cents && (
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          {formatPrice(request.coach_adjusted_price_cents)}
                        </div>
                        <div className="text-sm text-gray-600">Coach's Price</div>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{request.duration_minutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-gray-500" />
                      <span>{formatDateTime(request.preferred_date, request.preferred_time)}</span>
                    </div>
                  </div>

                  {request.area_of_focus && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">Area of Focus:</p>
                      <p className="text-sm text-gray-600">{request.area_of_focus}</p>
                    </div>
                  )}

                  {request.notes && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">Your Notes:</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{request.notes}</p>
                    </div>
                  )}

                  {request.coach_notes && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">Coach's Notes:</p>
                      <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                        {request.coach_notes}
                      </p>
                    </div>
                  )}

                  {/* Status-specific content */}
                  {request.status === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                      <p className="text-yellow-800">
                        Waiting for coach to respond. They will review your request and set the final price.
                      </p>
                    </div>
                  )}

                  {request.status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                      <p className="text-red-800">
                        This booking request was declined by the coach.
                      </p>
                    </div>
                  )}

                  {request.status === 'paid_confirmed' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                      <p className="text-green-800 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Payment completed! Your session is confirmed.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                    <span>Requested: {new Date(request.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPaymentInterface;