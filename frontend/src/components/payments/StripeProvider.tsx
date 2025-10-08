'use client';

import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import getStripe from '@/lib/stripe';

interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret?: string;
  options?: any;
}

const StripeProvider: React.FC<StripeProviderProps> = ({ 
  children, 
  clientSecret, 
  options = {} 
}) => {
  const stripePromise = getStripe();

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0066cc',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
    ...options,
  };

  return (
    <Elements stripe={stripePromise} options={clientSecret ? stripeOptions : {}}>
      {children}
    </Elements>
  );
};

export default StripeProvider;