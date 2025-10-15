/**
 * Test Email Script - Resend Email Service
 *
 * This script sends a test email to verify that Resend is configured correctly.
 *
 * Usage: node scripts/testEmail.js <recipient-email>
 * Example: node scripts/testEmail.js your-email@example.com
 */

require('dotenv').config();
const { Resend } = require('resend');

// Get recipient email from command line argument
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error('❌ Error: Please provide a recipient email address');
  console.log('Usage: node scripts/testEmail.js <recipient-email>');
  console.log('Example: node scripts/testEmail.js your-email@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(recipientEmail)) {
  console.error('❌ Error: Invalid email format');
  process.exit(1);
}

async function testEmailService() {
  console.log('\n🧪 Testing Resend Email Service...\n');

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ Error: RESEND_API_KEY is not configured in .env file');
    process.exit(1);
  }

  console.log('✅ RESEND_API_KEY found');
  console.log(`📧 Recipient: ${recipientEmail}`);
  console.log(`📤 From: ${process.env.RESEND_FROM_NAME || 'ACT Coaching For Life'} <${process.env.FROM_EMAIL || 'noreply@actcoachingforlife.com'}>\n`);

  // Initialize Resend
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    console.log('⏳ Sending test email...\n');

    const result = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME || 'ACT Coaching For Life'} <${process.env.FROM_EMAIL || 'noreply@actcoachingforlife.com'}>`,
      to: [recipientEmail],
      subject: 'Test Email - Resend Configuration',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .success-box {
              background: #e8f5e8;
              border: 2px solid #4CAF50;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
              text-align: center;
            }
            .info-item {
              background: #f8f9fa;
              padding: 15px;
              margin: 10px 0;
              border-radius: 6px;
              border-left: 4px solid #4CAF50;
            }
            .footer {
              background: #f8f9fa;
              padding: 30px;
              text-align: center;
              color: #6c757d;
              font-size: 14px;
              border-top: 1px solid #e9ecef;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email Test Successful!</h1>
            </div>
            <div class="content">
              <h2>Resend Email Service is Working</h2>
              <p>If you're reading this email, it means your Resend email service is configured correctly and working as expected!</p>

              <div class="success-box">
                <h3 style="margin-top: 0; color: #2e7d32;">🎉 Configuration Verified</h3>
                <p style="margin-bottom: 0;">Your email service is ready to send emails in production.</p>
              </div>

              <h3>Configuration Details:</h3>
              <div class="info-item">
                <strong>Service:</strong> Resend API
              </div>
              <div class="info-item">
                <strong>From Name:</strong> ${process.env.RESEND_FROM_NAME || 'ACT Coaching For Life'}
              </div>
              <div class="info-item">
                <strong>From Email:</strong> ${process.env.FROM_EMAIL || 'noreply@actcoachingforlife.com'}
              </div>
              <div class="info-item">
                <strong>Test Date:</strong> ${new Date().toLocaleString()}
              </div>

              <p><strong>What emails can be sent:</strong></p>
              <ul>
                <li>✅ Welcome emails to new users</li>
                <li>✅ Appointment confirmations</li>
                <li>✅ Password reset emails</li>
                <li>✅ Coach application notifications</li>
                <li>✅ Staff invitations</li>
                <li>✅ Session reminders</li>
              </ul>

              <p>Your email service is fully operational!</p>
            </div>
            <div class="footer">
              <p><strong>ACT Coaching For Life</strong></p>
              <p>© ${new Date().getFullYear()} All rights reserved.</p>
              <p>This is a test email sent to ${recipientEmail}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Email Test Successful!

        If you're reading this email, it means your Resend email service is configured correctly and working as expected!

        Configuration Details:
        - Service: Resend API
        - From Name: ${process.env.RESEND_FROM_NAME || 'ACT Coaching For Life'}
        - From Email: ${process.env.FROM_EMAIL || 'noreply@actcoachingforlife.com'}
        - Test Date: ${new Date().toLocaleString()}

        What emails can be sent:
        - Welcome emails to new users
        - Appointment confirmations
        - Password reset emails
        - Coach application notifications
        - Staff invitations
        - Session reminders

        Your email service is fully operational!

        ACT Coaching For Life
        © ${new Date().getFullYear()} All rights reserved.
      `
    });

    if (result.error) {
      console.error('❌ Email sending failed!\n');
      console.error('Error:', result.error);
      console.error('\nDetails:', JSON.stringify(result.error, null, 2));
      process.exit(1);
    }

    console.log('✅ Email sent successfully!\n');
    console.log('📬 Message ID:', result.data?.id);
    console.log('\n🎉 Test completed! Check your inbox at:', recipientEmail);
    console.log('\nNote: The email might take a few seconds to arrive. Check your spam folder if you don\'t see it.');

  } catch (error) {
    console.error('❌ Unexpected error occurred!\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testEmailService();
