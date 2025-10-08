// Quick test script to verify session completion and invoice generation
const { sessionService } = require('./services/sessionService');

async function testSessionCompletion() {
  try {
    console.log('Testing session completion...');

    // Test with a mock session ID - replace with a real one from your database
    const testSessionId = 'your-test-session-id-here';

    const result = await sessionService.completeSession({
      session_id: testSessionId,
      session_notes: 'Test completion',
      auto_capture_payment: true,
      generate_invoice: true
    }, 'test-user-id');

    console.log('Session completion result:');
    console.log('- Session:', result.session?.id, result.session?.status);
    console.log('- Invoice:', result.invoice?.id, result.invoice?.invoice_number);

    if (result.invoice) {
      console.log('✅ Invoice generated successfully');
    } else {
      console.log('❌ No invoice generated');
    }

  } catch (error) {
    console.error('❌ Error testing session completion:', error.message);
  }
}

// Run the test
testSessionCompletion();