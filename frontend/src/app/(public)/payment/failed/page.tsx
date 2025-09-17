'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, AlertTriangle, CreditCard, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';

interface PaymentError {
  code?: string;
  message?: string;
  type?: string;
}

export default function PaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorCode = searchParams.get('error_code');
  const errorType = searchParams.get('error_type');
  const paymentId = searchParams.get('payment_id');
  const coachId = searchParams.get('coach_id');

  const [paymentError, setPaymentError] = useState<PaymentError>({
    code: errorCode || undefined,
    message: error || 'Payment failed',
    type: errorType || undefined
  });

  const getErrorDetails = (error: PaymentError) => {
    if (error.type === 'card_error' || error.code?.includes('card')) {
      return {
        title: 'Card Payment Failed',
        description: 'There was an issue with your payment card.',
        suggestions: [
          'Check that your card details are correct',
          'Ensure your card has sufficient funds',
          'Contact your bank if the issue persists',
          'Try a different payment method'
        ],
        icon: CreditCard,
        color: 'red'
      };
    }

    if (error.type === 'validation_error' || error.code?.includes('validation')) {
      return {
        title: 'Payment Information Invalid',
        description: 'The payment information provided was invalid.',
        suggestions: [
          'Double-check your payment details',
          'Ensure all required fields are filled correctly',
          'Try refreshing the page and starting over'
        ],
        icon: AlertTriangle,
        color: 'orange'
      };
    }

    if (error.type === 'network_error' || error.code?.includes('network')) {
      return {
        title: 'Connection Error',
        description: 'There was a network error while processing your payment.',
        suggestions: [
          'Check your internet connection',
          'Try again in a few moments',
          'Clear your browser cache and cookies'
        ],
        icon: RefreshCw,
        color: 'blue'
      };
    }

    // Generic error
    return {
      title: 'Payment Failed',
      description: error.message || 'An unexpected error occurred while processing your payment.',
      suggestions: [
        'Try using a different payment method',
        'Refresh the page and try again',
        'Contact support if the problem continues'
      ],
      icon: XCircle,
      color: 'red'
    };
  };

  const errorDetails = getErrorDetails(paymentError);
  const ErrorIcon = errorDetails.icon;

  const handleRetryPayment = () => {
    if (coachId) {
      // Go back to coach profile or booking page
      router.push(`/coaches/${coachId}`);
    } else {
      // Go back to coaches list
      router.push('/coaches');
    }
  };

  const handleContactSupport = () => {
    router.push('/contact?subject=Payment%20Issue&payment_id=' + (paymentId || 'unknown'));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Error Header */}
        <Card className="mb-6">
          <CardContent className="text-center py-8">
            <ErrorIcon className={`w-16 h-16 text-${errorDetails.color}-600 mx-auto mb-4`} />
            <h1 className={`text-3xl font-bold text-${errorDetails.color}-600 mb-2`}>
              {errorDetails.title}
            </h1>
            <p className="text-gray-600 text-lg">
              {errorDetails.description}
            </p>
          </CardContent>
        </Card>

        {/* Error Details */}
        {(paymentError.code || paymentError.type) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Error Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {paymentError.code && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Error Code:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {paymentError.code}
                    </span>
                  </div>
                )}
                {paymentError.type && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Error Type:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {paymentError.type}
                    </span>
                  </div>
                )}
                {paymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference ID:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {paymentId.slice(-8)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Troubleshooting Suggestions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              What You Can Do
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errorDetails.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-gray-700">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Common Payment Issues */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Common Issues & Solutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Card Declined</h4>
                <p className="text-gray-600">
                  Contact your bank to ensure international transactions are enabled and your card has sufficient funds.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Incorrect Card Information</h4>
                <p className="text-gray-600">
                  Double-check your card number, expiry date, and CVV code. Ensure your billing address matches your card statement.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Browser Issues</h4>
                <p className="text-gray-600">
                  Try disabling browser extensions, clearing cache and cookies, or using a different browser.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={handleRetryPayment}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Button
            onClick={() => router.push('/coaches')}
            variant="outline"
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Browse Coaches
          </Button>
        </div>

        {/* Contact Support */}
        <Card>
          <CardContent className="text-center py-6">
            <h3 className="font-medium text-gray-900 mb-2">Still Having Issues?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Our support team is here to help you resolve any payment problems.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleContactSupport}
                variant="outline"
                size="sm"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
              <Button
                onClick={() => router.push('/help')}
                variant="outline"
                size="sm"
              >
                Visit Help Center
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}