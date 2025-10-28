import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentPayments() {
  console.log('Checking recent payments...\n');

  // Get the most recent payments
  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching payments:', error);
    return;
  }

  if (!payments || payments.length === 0) {
    console.log('No payments found.');
    return;
  }

  console.log(`Found ${payments.length} recent payment(s):\n`);

  payments.forEach((payment, index) => {
    console.log(`Payment ${index + 1}:`);
    console.log(`  ID: ${payment.id}`);
    console.log(`  Amount: $${(payment.amount_cents / 100).toFixed(2)}`);
    console.log(`  Coach Earnings: $${(payment.coach_earnings_cents / 100).toFixed(2)}`);
    console.log(`  Status: ${payment.status}`);
    console.log(`  Coach ID: ${payment.coach_id}`);
    console.log(`  Payout ID: ${payment.payout_id || 'NULL (not paid out yet)'}`);
    console.log(`  Square Payment ID: ${payment.square_payment_id}`);
    console.log(`  Created: ${new Date(payment.created_at).toLocaleString()}`);
    console.log(`  Paid At: ${payment.paid_at ? new Date(payment.paid_at).toLocaleString() : 'Not yet paid'}`);
    console.log('');
  });

  // Check pending earnings for the coach from the most recent payment
  if (payments[0]?.coach_id) {
    console.log(`\nChecking pending earnings for coach: ${payments[0].coach_id}...\n`);

    const { data: pendingPayments, error: pendingError } = await supabase
      .from('payments')
      .select('id, coach_earnings_cents')
      .eq('coach_id', payments[0].coach_id)
      .in('status', ['completed', 'partially_refunded', 'succeeded'])
      .is('payout_id', null);

    if (pendingError) {
      console.error('Error fetching pending earnings:', pendingError);
      return;
    }

    const totalEarnings = (pendingPayments || []).reduce((sum, p) => sum + (p.coach_earnings_cents || 0), 0);
    console.log(`Pending Earnings: $${(totalEarnings / 100).toFixed(2)}`);
    console.log(`Payment Count: ${pendingPayments?.length || 0}`);
    console.log(`\nPayments included in pending earnings:`);
    pendingPayments?.forEach(p => {
      console.log(`  - Payment ${p.id}: $${(p.coach_earnings_cents / 100).toFixed(2)}`);
    });
  }
}

checkRecentPayments().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
