import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPaymentRefunds() {
  const paymentId = '19c9dcb8-fe38-4bbf-8282-ffee609e882c';
  const squarePaymentId = 'dIrVTM7ndFfs9rDQEsc6NJTEzK8YY';

  console.log('🔍 Checking payment and refund status\n');
  console.log(`Payment ID: ${paymentId}`);
  console.log(`Square Payment ID: ${squarePaymentId}\n`);

  try {
    // Get payment details
    console.log('📋 Payment Details:');
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError) {
      console.error('❌ Error fetching payment:', paymentError);
      return;
    }

    if (payment) {
      console.log(`  Status: ${payment.status}`);
      console.log(`  Amount: $${payment.amount_cents / 100}`);
      console.log(`  Square Payment ID: ${payment.square_payment_id}`);
      console.log(`  Created: ${new Date(payment.created_at).toLocaleString()}`);
      console.log(`  Paid At: ${payment.paid_at ? new Date(payment.paid_at).toLocaleString() : 'N/A'}`);
    }

    // Check for existing refunds in refunds table
    console.log('\n📋 Existing Refunds (refunds table):');
    const { data: refunds, error: refundsError } = await supabase
      .from('refunds')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false });

    if (refundsError) {
      console.error('❌ Error fetching refunds:', refundsError);
    } else if (refunds && refunds.length > 0) {
      console.log(`  Found ${refunds.length} refund(s):\n`);
      refunds.forEach((refund: any, index: number) => {
        console.log(`  Refund ${index + 1}:`);
        console.log(`    ID: ${refund.id}`);
        console.log(`    Square Refund ID: ${refund.square_refund_id || refund.stripe_refund_id || 'N/A'}`);
        console.log(`    Amount: $${refund.amount_cents / 100}`);
        console.log(`    Status: ${refund.status}`);
        console.log(`    Reason: ${refund.reason}`);
        console.log(`    Created: ${new Date(refund.created_at).toLocaleString()}`);
        if (refund.processed_at) {
          console.log(`    Processed: ${new Date(refund.processed_at).toLocaleString()}`);
        }
        console.log('');
      });

      // Calculate total refunded
      const totalRefunded = refunds
        .filter((r: any) => r.status === 'succeeded' || r.status === 'processing')
        .reduce((sum: number, r: any) => sum + r.amount_cents, 0);

      console.log(`  Total Refunded: $${totalRefunded / 100}`);
      console.log(`  Available to Refund: $${(payment.amount_cents - totalRefunded) / 100}`);
    } else {
      console.log('  No refunds found in refunds table');
    }

    // Check for refund requests
    console.log('\n📋 Refund Requests (refund_requests table):');
    const { data: refundRequests, error: requestsError } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('❌ Error fetching refund requests:', requestsError);
    } else if (refundRequests && refundRequests.length > 0) {
      console.log(`  Found ${refundRequests.length} refund request(s):\n`);
      refundRequests.forEach((req: any, index: number) => {
        console.log(`  Request ${index + 1}:`);
        console.log(`    ID: ${req.id}`);
        console.log(`    Amount: $${req.amount_cents / 100}`);
        console.log(`    Status: ${req.status}`);
        console.log(`    Reason: ${req.reason}`);
        console.log(`    Created: ${new Date(req.created_at).toLocaleString()}`);
        if (req.reviewed_at) {
          console.log(`    Reviewed: ${new Date(req.reviewed_at).toLocaleString()}`);
        }
        console.log('');
      });
    } else {
      console.log('  No refund requests found');
    }

    // Check billing transactions
    console.log('\n📋 Billing Transactions:');
    const { data: transactions, error: transError } = await supabase
      .from('billing_transactions')
      .select('*')
      .eq('reference_id', paymentId)
      .order('created_at', { ascending: false });

    if (transError) {
      console.error('❌ Error fetching billing transactions:', transError);
    } else if (transactions && transactions.length > 0) {
      console.log(`  Found ${transactions.length} transaction(s):\n`);
      transactions.forEach((trans: any, index: number) => {
        console.log(`  Transaction ${index + 1}:`);
        console.log(`    Type: ${trans.transaction_type}`);
        console.log(`    Amount: $${trans.amount_cents / 100}`);
        console.log(`    Status: ${trans.status}`);
        console.log(`    Created: ${new Date(trans.created_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('  No billing transactions found');
    }

    console.log('\n💡 Analysis:');
    console.log('================================================================================');
    if (payment.status === 'refunded') {
      console.log('⚠️  Payment status is "refunded" - this payment may have already been fully refunded');
    } else if (payment.status === 'partially_refunded') {
      console.log('⚠️  Payment status is "partially_refunded" - some amount has been refunded');
    }

    if (refunds && refunds.length > 0) {
      console.log('⚠️  There are existing refunds for this payment');
      console.log('   This might be why Square is rejecting the refund request');
    }

    console.log('\n💡 Recommendation:');
    console.log('   The Square API error suggests the payment has already been refunded or');
    console.log('   there is insufficient amount available to refund.');
    console.log('   You may need to check the Square dashboard directly to see the payment status.');
    console.log('   Square Sandbox Dashboard: https://squareup.com/dashboard/sales/transactions');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
checkPaymentRefunds().then(() => {
  console.log('\n🏁 Check complete');
  process.exit(0);
});