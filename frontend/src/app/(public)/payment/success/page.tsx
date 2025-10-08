'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Clock, User, CreditCard, AlertTriangle } from 'lucide-react';
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge';

interface PaymentDetails {
  id: string;
  amount_cents: number;
  status: string;
  description: string;
  client_name: string;
  coach_name: string;
  session_date?: string;
  session_time?: string;
  created_at: string;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const sessionId = searchParams.get('session_id');

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails();
    } else {
      setError('No payment ID provided');
      setIsLoading(false);
    }
  }, [paymentId]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentDetails(data);
      } else {
        throw new Error('Failed to fetch payment details');
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      setError('Failed to load payment details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/clients/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <Card className="mb-6">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Authorized!</h1>
            <p className="text-gray-600 text-lg">
              Your session has been successfully booked and payment authorized.
            </p>
          </CardContent>
        </Card>

        {/* Payment Details */}
        {paymentDetails && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Payment Details</span>
                <PaymentStatusBadge status={paymentDetails.status as any} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Amount Authorized</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatPrice(paymentDetails.amount_cents)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Coach</p>
                      <p className="font-medium">{paymentDetails.coach_name}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Session Date</p>
                      <p className="font-medium">
                        {paymentDetails.session_date
                          ? formatDate(paymentDetails.session_date)
                          : 'To be scheduled'
                        }
                      </p>
                    </div>
                  </div>

                  {paymentDetails.session_time && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Time</p>
                        <p className="font-medium">{paymentDetails.session_time}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {paymentDetails.description && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600">Session Details</p>
                  <p className="font-medium">{paymentDetails.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Important Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-blue-600">Important Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <p>
                  <strong>Payment Authorization:</strong> Your payment method has been authorized for the session amount but not charged yet.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <p>
                  <strong>When You'll Be Charged:</strong> Payment will be automatically processed after your session is completed.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <p>
                  <strong>Email Confirmations:</strong> You'll receive email confirmations with session details and meeting links.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <p>
                  <strong>Cancellation:</strong> If you need to cancel, contact your coach or support at least 24 hours before your session.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => router.push('/clients/appointments')}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Calendar className="w-4 h-4 mr-2" />
            View My Appointments
          </Button>

          <Button
            onClick={() => router.push('/clients/dashboard')}
            variant="outline"
            className="flex-1"
          >
            Go to Dashboard
          </Button>
        </div>

        {/* Support Contact */}
        <Card className="mt-6">
          <CardContent className="text-center py-6">
            <p className="text-sm text-gray-600">
              Questions about your booking or payment?{' '}
              <a href="/contact" className="text-blue-600 hover:underline">
                Contact Support
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}