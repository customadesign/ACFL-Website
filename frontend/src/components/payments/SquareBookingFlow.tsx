'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, User, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import SquareProvider from './SquareProvider';
import SquarePaymentForm from './SquarePaymentForm';
import { toast } from 'react-toastify';
import { getApiUrl } from '@/lib/api';

interface CoachRate {
  id: string;
  session_type: 'individual' | 'group' | 'package';
  duration_minutes: number;
  rate_cents: number;
  title: string;
  description?: string;
  is_active: boolean;
  max_sessions?: number;
  validity_days?: number;
  discount_percentage?: number;
}

interface Coach {
  id: string;
  name: string;
  email: string;
  bio?: string;
}

interface SquareBookingFlowProps {
  coachId: string;
  selectedDate?: string;
  selectedTime?: string;
  onBookingComplete?: (bookingResult: {
    paymentId: string;
    sessionId?: string;
    bookingId?: string;
  }) => void;
  onCancel?: () => void;
}

const SquareBookingFlow: React.FC<SquareBookingFlowProps> = ({
  coachId,
  selectedDate,
  selectedTime,
  onBookingComplete,
  onCancel
}) => {
  const [step, setStep] = useState<'select_rate' | 'payment' | 'success'>('select_rate');
  const [coach, setCoach] = useState<Coach | null>(null);
  const [rates, setRates] = useState<CoachRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<CoachRate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingResult, setBookingResult] = useState<{
    paymentId: string;
    sessionId?: string;
    bookingId?: string;
  } | null>(null);

  useEffect(() => {
    fetchCoachAndRates();

    // Cleanup on unmount to prevent stale booking data
    return () => {
      sessionStorage.removeItem('instantBooking');
      sessionStorage.removeItem('bookingType');
    };
  }, [coachId]);

  const fetchCoachAndRates = async () => {
    try {
      setIsLoading(true);
      const API_URL = getApiUrl();

      // Fetch coach info and rates in parallel
      const [coachResponse, ratesResponse] = await Promise.all([
        fetch(`${API_URL}/api/coaches/${coachId}`),
        fetch(`${API_URL}/api/payments/public/coaches/${coachId}/rates`)
      ]);

      if (coachResponse.ok) {
        const coachData = await coachResponse.json();
        setCoach(coachData);
      }

      if (ratesResponse.ok) {
        const ratesData = await ratesResponse.json();
        setRates(ratesData.filter((rate: CoachRate) => rate.is_active));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load booking information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateSelect = (rate: CoachRate, instant: boolean = false) => {
    setSelectedRate(rate);

    // Clear any previous booking data
    sessionStorage.removeItem('instantBooking');
    sessionStorage.removeItem('bookingType');

    if (instant) {
      // For instant booking, set current date/time automatically
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = now.toTimeString().slice(0, 5); // HH:MM

      // Store instant booking data in sessionStorage
      sessionStorage.setItem('instantBooking', JSON.stringify({
        date: dateStr,
        time: timeStr,
        isInstant: true
      }));
      sessionStorage.setItem('bookingType', 'instant');
    } else {
      // For scheduled booking, mark it as such
      sessionStorage.setItem('bookingType', 'scheduled');
    }

    setStep('payment');
  };

  const handlePaymentSuccess = async (result: {
    paymentId: string;
    token: string;
    amount: number;
  }) => {
    try {
      // Helper function to convert 12-hour time to 24-hour format
      const convertTo24Hour = (time12h: string): string => {
        // Handle both "9:20 PM" and "09:20" formats
        const time = time12h.trim();

        // If already in 24-hour format (HH:MM), return as is
        if (/^\d{1,2}:\d{2}$/.test(time) && !time.includes('AM') && !time.includes('PM')) {
          return time;
        }

        // Parse 12-hour format with AM/PM
        const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!match) {
          console.error('Invalid time format:', time);
          return time; // Return as-is if format doesn't match
        }

        const [, hoursStr, minutesStr, period] = match;
        let hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);

        // Convert to 24-hour format
        if (period.toUpperCase() === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period.toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      };

      // Calculate scheduled time
      let scheduledAt: Date;
      let endsAt: Date;
      let isInstantBooking = false;

      // Check for instant booking data in sessionStorage
      const instantBookingData = sessionStorage.getItem('instantBooking');
      if (instantBookingData) {
        const { date, time, isInstant } = JSON.parse(instantBookingData);
        if (isInstant) {
          scheduledAt = new Date();
          isInstantBooking = true;
          // Clear the instant booking data
          sessionStorage.removeItem('instantBooking');
        } else if (date && time) {
          const time24 = convertTo24Hour(time);
          scheduledAt = new Date(`${date}T${time24}:00`);
        } else {
          scheduledAt = new Date();
        }
      } else if (selectedDate && selectedTime) {
        // Convert time to 24-hour format if needed
        const time24 = convertTo24Hour(selectedTime);
        scheduledAt = new Date(`${selectedDate}T${time24}:00`);

        // Check if the date is valid
        if (isNaN(scheduledAt.getTime())) {
          console.error('Invalid date/time:', selectedDate, selectedTime, 'converted to:', time24);
          // For scheduled bookings, don't default to now - show an error
          throw new Error('Invalid date/time selected. Please go back and select a valid date and time.');
        }
      } else {
        // Only use "now" for explicit instant bookings
        if (sessionStorage.getItem('bookingType') === 'instant') {
          scheduledAt = new Date();
          isInstantBooking = true;
        } else {
          throw new Error('Please select a date and time for your scheduled session.');
        }
      }

      // Calculate end time based on duration
      const durationMs = (selectedRate?.duration_minutes || 60) * 60 * 1000;
      endsAt = new Date(scheduledAt.getTime() + durationMs);

      // Create the actual booking/session with the authorized payment
      const API_URL = getApiUrl();
      const bookingResponse = await fetch(`${API_URL}/api/client/book-appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          coachId: coachId,
          scheduledAt: scheduledAt.toISOString(),
          sessionType: 'session',
          notes: `Paid session: ${selectedRate?.title}`,
          areaOfFocus: selectedRate?.title,
          paymentId: result.paymentId,
          isInstantBooking: isInstantBooking
        })
      });

      if (bookingResponse.ok) {
        const bookingData = await bookingResponse.json();
        const bookingResult = {
          paymentId: result.paymentId,
          sessionId: bookingData.data?.sessionId || bookingData.sessionId,
          bookingId: bookingData.data?.sessionId || bookingData.sessionId
        };

        setBookingResult(bookingResult);
        setStep('success');
        onBookingComplete?.(bookingResult);
      } else {
        let errorData;
        try {
          errorData = await bookingResponse.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { message: `HTTP ${bookingResponse.status}: ${bookingResponse.statusText}` };
        }

        console.error('Booking API error:', {
          status: bookingResponse.status,
          statusText: bookingResponse.statusText,
          url: `${API_URL}/api/client/book-appointment`,
          data: errorData,
          requestBody: {
            coachId: coachId,
            scheduledAt: scheduledAt.toISOString(),
            sessionType: selectedRate?.session_type || 'session',
            notes: `Paid session: ${selectedRate?.title}`,
            areaOfFocus: selectedRate?.title,
            paymentId: result.paymentId,
            isInstantBooking: isInstantBooking
          }
        });
        throw new Error(errorData.message || errorData.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Payment authorized but booking failed. Please contact support.');
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
    // Stay on payment step to allow retry
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
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

  if (step === 'success') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <div className="text-6xl mb-4">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Session Booked!</h2>
          <p className="text-gray-600 mb-4">
            Your session with {coach?.name || 'Loading...'} has been reserved.
            Payment is authorized and will be processed after your session is completed.
          </p>

          {/* Booking Details */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-left">
            <h3 className="font-semibold text-green-800 mb-2">Booking Details</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Session:</strong> {selectedRate?.title}</p>
              <p><strong>Duration:</strong> {selectedRate?.duration_minutes} minutes</p>
              {selectedDate && selectedTime ? (
                <p><strong>Scheduled:</strong> {selectedDate} at {selectedTime}</p>
              ) : (
                <p><strong>Type:</strong> <span className="text-green-600 font-semibold">Instant Session - Starting Now!</span></p>
              )}
              <p><strong>Amount Authorized:</strong> {formatPrice(selectedRate?.rate_cents || 0)}</p>
              {bookingResult?.paymentId && (
                <p><strong>Payment ID:</strong> {bookingResult.paymentId.slice(-8)}</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-700 text-left space-y-1">
              <li>• Your payment method is authorized but not charged yet</li>
              <li>• You will be charged automatically after session completion</li>
              <li>• You'll receive email confirmations with meeting details</li>
              <li>• If you need to cancel, contact your coach or support</li>
            </ul>
          </div>

          <Button
            onClick={() => window.location.href = '/clients/appointments'}
            className="w-full"
          >
            View My Appointments
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'payment' && selectedRate) {
    return (
      <SquareProvider>
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setStep('select_rate')}
              className="mb-4"
            >
              ← Back to Rate Selection
            </Button>

            {/* Session Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Session Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{coach?.name || 'Loading...'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{selectedRate.duration_minutes} minutes</span>
                  </div>
                  {selectedDate && selectedTime ? (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-gray-500" />
                      <span>{selectedDate} at {selectedTime}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <AlertCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-semibold">Instant Session - Starting Now!</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold text-green-600">
                      {formatPrice(selectedRate.rate_cents)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <SquarePaymentForm
            amount={selectedRate.rate_cents}
            coachName={coach?.name || 'Loading...'}
            sessionTitle={selectedRate.title}
            coachId={coachId}
            coachRateId={selectedRate.id}
            sessionDate={selectedDate}
            sessionTime={selectedTime}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={() => setStep('select_rate')}
          />
        </div>
      </SquareProvider>
    );
  }

  // Rate Selection Step
  return (
    <div className="max-w-4xl mx-auto">
      {coach && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Book a Session with Square Payments</CardTitle>
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {coach.name || 'Loading...'}
                </h3>
                {selectedDate && selectedTime && (
                  <p className="text-gray-600">
                    {selectedDate} at {selectedTime}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          {coach.bio && (
            <CardContent>
              <p className="text-gray-600">{coach.bio}</p>
            </CardContent>
          )}
        </Card>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Select Session Type</h2>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      {rates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No session rates available for this coach</p>
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="mt-4">
                Go Back
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rates.map((rate) => (
            <Card
              key={rate.id}
              className="hover:shadow-md transition-shadow border-2 hover:border-blue-300"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold">{rate.title}</h3>
                  <Badge className={getSessionTypeBadgeColor(rate.session_type)}>
                    {rate.session_type}
                  </Badge>
                </div>

                <div className="text-2xl font-bold text-green-600 mb-2">
                  {formatPrice(rate.rate_cents)}
                </div>

                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <p><strong>Duration:</strong> {rate.duration_minutes} minutes</p>
                  {rate.session_type === 'package' && rate.max_sessions && (
                    <p><strong>Sessions:</strong> {rate.max_sessions}</p>
                  )}
                  {rate.validity_days && (
                    <p><strong>Valid for:</strong> {rate.validity_days} days</p>
                  )}
                  {rate.discount_percentage && (
                    <p className="text-green-600">
                      <strong>Save {rate.discount_percentage}%</strong>
                    </p>
                  )}
                </div>

                {rate.description && (
                  <p className="text-gray-600 text-sm mb-4">{rate.description}</p>
                )}

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRateSelect(rate, false);
                    }}
                  >
                    Schedule for Later
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRateSelect(rate, true);
                    }}
                  >
                    Book Instant Session (Now)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SquareBookingFlow;