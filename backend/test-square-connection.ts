import * as dotenv from 'dotenv';
dotenv.config();

import { paymentsApi, getLocationId } from './src/lib/square';

async function testSquareConnection() {
  console.log('Environment check:');
  console.log('SQUARE_ENVIRONMENT:', process.env.SQUARE_ENVIRONMENT);
  console.log('SQUARE_ACCESS_TOKEN exists:', !!process.env.SQUARE_ACCESS_TOKEN);
  console.log('Token length:', process.env.SQUARE_ACCESS_TOKEN?.length || 0);
  console.log('');
  try {
    console.log('Testing Square API connection...\n');

    // Get location ID
    const locationId = await getLocationId();
    console.log('✅ Location ID retrieved:', locationId);

    // Try to list recent payments
    console.log('\nFetching recent payments...');
    console.log('This will show if the Square API connection is working.\n');

    const { result } = await paymentsApi.listPayments();

    if (result.payments && result.payments.length > 0) {
      console.log(`\n✅ Found ${result.payments.length} recent payment(s):\n`);

      result.payments.forEach((payment, index) => {
        console.log(`Payment ${index + 1}:`);
        console.log('  ID:', payment.id);
        console.log('  Status:', payment.status);
        console.log('  Amount:', `$${(Number(payment.amountMoney?.amount) / 100).toFixed(2)}`);
        console.log('  Created:', payment.createdAt);
        console.log('---');
      });
    } else {
      console.log('\n⚠️  No payments found');
    }

  } catch (error: any) {
    console.error('\n❌ Error testing Square connection:');
    console.error('Error:', error.message);

    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
  }

  process.exit(0);
}

testSquareConnection();
