import { payments } from '@square/web-sdk';

// Initialize Square Web Payments SDK with retry logic
export async function initializeSquare(retries = 3) {
  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
  const environment = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox';

  console.log('Square initialization config:', {
    appId: appId ? `${appId.substring(0, 10)}...` : 'undefined',
    locationId,
    environment
  });

  if (!appId || !locationId) {
    throw new Error(`Square credentials not properly configured. AppId: ${!!appId}, LocationId: ${!!locationId}`);
  }

  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Initializing Square Web SDK (attempt ${attempt}/${retries})...`);

      // Add timeout wrapper for initialization
      const initPromise = new Promise(async (resolve, reject) => {
        try {
          // The payments() function is async and needs to be awaited
          // It returns a Promise that resolves when the SDK is fully loaded
          const paymentsInstance = await payments(appId, locationId);

          // Verify the payments instance is properly initialized
          if (!paymentsInstance) {
            throw new Error('Payments instance is null or undefined');
          }

          resolve(paymentsInstance);
        } catch (error) {
          reject(error);
        }
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Square Web SDK initialization timeout')), 20000)
      );

      const paymentsInstance = await Promise.race([initPromise, timeoutPromise]);
      console.log('Square Web SDK initialized successfully');
      return paymentsInstance;
    } catch (error) {
      lastError = error;
      console.error(`Failed to initialize Square Web Payments SDK (attempt ${attempt}/${retries}):`, error);

      if (attempt < retries) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Failed to initialize Square Web Payments SDK after multiple attempts');
}

// Helper function to format amount for Square (in cents)
export function formatSquareAmount(amountInCents: number): number {
  return amountInCents;
}

// Helper function to create payment request
export interface SquarePaymentRequest {
  amount: number;
  currency: string;
  sourceId: string;
  locationId?: string;
  note?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface SquareAuthorizationRequest extends SquarePaymentRequest {
  autocomplete: false; // For authorization-only payments
}

// Payment methods supported by Square
export type SquarePaymentMethod = 'card' | 'ach' | 'giftcard' | 'applePay' | 'googlePay';

// Square payment form configuration
export interface SquareFormConfig {
  applicationId: string;
  locationId: string;
  environment: 'sandbox' | 'production';
  inputClass?: string;
  inputStyles?: {
    fontSize?: string;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    placeholderColor?: string;
  };
}

export function getSquareConfig(): SquareFormConfig {
  return {
    applicationId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!,
    locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
    environment: (process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    inputClass: 'square-input',
    inputStyles: {
      fontSize: '16px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      color: '#1f2937',
      backgroundColor: '#ffffff',
      placeholderColor: '#9ca3af',
    },
  };
}

// Error handling for Square payments
export function handleSquareError(error: any): string {
  if (error.type === 'VALIDATION_ERROR') {
    return error.message || 'Please check your payment information and try again.';
  }

  if (error.type === 'CARD_DECLINED') {
    return 'Your card was declined. Please try a different payment method.';
  }

  if (error.type === 'NETWORK_ERROR') {
    return 'Network error. Please check your connection and try again.';
  }

  if (error.type === 'GENERIC_DECLINE') {
    return 'Payment was declined. Please try a different payment method.';
  }

  return error.message || 'An unexpected error occurred. Please try again.';
}

// Payment status mapping
export function mapSquareStatusToInternal(squareStatus: string): string {
  switch (squareStatus) {
    case 'APPROVED':
      return 'authorized';
    case 'COMPLETED':
      return 'succeeded';
    case 'CANCELED':
      return 'cancelled';
    case 'FAILED':
      return 'failed';
    default:
      return 'pending';
  }
}