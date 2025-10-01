import { paymentsApi } from '../src/lib/square';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkSquarePaymentStatus() {
  const squarePaymentId = 'dIrVTM7ndFfs9rDQEsc6NJTEzK8YY';

  console.log('🔍 Checking Square Payment Status\n');
  console.log(`Square Payment ID: ${squarePaymentId}\n`);

  try {
    // Get payment from Square
    console.log('📡 Fetching payment from Square API...\n');

    const { result } = await paymentsApi.getPayment(squarePaymentId);

    if (result.payment) {
      const payment = result.payment;

      console.log('✅ Payment found in Square:\n');
      console.log(`  Payment ID: ${payment.id}`);
      console.log(`  Status: ${payment.status}`);
      console.log(`  Amount: $${payment.amountMoney?.amount ? Number(payment.amountMoney.amount) / 100 : 0}`);
      console.log(`  Currency: ${payment.amountMoney?.currency}`);
      console.log(`  Source Type: ${payment.sourceType}`);
      console.log(`  Created: ${payment.createdAt}`);
      console.log(`  Updated: ${payment.updatedAt}`);

      if (payment.refundIds && payment.refundIds.length > 0) {
        console.log(`\n  ⚠️  Refund IDs found: ${payment.refundIds.length}`);
        payment.refundIds.forEach((refundId: string, index: number) => {
          console.log(`    ${index + 1}. ${refundId}`);
        });
      } else {
        console.log(`\n  ✅ No refunds found for this payment`);
      }

      if (payment.refundedMoney) {
        console.log(`\n  💰 Refunded Amount: $${Number(payment.refundedMoney.amount) / 100}`);
      }

      if (payment.totalMoney) {
        console.log(`  💰 Total Amount: $${Number(payment.totalMoney.amount) / 100}`);
      }

      if (payment.approvedMoney) {
        console.log(`  💰 Approved Amount: $${Number(payment.approvedMoney.amount) / 100}`);
      }

      console.log('\n📊 Analysis:');
      console.log('================================================================================');

      if (payment.status === 'COMPLETED') {
        if (payment.refundIds && payment.refundIds.length > 0) {
          console.log('⚠️  This payment has been refunded');
          console.log('   You cannot issue another refund for the same amount');
        } else {
          const totalAmount = payment.totalMoney?.amount ? Number(payment.totalMoney.amount) : 0;
          const refundedAmount = payment.refundedMoney?.amount ? Number(payment.refundedMoney.amount) : 0;
          const availableToRefund = totalAmount - refundedAmount;

          console.log('✅ This payment can be refunded');
          console.log(`   Available to refund: $${availableToRefund / 100}`);

          if (availableToRefund < 9000) {
            console.log('\n⚠️  WARNING: Available amount is less than requested $90');
            console.log(`   This is why the refund is failing!`);
          }
        }
      } else if (payment.status === 'CANCELED') {
        console.log('❌ Payment was canceled - cannot be refunded');
      } else if (payment.status === 'FAILED') {
        console.log('❌ Payment failed - cannot be refunded');
      } else {
        console.log(`⚠️  Payment status is: ${payment.status}`);
        console.log('   Only COMPLETED payments can be refunded');
      }

      // Check if this is a sandbox payment
      if (process.env.SQUARE_ENVIRONMENT === 'sandbox') {
        console.log('\n💡 NOTE: You are using Square Sandbox environment');
        console.log('   Sandbox payments may behave differently than production payments');
        console.log('   Some sandbox payments may have been auto-refunded or expired');
      }

    } else {
      console.log('❌ Payment not found in Square');
    }

  } catch (error: any) {
    console.error('\n❌ Error fetching payment from Square:', error.message);

    if (error.errors) {
      console.error('\nSquare API Errors:');
      error.errors.forEach((err: any) => {
        console.error(`  - ${err.category}: ${err.detail || err.code}`);
      });
    }

    if (error.statusCode === 404) {
      console.log('\n💡 The payment was not found in Square.');
      console.log('   Possible reasons:');
      console.log('   1. Payment ID is incorrect');
      console.log('   2. Payment was created in a different Square account');
      console.log('   3. Payment has expired (sandbox payments may expire)');
    }
  }
}

// Run the script
checkSquarePaymentStatus().then(() => {
  console.log('\n🏁 Check complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});