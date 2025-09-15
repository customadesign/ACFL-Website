import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

interface EmailData {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

interface UserCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

class SMTPEmailService {
  private transporter: Mail | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Check if SMTP configuration is available
    const smtpHost = process.env.SMTP_HOST || 'mail.linkage.ph';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpUser = process.env.SMTP_USER || 'gabriel.maturan@linkage.ph';
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpPassword) {
      console.warn('SMTP password not configured. Email notifications will be disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        }
      });

      // Verify transporter configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('SMTP configuration error:', error);
          this.isConfigured = false;
        } else {
          console.log('SMTP server is ready to send emails');
          this.isConfigured = true;
        }
      });
    } catch (error) {
      console.error('Failed to initialize SMTP transporter:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail({ to, subject, text, html }: EmailData) {
    if (!this.isConfigured || !this.transporter) {
      console.log('SMTP service not configured. Would have sent:', { to, subject });
      return { success: false, message: 'SMTP service not configured' };
    }

    try {
      const mailOptions: Mail.Options = {
        from: `"${process.env.SMTP_FROM_NAME || 'ACT Coaching For Life'}" <${process.env.SMTP_USER || 'gabriel.maturan@linkage.ph'}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        text: text,
        html: html
      };

      console.log('Sending email via SMTP:', {
        to: mailOptions.to,
        from: mailOptions.from,
        subject: mailOptions.subject
      });

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully:', info.messageId);
      return { 
        success: true, 
        messageId: info.messageId,
        response: info.response 
      };
    } catch (error: any) {
      console.error('SMTP email sending failed:', error);
      return { 
        success: false, 
        error: error.message,
        details: error
      };
    }
  }

  async sendUserCredentials(userData: UserCredentials) {
    const subject = 'Your ACT Coaching For Life Account Credentials';
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:4000'}/login`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Account Credentials</title>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          .credentials-box {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .credentials-box h3 {
            margin-top: 0;
            color: #495057;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .credential-item {
            margin: 15px 0;
            padding: 12px;
            background: white;
            border-radius: 4px;
            border-left: 4px solid #667eea;
          }
          .credential-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .credential-value {
            font-size: 16px;
            color: #212529;
            font-weight: 500;
            font-family: 'Courier New', monospace;
            word-break: break-all;
          }
          .button {
            display: inline-block;
            padding: 14px 35px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .warning-icon {
            display: inline-block;
            margin-right: 8px;
          }
          .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            margin: 5px 0;
          }
          .security-tips {
            background: #e8f4fd;
            border: 1px solid #bee5eb;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
          }
          .security-tips h4 {
            margin-top: 0;
            color: #004085;
          }
          .security-tips ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .security-tips li {
            margin: 5px 0;
            color: #004085;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Your Account Has Been Created</h1>
          </div>
          <div class="content">
            <h2>Welcome${userData.firstName ? `, ${userData.firstName}` : ''}!</h2>
            <p>An administrator has created your ${userData.role} account for ACT Coaching For Life. Below are your login credentials:</p>
            
            <div class="credentials-box">
              <h3>Login Credentials</h3>
              <div class="credential-item">
                <div class="credential-label">Email Address</div>
                <div class="credential-value">${userData.email}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Temporary Password</div>
                <div class="credential-value">${userData.password}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Account Type</div>
                <div class="credential-value">${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}</div>
              </div>
            </div>
            
            <div class="warning">
              <span class="warning-icon">⚠️</span>
              <strong>Important:</strong> Please change your password immediately after your first login for security purposes.
            </div>
            
            <center>
              <a href="${loginUrl}" class="button">Login to Your Account</a>
            </center>
            
            <div class="security-tips">
              <h4>🛡️ Security Tips:</h4>
              <ul>
                <li>Never share your password with anyone</li>
                <li>Use a strong, unique password</li>
                <li>Enable two-factor authentication if available</li>
                <li>Log out when using shared computers</li>
              </ul>
            </div>
            
            <p>If you did not expect this email or have any concerns, please contact our support team immediately at <a href="mailto:support@actcoachingforlife.com">support@actcoachingforlife.com</a></p>
            
            <p>Best regards,<br><strong>The ACT Coaching For Life Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>ACT Coaching For Life</strong></p>
            <p>© ${new Date().getFullYear()} All rights reserved.</p>
            <p>This email was sent to ${userData.email}</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Your ACT Coaching For Life Account Has Been Created
      
      Welcome${userData.firstName ? `, ${userData.firstName}` : ''}!
      
      An administrator has created your ${userData.role} account. Here are your login credentials:
      
      Email: ${userData.email}
      Temporary Password: ${userData.password}
      Account Type: ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
      
      IMPORTANT: Please change your password immediately after your first login.
      
      Login at: ${loginUrl}
      
      Security Tips:
      - Never share your password with anyone
      - Use a strong, unique password
      - Enable two-factor authentication if available
      - Log out when using shared computers
      
      If you did not expect this email, please contact support@actcoachingforlife.com immediately.
      
      Best regards,
      The ACT Coaching For Life Team
    `;

    return this.sendEmail({
      to: userData.email,
      subject,
      text,
      html
    });
  }

  async sendPasswordChangeNotification(email: string, firstName?: string) {
    const subject = 'Password Changed Successfully';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Changed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Password Changed Successfully</h1>
          </div>
          <div class="content">
            <h2>Hello${firstName ? `, ${firstName}` : ''}!</h2>
            <p>Your password has been successfully changed.</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
            <p>For security reasons, you may need to log in again on all your devices.</p>
            <p>Best regards,<br><strong>ACT Coaching For Life Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ACT Coaching For Life. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Changed Successfully
      
      Hello${firstName ? `, ${firstName}` : ''}!
      
      Your password has been successfully changed.
      
      If you did not make this change, please contact our support team immediately.
      
      Best regards,
      ACT Coaching For Life Team
    `;

    return this.sendEmail({
      to: email,
      subject,
      text,
      html
    });
  }

  async sendCoachApprovalEmail({ email, first_name }: { email: string; first_name: string }) {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:4000'}/login`;
    const subject = 'Congratulations! Your Coach Application Has Been Approved';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Approved</title>
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
          .button { 
            display: inline-block;
            padding: 14px 35px;
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .next-steps { 
            background: #e8f5e8;
            border: 1px solid #4CAF50;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
          }
          .next-steps h3 {
            margin-top: 0;
            color: #2e7d32;
          }
          .next-steps ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .next-steps li {
            margin: 8px 0;
            color: #1b5e20;
          }
          .footer { 
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ACT Coaching For Life!</h1>
          </div>
          <div class="content">
            <h2>Congratulations, ${first_name}!</h2>
            <p>We are thrilled to inform you that your coach application has been <strong>approved</strong>! You are now officially part of the ACT Coaching For Life team.</p>
            
            <p>Your dedication to helping others through ACT coaching is commendable, and we're excited to have you on board.</p>
            
            <div class="next-steps">
              <h3>📋 Next Steps:</h3>
              <ul>
                <li><strong>Complete your coach profile</strong> - Add your photo, bio, and specializations</li>
                <li><strong>Set your availability schedule</strong> - Let clients know when you're available</li>
                <li><strong>Review platform guidelines</strong> - Familiarize yourself with our best practices</li>
                <li><strong>Start accepting client bookings</strong> - Begin your coaching journey!</li>
              </ul>
            </div>
            
            <p>Ready to get started? Log in to your coach dashboard now:</p>
            
            <center>
              <a href="${loginUrl}" class="button">Login to Your Dashboard</a>
            </center>
            
            <p>If you have any questions or need assistance getting started, our support team is here to help at <a href="mailto:support@actcoachingforlife.com">support@actcoachingforlife.com</a></p>
            
            <p>Welcome to the team! We look forward to seeing the positive impact you'll make in your clients' lives.</p>
            
            <p>Warm regards,<br><strong>The ACT Coaching For Life Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>ACT Coaching For Life</strong></p>
            <p>© ${new Date().getFullYear()} All rights reserved.</p>
            <p>This email was sent to ${email}</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Congratulations! Your Coach Application Has Been Approved
      
      Dear ${first_name},
      
      We are thrilled to inform you that your coach application has been approved! You are now officially part of the ACT Coaching For Life team.
      
      Your dedication to helping others through ACT coaching is commendable, and we're excited to have you on board.
      
      Next Steps:
      - Complete your coach profile - Add your photo, bio, and specializations
      - Set your availability schedule - Let clients know when you're available
      - Review platform guidelines - Familiarize yourself with our best practices
      - Start accepting client bookings - Begin your coaching journey!
      
      Login to your dashboard at: ${loginUrl}
      
      If you have any questions or need assistance, contact us at support@actcoachingforlife.com
      
      Welcome to the team!
      The ACT Coaching For Life Team
    `;

    return this.sendEmail({
      to: email,
      subject,
      text,
      html
    });
  }

  async sendCoachRejectionEmail({ email, first_name, rejection_reason }: { email: string; first_name: string; rejection_reason: string }) {
    const subject = 'Update on Your Coach Application';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Update</title>
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
            background: linear-gradient(135deg, #ff7043 0%, #ff5722 100%);
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
          .reason-box { 
            background: #fff3e0;
            border: 1px solid #ff9800;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
          }
          .reason-box h3 {
            margin-top: 0;
            color: #e65100;
          }
          .info-box {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
          }
          .info-box h4 {
            margin-top: 0;
            color: #1565c0;
          }
          .footer { 
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Application Update</h1>
          </div>
          <div class="content">
            <h2>Dear ${first_name},</h2>
            
            <p>Thank you for your interest in becoming a coach with ACT Coaching For Life. We appreciate the time and effort you put into your application.</p>
            
            <p>After careful review of your application, we regret to inform you that we are unable to approve your application at this time.</p>
            
            <div class="reason-box">
              <h3>Feedback:</h3>
              <p>${rejection_reason}</p>
            </div>
            
            <div class="info-box">
              <h4>What's Next?</h4>
              <p>We encourage you to:</p>
              <ul>
                <li>Consider gaining additional experience or training in the areas mentioned above</li>
                <li>Continue developing your coaching skills and expertise</li>
                <li>You may reapply after <strong>6 months</strong> from today</li>
              </ul>
            </div>
            
            <p>Please know that this decision does not reflect on your potential as a coach. We receive many applications and must ensure the best fit for our platform's specific requirements.</p>
            
            <p>If you have questions about this decision or would like additional feedback, please don't hesitate to contact us at <a href="mailto:support@actcoachingforlife.com">support@actcoachingforlife.com</a></p>
            
            <p>We appreciate your interest in our platform and wish you all the best in your coaching journey.</p>
            
            <p>Sincerely,<br><strong>The ACT Coaching For Life Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>ACT Coaching For Life</strong></p>
            <p>© ${new Date().getFullYear()} All rights reserved.</p>
            <p>This email was sent to ${email}</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Update on Your Coach Application
      
      Dear ${first_name},
      
      Thank you for your interest in becoming a coach with ACT Coaching For Life. We appreciate the time and effort you put into your application.
      
      After careful review of your application, we regret to inform you that we are unable to approve your application at this time.
      
      Feedback: ${rejection_reason}
      
      What's Next?
      - Consider gaining additional experience or training in the areas mentioned above
      - Continue developing your coaching skills and expertise
      - You may reapply after 6 months from today
      
      Please know that this decision does not reflect on your potential as a coach. We receive many applications and must ensure the best fit for our platform's specific requirements.
      
      If you have questions about this decision or would like additional feedback, please contact us at support@actcoachingforlife.com
      
      We appreciate your interest in our platform and wish you all the best in your coaching journey.
      
      Sincerely,
      The ACT Coaching For Life Team
    `;

    return this.sendEmail({
      to: email,
      subject,
      text,
      html
    });
  }

  async sendStaffInvitation({
    email,
    first_name,
    last_name,
    invitationUrl,
    invitedBy,
    department,
    role_level,
    customMessage,
    expiresAt
  }: {
    email: string;
    first_name: string;
    last_name: string;
    invitationUrl: string;
    invitedBy: string;
    department: string;
    role_level: string;
    customMessage?: string;
    expiresAt: string;
  }) {
    const subject = 'Staff Invitation - Join ACT Coaching For Life Team';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Staff Invitation</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #333;
            background-color: #f4f7fa;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
          }
          .content {
            padding: 40px 30px;
          }
          .invitation-card {
            background-color: #f8f9ff;
            border: 1px solid #e1e8ff;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
          }
          .role-badge {
            display: inline-block;
            background-color: #667eea;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            text-transform: capitalize;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none !important;
            padding: 16px 32px;
            border-radius: 25px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
            transition: all 0.3s ease;
          }
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
          }
          .info-item {
            background-color: #ffffff;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .info-label {
            font-weight: bold;
            color: #4a5568;
            font-size: 14px;
            margin-bottom: 5px;
          }
          .info-value {
            color: #2d3748;
            font-size: 16px;
          }
          .custom-message {
            background-color: #fff7ed;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            font-style: italic;
          }
          .footer {
            background-color: #f7fafc;
            padding: 30px;
            text-align: center;
            color: #718096;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
          }
          .expiry-notice {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #991b1b;
            text-align: center;
          }
          @media (max-width: 600px) {
            .container {
              margin: 0;
              border-radius: 0;
            }
            .content {
              padding: 20px 15px;
            }
            .info-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You're Invited to Join Our Team!</h1>
          </div>
          <div class="content">
            <h2>Hello ${first_name} ${last_name},</h2>
            <p>You have been invited by <strong>${invitedBy}</strong> to join the ACT Coaching For Life team as a staff member!</p>

            <div class="invitation-card">
              <h3 style="margin-top: 0; color: #667eea;">Your Role Details</h3>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Position</div>
                  <div class="info-value">
                    <span class="role-badge">${role_level}</span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">Department</div>
                  <div class="info-value">${department}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${email}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Invited By</div>
                  <div class="info-value">${invitedBy}</div>
                </div>
              </div>
            </div>

            ${customMessage ? `
              <div class="custom-message">
                <strong>Personal Message:</strong><br>
                ${customMessage}
              </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" class="cta-button">Accept Invitation & Create Account</a>
            </div>

            <div class="expiry-notice">
              ⏰ <strong>Important:</strong> This invitation expires on ${expiresAt}
            </div>

            <p><strong>What happens next?</strong></p>
            <ol>
              <li>Click the "Accept Invitation" button above</li>
              <li>Create a secure password for your account</li>
              <li>Complete your staff profile</li>
              <li>Start collaborating with the team!</li>
            </ol>

            <p><strong>Need help?</strong> Contact our support team at <a href="mailto:support@actcoachingforlife.com">support@actcoachingforlife.com</a></p>

            <p>We're excited to have you join our team!</p>
          </div>
          <div class="footer">
            <p><strong>ACT Coaching For Life</strong></p>
            <p>© ${new Date().getFullYear()} All rights reserved.</p>
            <p>This invitation was sent to ${email}</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
              If you did not expect this invitation, please contact us at support@actcoachingforlife.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Staff Invitation - Join ACT Coaching For Life Team

      Hello ${first_name} ${last_name},

      You have been invited by ${invitedBy} to join the ACT Coaching For Life team!

      Role Details:
      - Position: ${role_level}
      - Department: ${department}
      - Email: ${email}
      - Invited by: ${invitedBy}

      ${customMessage ? `Personal Message: ${customMessage}\n` : ''}

      To accept this invitation and create your account, please visit:
      ${invitationUrl}

      IMPORTANT: This invitation expires on ${expiresAt}

      What happens next:
      1. Click the invitation link above
      2. Create a secure password for your account
      3. Complete your staff profile
      4. Start collaborating with the team!

      Need help? Contact our support team at support@actcoachingforlife.com

      We're excited to have you join our team!

      Best regards,
      The ACT Coaching For Life Team
    `;

    return this.sendEmail({
      to: email,
      subject,
      text,
      html
    });
  }
}

export default new SMTPEmailService();