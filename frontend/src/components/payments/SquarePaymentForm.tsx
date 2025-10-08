'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { useSquare } from './SquareProvider';
import { handleSquareError } from '@/lib/square';
import { toast } from 'react-toastify';
import { getApiUrl } from '@/lib/api';

interface SquarePaymentFormProps {
  amount: number;
  coachName: string;
  sessionTitle: string;
  coachId?: string;
  coachRateId?: string;
  bookingRequestId?: string; // For booking flow
  sessionDate?: string;
  sessionTime?: string;
  description?: string;
  metadata?: Record<string, string>;
  immediatePayment?: boolean; // If true, processes immediate payment instead of authorization
  onSuccess?: (result: {
    paymentId: string;
    token: string;
    amount: number;
  }) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

const SquarePaymentForm: React.FC<SquarePaymentFormProps> = ({
  amount,
  coachName,
  sessionTitle,
  coachId,
  coachRateId,
  bookingRequestId,
  sessionDate,
  sessionTime,
  description,
  metadata,
  immediatePayment = false,
  onSuccess,
  onError,
  onCancel,
  className
}) => {
  const { payments, isLoaded, error: squareError, initializeCard, tokenize } = useSquare();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [cardAttached, setCardAttached] = useState(false);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && payments && !isInitialized) {
      initializeCardForm();
    }
  }, [isLoaded, payments, isInitialized]);

  const initializeCardForm = async () => {
    try {
      const cardInstance = await initializeCard();

      if (cardContainerRef.current) {
        await cardInstance.attach(cardContainerRef.current);
        setCardAttached(true);
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Failed to initialize card form:', error);
      setFormError(handleSquareError(error));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardAttached) {
      setFormError('Payment form not ready. Please try again.');
      return;
    }

    setIsProcessing(true);
    setFormError(null);

    try {
      // Tokenize the card
      const { token } = await tokenize();

      const API_URL = getApiUrl();
      let endpoint, requestBody;

      if (immediatePayment && bookingRequestId) {
        // Process immediate payment for booking request
        endpoint = `${API_URL}/api/bookings/client/requests/${bookingRequestId}/pay`;
        requestBody = {
          source_id: token,
          billing_details: {
            name: coachName, // This should come from form input in real implementation
            email: 'client@example.com' // This should come from current user
          }
        };
      } else {
        // Process authorization (existing flow)
        endpoint = `${API_URL}/api/payments/create-payment-authorization`;
        requestBody = {
          sourceId: token,
          coach_id: coachId,
          coach_rate_id: coachRateId,
          session_date: sessionDate,
          session_time: sessionTime,
          description: description || `${sessionTitle} with ${coachName}`,
          metadata: {
            ...metadata,
            session_date: sessionDate,
            session_time: sessionTime,
          }
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Payment API error:', {
          status: response.status,
          statusText: response.statusText,
          url: endpoint,
          data: data
        });
        throw new Error(data.error || data.message || 'Payment processing failed');
      }

      // Payment successful
      const result = {
        paymentId: data.payment_id || data.booking_id,
        token: token,
        amount: amount
      };

      onSuccess?.(result);

      if (immediatePayment) {
        toast.success('Payment successful! Your session is confirmed.');
      } else {
        toast.success('Payment authorized successfully! Your session is booked.');
      }

    } catch (error) {
      const errorMessage = handleSquareError(error);
      setFormError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  if (squareError) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <div className="text-red-600 mb-4">
            <CreditCard className="w-12 h-12 mx-auto mb-2" />
            <p className="font-medium">Payment System Error</p>
            <p className="text-sm">{squareError}</p>
          </div>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment form...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          {immediatePayment ? 'Complete Payment' : 'Complete Payment Authorization'}
        </CardTitle>
        <div className={`border rounded-lg p-4 ${
          immediatePayment ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start gap-2">
            <Shield className={`w-5 h-5 mt-0.5 ${
              immediatePayment ? 'text-green-600' : 'text-blue-600'
            }`} />
            <div>
              {immediatePayment ? (
                <>
                  <p className="text-sm text-green-800 font-medium">Immediate Payment</p>
                  <p className="text-sm text-green-700">
                    Your payment will be processed immediately and your session will be confirmed.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-blue-800 font-medium">Authorization Only</p>
                  <p className="text-sm text-blue-700">
                    Your payment method will be authorized but not charged.
                    Payment will be processed after your session is completed.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Session Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Session Details</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Coach:</strong> {coachName}</p>
            <p><strong>Session:</strong> {sessionTitle}</p>
            {sessionDate && sessionTime && (
              <p><strong>Date:</strong> {sessionDate} at {sessionTime}</p>
            )}
            <p className="text-lg font-semibold text-green-600 mt-2">
              {formatPrice(amount)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Square Card Element */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div
              ref={cardContainerRef}
              className="border border-gray-300 rounded-lg p-4 bg-white"
              style={{ minHeight: '100px' }}
            />
            {!cardAttached && isLoaded && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading payment form...</span>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4 text-green-600" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Error Message */}
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {formError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className={`flex-1 ${
                immediatePayment
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={isProcessing || !cardAttached}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {immediatePayment ? 'Processing...' : 'Authorizing...'}
                </>
              ) : (
                <>
                  {immediatePayment ? (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  {immediatePayment ? 'Pay' : 'Authorize'} {formatPrice(amount)}
                </>
              )}
            </Button>
          </div>

          {/* Terms */}
          <div className="text-xs text-gray-500 text-center">
            {immediatePayment ? (
              <>
                By clicking "Pay", you agree to be charged {formatPrice(amount)} immediately.
                Your session will be confirmed upon successful payment.
              </>
            ) : (
              <>
                By clicking "Authorize", you agree that your payment method will be
                authorized for {formatPrice(amount)}. You will only be charged after
                your session is completed.
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SquarePaymentForm;