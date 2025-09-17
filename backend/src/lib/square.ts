import { Client, Environment } from 'square';

// Initialize Square client
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox,
});

// Export Square API clients
export const {
  paymentsApi,
  customersApi,
  catalogApi,
  refundsApi,
  merchantsApi,
  locationsApi,
} = squareClient;

// Helper function to get location ID
export async function getLocationId(): Promise<string> {
  try {
    const response = await locationsApi.listLocations();

    if (response.result.locations && response.result.locations.length > 0) {
      return response.result.locations[0].id!;
    }

    throw new Error('No Square location found');
  } catch (error) {
    console.error('Error fetching Square location:', error);
    // Return default sandbox location ID as fallback
    return process.env.SQUARE_LOCATION_ID || 'LH2N1E5NBGA79';
  }
}

// Helper function to format amount for Square (converts cents to their format)
export function formatSquareAmount(cents: number): bigint {
  return BigInt(cents);
}

// Helper function to generate idempotency key
export function generateIdempotencyKey(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default squareClient;