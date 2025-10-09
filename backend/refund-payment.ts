import * as dotenv from 'dotenv';
dotenv.config();

import { SquarePaymentService } from './src/services/squarePaymentService';

async function refundPayment() {
  const paymentId = process.argv[2]; // Get payment ID from command line argument

  if (!paymentId) {
    console.error('❌ Error: Please provide a payment ID');
    console.log('\nUsage: npx ts-node refund-payment.ts <payment-id>');
    console.log('Example: npx ts-node refund-payment.ts 5b000fad-0bf3-457a-8f5a-d777b071db21');
    process.exit(1);
  }

  try {
    const paymentService = new SquarePaymentService();

    console.log(`\nAttempting to refund payment: ${paymentId}...\n`);

    const result = await paymentService.createRefund(null, {
      payment_id: paymentId,
      reason: 'requested_by_customer',
      amount_cents: undefined // undefined = full refund, or specify amount in cents for partial refund
    });

    console.log('✅ Refund successful!\n');
    console.log('Refund Details:');
    console.log('  Refund ID:', result.refund_id);
    console.log('  Square Refund ID:', result.square_refund_id);
    console.log('  Amount Refunded:', `$${(result.amount_cents / 100).toFixed(2)}`);
    console.log('  Status:', result.status);
    console.log('\nThe refund should appear in your Square Dashboard within seconds.');
    console.log('It typically takes 2-7 business days for the money to return to the customer\'s card.');

  } catch (error: any) {
    console.error('\n❌ Refund failed:', error.message);
    console.error('Details:', error);
  }

  process.exit(0);
}

refundPayment();
