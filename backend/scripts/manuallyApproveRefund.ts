import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function manuallyApproveRefund() {
  const refundRequestId = '014af165-62ee-4352-bdff-e40fd98219fe';
  const adminUserId = '3746cee2-c630-4d2a-a044-8f8c1fa1665e';

  console.log('🔧 Manually approving refund request (without Square processing)\n');
  console.log(`Refund Request ID: ${refundRequestId}`);
  console.log(`Admin User ID: ${adminUserId}\n`);

  try {
    // Update refund request to approved
    const { data: updatedRequest, error: updateError } = await supabase
      .from('refund_requests')
      .update({
        status: 'approved',
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        refund_method: 'manual',
        description: 'Manually approved - Square Sandbox refund not possible for this payment. Refund to be processed manually.'
      })
      .eq('id', refundRequestId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating refund request:', updateError);
      return;
    }

    console.log('✅ Refund request approved successfully\n');
    console.log('Updated Request:');
    console.log(`  ID: ${updatedRequest.id}`);
    console.log(`  Status: ${updatedRequest.status}`);
    console.log(`  Amount: $${updatedRequest.amount_cents / 100}`);
    console.log(`  Reviewed By: ${updatedRequest.reviewed_by}`);
    console.log(`  Reviewed At: ${new Date(updatedRequest.reviewed_at).toLocaleString()}`);

    // Update associated billing transaction
    const { error: transError } = await supabase
      .from('billing_transactions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
        description: 'Manually approved refund - Square Sandbox limitation'
      })
      .eq('reference_id', refundRequestId)
      .eq('reference_type', 'refund');

    if (transError) {
      console.warn('\n⚠️  Warning: Could not update billing transaction:', transError.message);
    } else {
      console.log('\n✅ Associated billing transaction updated');
    }

    console.log('\n📝 NOTE:');
    console.log('   This refund request has been approved in the database.');
    console.log('   Since this is a Square Sandbox payment that cannot be refunded,');
    console.log('   you should manually process the refund through Square Dashboard');
    console.log('   or consider this a test scenario that doesn\'t require actual refund.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

manuallyApproveRefund().then(() => {
  console.log('\n🏁 Process complete');
  process.exit(0);
});