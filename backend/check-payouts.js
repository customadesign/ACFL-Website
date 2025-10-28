import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPayouts() {
  console.log('Checking payout requests...\n');

  // Get all payout requests
  const { data: payouts, error } = await supabase
    .from('payouts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching payouts:', error);
    return;
  }

  if (!payouts || payouts.length === 0) {
    console.log('No payout requests found.');
    return;
  }

  console.log(`Found ${payouts.length} payout request(s):\n`);

  for (let i = 0; i < payouts.length; i++) {
    const payout = payouts[i];
    console.log(`Payout ${i + 1}:`);
    console.log(`  ID: ${payout.id}`);
    console.log(`  Coach ID: ${payout.coach_id}`);
    console.log(`  Amount: $${(payout.amount_cents / 100).toFixed(2)}`);
    console.log(`  Status: ${payout.status}`);
    console.log(`  Payout Method: ${payout.payout_method}`);
    console.log(`  Bank Account ID: ${payout.bank_account_id || 'Not set'}`);
    console.log(`  Created: ${new Date(payout.created_at).toLocaleString()}`);

    if (payout.metadata) {
      console.log(`  Metadata:`);
      if (payout.metadata.payment_count) {
        console.log(`    - Payment Count: ${payout.metadata.payment_count}`);
      }
      if (payout.metadata.requested_amount_cents) {
        console.log(`    - Requested Amount: $${(payout.metadata.requested_amount_cents / 100).toFixed(2)}`);
      }
      if (payout.metadata.notes) {
        console.log(`    - Notes: ${payout.metadata.notes}`);
      }
      if (payout.metadata.rejection_reason) {
        console.log(`    - Rejection Reason: ${payout.metadata.rejection_reason}`);
      }
    }

    console.log('');
  }

  // Show summary by status
  const statusCounts = payouts.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  console.log('\nSummary by Status:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
}

checkPayouts().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
