'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  coachName: string;
  sessionTitle: string;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: string) => void;
  returnUrl?: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  coachName,
  sessionTitle,
  onSuccess,
  onError,
  returnUrl = window.location.origin + '/payment/success'
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || 'An error occurred');
        onError?.(error.message || 'Payment failed');
      } else {
        setMessage("An unexpected error occurred.");
        onError?.('An unexpected error occurred');
      }
    } else {
      // Payment succeeded
      onSuccess?.(null);
    }

    setIsLoading(false);
  };

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
        <div className="text-sm text-gray-600">
          <p><strong>Coach:</strong> {coachName}</p>
          <p><strong>Session:</strong> {sessionTitle}</p>
          <p className="text-lg font-semibold text-green-600 mt-2">
            {formatAmount(amount)}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement 
            id="payment-element"
            options={{
              layout: "tabs"
            }}
          />
          
          {message && (
            <div className="text-red-600 text-sm text-center">
              {message}
            </div>
          )}
          
          <Button 
            type="submit" 
            disabled={isLoading || !stripe || !elements}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${formatAmount(amount)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;