/**
 * Script to manually capture an authorized payment
 * Usage: node scripts/capturePayment.js <payment_id>
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Client, Environment } = require('square');

const paymentId = process.argv[2];

if (!paymentId) {
  console.error('Usage: node scripts/capturePayment.js <payment_id>');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Square client
const squareEnvironment = process.env.SQUARE_ENVIRONMENT === 'production'
  ? Environment.Production
  : Environment.Sandbox;

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: squareEnvironment
});

const paymentsApi = squareClient.paymentsApi;

async function capturePayment() {
  try {
    // 1. Get payment record from database
    console.log(`Fetching payment ${paymentId} from database...`);
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) {
      throw new Error(`Payment not found: ${error.message}`);
    }

    console.log('Payment found:');
    console.log('- ID:', payment.id);
    console.log('- Status:', payment.status);
    console.log('- Amount:', payment.amount_cents, 'cents ($' + (payment.amount_cents / 100).toFixed(2) + ')');
    console.log('- Square Payment ID:', payment.square_payment_id);

    // 2. Check if payment can be captured
    if (payment.status !== 'pending' && payment.status !== 'authorized') {
      throw new Error(`Payment cannot be captured. Current status: ${payment.status}`);
    }

    // 3. Capture the payment in Square
    console.log('\nCapturing payment in Square...');
    const { result: captureResult } = await paymentsApi.completePayment(payment.square_payment_id, {});

    console.log('Square capture successful:');
    console.log('- Square Status:', captureResult.payment?.status);
    console.log('- Square Amount:', captureResult.payment?.amountMoney?.amount, 'cents');

    // 4. Update payment status in database
    console.log('\nUpdating payment status in database...');
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update payment: ${updateError.message}`);
    }

    console.log('\n✅ Payment captured successfully!');
    console.log('- Payment ID:', updatedPayment.id);
    console.log('- New Status:', updatedPayment.status);
    console.log('- Paid At:', updatedPayment.paid_at);
    console.log('\nYou can now check Square dashboard to see the completed payment.');

  } catch (error) {
    console.error('\n❌ Error capturing payment:', error.message);
    if (error.errors) {
      console.error('Square API errors:', JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

capturePayment();
