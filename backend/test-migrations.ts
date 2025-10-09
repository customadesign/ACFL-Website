import { supabase } from './src/lib/supabase';

/**
 * Test script to verify migrations work correctly
 *
 * This script tests:
 * 1. CASCADE delete constraint (when payment is deleted, refunds are deleted)
 * 2. Trigger that resets payment status when refund is deleted
 * 3. Integrity check function
 *
 * IMPORTANT: This creates and deletes test data. Only run in development!
 */

async function testMigrations() {
  console.log('=== Testing Database Migrations ===\n');
  console.log('⚠️  This will create and delete test data. Only run in development!\n');

  // Wait for user confirmation
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Test 1: Create a test payment
    console.log('Test 1: Creating test payment...');
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        coach_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        client_id: '00000000-0000-0000-0000-000000000000',
        amount_cents: 5000,
        coach_earnings_cents: 5000,
        status: 'succeeded',
        description: 'MIGRATION_TEST_PAYMENT',
        square_payment_id: 'test_migration_' + Date.now()
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error('❌ Failed to create test payment:', paymentError);
      return;
    }

    console.log(`✓ Created test payment: ${payment.id}`);

    // Test 2: Create a test refund for this payment
    console.log('\nTest 2: Creating test refund...');
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .insert({
        payment_id: payment.id,
        amount_cents: 5000,
        coach_penalty_cents: 0,
        status: 'succeeded',
        square_refund_id: 'test_refund_' + Date.now()
      })
      .select()
      .single();

    if (refundError || !refund) {
      console.error('❌ Failed to create test refund:', refundError);
      // Clean up payment
      await supabase.from('payments').delete().eq('id', payment.id);
      return;
    }

    console.log(`✓ Created test refund: ${refund.id}`);

    // Test 3: Update payment status to refunded
    console.log('\nTest 3: Updating payment status to refunded...');
    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: 'refunded' })
      .eq('id', payment.id);

    if (updateError) {
      console.error('❌ Failed to update payment status:', updateError);
    } else {
      console.log('✓ Updated payment status to refunded');
    }

    // Test 4: Delete the refund (trigger should reset payment status)
    console.log('\nTest 4: Deleting refund (should trigger status reset)...');
    const { error: deleteRefundError } = await supabase
      .from('refunds')
      .delete()
      .eq('id', refund.id);

    if (deleteRefundError) {
      console.error('❌ Failed to delete refund:', deleteRefundError);
    } else {
      console.log('✓ Deleted refund');
    }

    // Test 5: Check if payment status was reset
    console.log('\nTest 5: Checking if payment status was reset...');
    const { data: updatedPayment, error: checkError } = await supabase
      .from('payments')
      .select('status')
      .eq('id', payment.id)
      .single();

    if (checkError) {
      console.error('❌ Failed to check payment status:', checkError);
    } else if (updatedPayment?.status === 'succeeded') {
      console.log('✅ SUCCESS: Payment status was automatically reset to succeeded!');
    } else {
      console.log(`❌ FAILED: Payment status is "${updatedPayment?.status}", expected "succeeded"`);
      console.log('   The trigger may not have fired correctly.');
    }

    // Test 6: Create another refund to test CASCADE delete
    console.log('\nTest 6: Testing CASCADE delete...');
    const { data: refund2, error: refundError2 } = await supabase
      .from('refunds')
      .insert({
        payment_id: payment.id,
        amount_cents: 2500,
        coach_penalty_cents: 0,
        status: 'succeeded',
        square_refund_id: 'test_refund2_' + Date.now()
      })
      .select()
      .single();

    if (refundError2 || !refund2) {
      console.error('❌ Failed to create test refund 2:', refundError2);
    } else {
      console.log(`✓ Created test refund 2: ${refund2.id}`);

      // Delete the payment (should cascade delete the refund)
      console.log('   Deleting payment (should cascade delete refund)...');
      const { error: deletePaymentError } = await supabase
        .from('payments')
        .delete()
        .eq('id', payment.id);

      if (deletePaymentError) {
        console.error('❌ Failed to delete payment:', deletePaymentError);
      } else {
        console.log('✓ Deleted payment');

        // Check if refund was cascade deleted
        const { data: checkRefund, error: checkRefundError } = await supabase
          .from('refunds')
          .select('id')
          .eq('id', refund2.id);

        if (checkRefundError) {
          console.error('❌ Failed to check refund:', checkRefundError);
        } else if (!checkRefund || checkRefund.length === 0) {
          console.log('✅ SUCCESS: Refund was automatically cascade deleted!');
        } else {
          console.log('❌ FAILED: Refund still exists, CASCADE delete did not work');
          console.log('   Cleaning up...');
          await supabase.from('refunds').delete().eq('id', refund2.id);
        }
      }
    }

    // Test 7: Check integrity function (if it exists)
    console.log('\nTest 7: Testing integrity check function...');
    try {
      const { data: integrityCheck, error: integrityError } = await supabase
        .rpc('check_payment_refund_integrity', { fix_issues: false });

      if (integrityError) {
        console.log('⚠️  Integrity check function not available (may need to run migration 003)');
        console.log('   Error:', integrityError.message);
      } else {
        console.log('✓ Integrity check function is available');
        if (integrityCheck && integrityCheck.length > 0) {
          console.log(`   Found ${integrityCheck.length} integrity issues:`);
          integrityCheck.forEach((issue: any) => {
            console.log(`   - ${issue.issue_type}: Payment ${issue.payment_id}`);
          });
        } else {
          console.log('✅ No integrity issues found!');
        }
      }
    } catch (err) {
      console.log('⚠️  Could not test integrity function:', err);
    }

    console.log('\n=== Migration Tests Complete ===');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

console.log('Starting migration tests in 2 seconds...');
console.log('Press Ctrl+C to cancel if you don\'t want to run tests.\n');

setTimeout(() => {
  testMigrations()
    .then(() => {
      console.log('\nAll tests completed.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}, 2000);
