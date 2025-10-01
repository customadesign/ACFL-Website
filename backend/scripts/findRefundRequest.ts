import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findRefundRequest() {
  const refundRequestId = 'd98219fe'; // This is a partial UUID

  console.log(`🔍 Searching for refund request with partial ID: ${refundRequestId}\n`);

  try {
    // Get all refund requests and filter by partial ID match
    const { data: allRequests, error } = await supabase
      .from('refund_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    let refundRequests: any[] = [];

    if (!error && allRequests) {
      refundRequests = allRequests.filter((req: any) =>
        req.id.toString().toLowerCase().startsWith(refundRequestId.toLowerCase()) ||
        req.id.toString().toLowerCase().includes(refundRequestId.toLowerCase())
      );
    }

    if (error) {
      console.error('❌ Error fetching refund requests:', error);
      return;
    }

    if (!refundRequests || refundRequests.length === 0) {
      console.log('⚠️  No refund requests found with that ID.');
      console.log('\n📋 Fetching recent pending refund requests instead...\n');

      const { data: recentRequests, error: recentError } = await supabase
        .from('refund_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) {
        console.error('❌ Error fetching recent requests:', recentError);
        return;
      }

      if (recentRequests && recentRequests.length > 0) {
        console.log('Recent pending refund requests:');
        recentRequests.forEach((req: any) => {
          console.log(`\n  ID: ${req.id}`);
          console.log(`  Payment ID: ${req.payment_id}`);
          console.log(`  Amount: $${req.amount_cents / 100}`);
          console.log(`  Reason: ${req.reason}`);
          console.log(`  Status: ${req.status}`);
          console.log(`  Created: ${new Date(req.created_at).toLocaleString()}`);
        });
      } else {
        console.log('  No pending refund requests found.');
      }

      return;
    }

    console.log(`✅ Found ${refundRequests.length} refund request(s):\n`);

    for (const refundRequest of refundRequests) {
      console.log('================================================================================');
      console.log(`Refund Request ID: ${refundRequest.id}`);
      console.log(`Payment ID: ${refundRequest.payment_id}`);
      console.log(`Amount: $${refundRequest.amount_cents / 100}`);
      console.log(`Reason: ${refundRequest.reason}`);
      console.log(`Status: ${refundRequest.status}`);
      console.log(`Description: ${refundRequest.description || 'N/A'}`);
      console.log(`Refund Method: ${refundRequest.refund_method}`);
      console.log(`Created: ${new Date(refundRequest.created_at).toLocaleString()}`);
      console.log(`Requested By: ${refundRequest.requested_by} (${refundRequest.requested_by_type})`);

      if (refundRequest.reviewed_at) {
        console.log(`Reviewed: ${new Date(refundRequest.reviewed_at).toLocaleString()}`);
        console.log(`Reviewed By: ${refundRequest.reviewed_by}`);
      }

      if (refundRequest.rejection_reason) {
        console.log(`Rejection Reason: ${refundRequest.rejection_reason}`);
      }

      // Fetch associated payment details
      console.log('\n🔗 Associated Payment Details:');
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', refundRequest.payment_id)
        .single();

      if (paymentError) {
        console.log(`  ❌ Error fetching payment: ${paymentError.message}`);
      } else if (payment) {
        console.log(`  Payment Status: ${payment.status}`);
        console.log(`  Payment Amount: $${payment.amount_cents / 100}`);
        console.log(`  Square Payment ID: ${payment.square_payment_id || 'N/A'}`);
        console.log(`  Client ID: ${payment.client_id}`);
        console.log(`  Coach ID: ${payment.coach_id}`);
        console.log(`  Created: ${new Date(payment.created_at).toLocaleString()}`);
      }

      console.log('\n📝 To approve this refund request, use the following API call:\n');
      console.log('PUT /api/billing/refunds/process');
      console.log('Content-Type: application/json');
      console.log('Authorization: Bearer {admin_token}\n');
      console.log(JSON.stringify({
        refund_request_id: refundRequest.id,
        action: 'approve',
        reviewedBy: '{admin_user_id}',
        refund_method: refundRequest.refund_method,
        processing_fee_cents: 0,
        coach_penalty_cents: 0
      }, null, 2));
      console.log('\n================================================================================\n');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
findRefundRequest().then(() => {
  console.log('🏁 Search complete');
  process.exit(0);
});