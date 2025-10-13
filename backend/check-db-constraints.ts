import { supabase } from './src/lib/supabase';

async function checkConstraints() {
  console.log('=== Checking Database Constraints ===\n');

  // Check payments table structure
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .limit(1);

  if (paymentsError) {
    console.error('Error querying payments:', paymentsError);
  } else {
    console.log('✓ Payments table accessible');
  }

  // Check refunds table structure
  const { data: refunds, error: refundsError } = await supabase
    .from('refunds')
    .select('*')
    .limit(1);

  if (refundsError) {
    console.error('Error querying refunds:', refundsError);
  } else {
    console.log('✓ Refunds table accessible');
  }

  // Check for orphaned payment statuses (payments marked as refunded but no refund record)
  console.log('\n=== Checking for Data Integrity Issues ===\n');

  const { data: refundedPayments, error: rpError } = await supabase
    .from('payments')
    .select('id, status, amount_cents')
    .in('status', ['refunded', 'partially_refunded']);

  if (rpError) {
    console.error('Error checking refunded payments:', rpError);
  } else {
    console.log(`Found ${refundedPayments?.length || 0} payments with refunded/partially_refunded status`);

    if (refundedPayments && refundedPayments.length > 0) {
      // Check if these payments have corresponding refund records
      const paymentIds = refundedPayments.map(p => p.id);
      const { data: refundRecords, error: rrError } = await supabase
        .from('refunds')
        .select('payment_id')
        .in('payment_id', paymentIds);

      if (rrError) {
        console.error('Error checking refund records:', rrError);
      } else {
        const refundedPaymentIds = new Set(refundRecords?.map(r => r.payment_id) || []);
        const orphanedPayments = refundedPayments.filter(p => !refundedPaymentIds.has(p.id));

        if (orphanedPayments.length > 0) {
          console.log(`\n⚠️  Found ${orphanedPayments.length} orphaned payments (marked as refunded but no refund record):`);
          orphanedPayments.forEach(p => {
            console.log(`  - Payment ID: ${p.id}, Status: ${p.status}, Amount: $${(p.amount_cents / 100).toFixed(2)}`);
          });
        } else {
          console.log('✓ No orphaned payments found');
        }
      }
    }
  }

  // Check for succeeded payments that should be refunded
  const { data: succeededPayments, error: spError } = await supabase
    .from('payments')
    .select('id, status, amount_cents')
    .eq('status', 'succeeded');

  if (spError) {
    console.error('Error checking succeeded payments:', spError);
  } else if (succeededPayments && succeededPayments.length > 0) {
    const paymentIds = succeededPayments.map(p => p.id);
    const { data: unexpectedRefunds, error: urError } = await supabase
      .from('refunds')
      .select('payment_id, status')
      .in('payment_id', paymentIds)
      .eq('status', 'succeeded');

    if (urError) {
      console.error('Error checking for unexpected refunds:', urError);
    } else if (unexpectedRefunds && unexpectedRefunds.length > 0) {
      console.log(`\n⚠️  Found ${unexpectedRefunds.length} succeeded payments that have refund records but wrong status:`);
      unexpectedRefunds.forEach(r => {
        const payment = succeededPayments.find(p => p.id === r.payment_id);
        if (payment) {
          console.log(`  - Payment ID: ${payment.id}, Status: ${payment.status}, Amount: $${(payment.amount_cents / 100).toFixed(2)}`);
        }
      });
    } else {
      console.log('✓ No status mismatches found for succeeded payments');
    }
  }
}

checkConstraints()
  .then(() => {
    console.log('\n=== Check Complete ===');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
