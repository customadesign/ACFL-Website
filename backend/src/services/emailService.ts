import nodemailer from 'nodemailer';

interface EmailData {
  to: string | string[];
  cc?: string[];
  subject: string;
  text?: string;
  html?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface User {
  email: string;
  first_name?: string;
  role: string;
}

interface AppointmentDetails {
  date: string;
  time: string;
  duration?: string;
  type?: string;
}

interface AppointmentConfirmationData {
  clientEmail: string;
  coachEmail: string;
  clientName: string;
  coachName: string;
  appointmentDetails: AppointmentDetails;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = this.checkConfiguration();

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates
          servername: process.env.SMTP_HOST
        }
      });
    } else {
      console.warn('SMTP configuration incomplete. Email notifications will be disabled.');
    }
  }

  private checkConfiguration(): boolean {
    return !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  async sendEmail({ to, cc, subject, text, html, templateData = {}, attachments }: EmailData) {
    if (!this.isConfigured) {
      console.log('Email service not configured. Would have sent:', { to, subject });
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions: any = {
        from: `${process.env.SMTP_FROM_NAME || 'ACT Coaching For Life'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        text: text,
        html: html,
      };

      if (cc && cc.length > 0) {
        mailOptions.cc = cc.join(', ');
      }

      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType || 'application/octet-stream'
        }));
      }

      console.log('Attempting to send email via SMTP:', {
        to: mailOptions.to,
        from: mailOptions.from,
        subject: mailOptions.subject,
        hasAttachments: !!(attachments && attachments.length > 0)
      });

      const info = await this.transporter.sendMail(mailOptions);

      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error('Email sending failed:', error);

      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  async sendWelcomeEmail(user: User) {
    const subject = 'Welcome to ACT Coaching For Life!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ACT Coaching For Life</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ACT Coaching For Life!</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.first_name || user.email}!</h2>
            <p>We're thrilled to have you join our community of individuals committed to personal growth and well-being.</p>

            ${user.role === 'client' ? `
              <p>As a client, you now have access to:</p>
              <ul>
                <li>🔍 Browse and search qualified ACT coaches</li>
                <li>📅 Book appointments with coaches that match your needs</li>
                <li>💬 Secure messaging with your coaches</li>
                <li>🎥 Video sessions for convenient remote coaching</li>
                <li>📊 Personal progress tracking</li>
              </ul>
              <p>Ready to start your journey? Take our quick assessment to find coaches that match your goals:</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4000'}/clients" class="button">Get Started</a>
            ` : `
              <p>As a coach, you now have access to:</p>
              <ul>
                <li>👥 Manage your client roster</li>
                <li>📅 Set your availability and manage appointments</li>
                <li>💬 Secure messaging with clients</li>
                <li>🎥 Video sessions for remote coaching</li>
                <li>📈 Dashboard with insights and analytics</li>
              </ul>
              <p>Ready to help clients on their journey? Access your coach dashboard:</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4000'}/coaches" class="button">Go to Dashboard</a>
            `}

            <p>If you have any questions or need assistance, our support team is here to help. Simply reply to this email or contact us through the platform.</p>

            <p>Welcome aboard!</p>
            <p><strong>The ACT Coaching For Life Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 ACT Coaching For Life. All rights reserved.</p>
            <p>This email was sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to ACT Coaching For Life!

      Hi ${user.first_name || user.email}!

      We're thrilled to have you join our community of individuals committed to personal growth and well-being.

      ${user.role === 'client'
        ? 'As a client, you can browse qualified ACT coaches, book appointments, message securely, have video sessions, and track your progress.'
        : 'As a coach, you can manage clients, set availability, message securely, conduct video sessions, and view analytics.'
      }

      Get started at: ${process.env.FRONTEND_URL || 'http://localhost:4000'}/${user.role}s

      Welcome aboard!
      The ACT Coaching For Life Team
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }

  async sendAppointmentConfirmation({ clientEmail, coachEmail, clientName, coachName, appointmentDetails }: AppointmentConfirmationData) {
    const subject = 'Appointment Confirmed - ACT Coaching For Life';

    const clientHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Appointment Confirmed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .appointment-box { background: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Appointment Confirmed</h1>
          </div>
          <div class="content">
            <h2>Hi ${clientName}!</h2>
            <p>Your appointment has been confirmed with coach <strong>${coachName}</strong>.</p>

            <div class="appointment-box">
              <h3>Appointment Details:</h3>
              <p><strong>Date:</strong> ${appointmentDetails.date}</p>
              <p><strong>Time:</strong> ${appointmentDetails.time}</p>
              <p><strong>Duration:</strong> ${appointmentDetails.duration || '60 minutes'}</p>
              <p><strong>Type:</strong> ${appointmentDetails.type || 'Video Session'}</p>
            </div>

            <p>You'll receive a meeting link before your appointment starts. You can also manage this appointment from your dashboard.</p>

            <p>Looking forward to your session!</p>
            <p><strong>ACT Coaching For Life</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to client
    await this.sendEmail({
      to: clientEmail,
      subject,
      text: `Appointment confirmed with ${coachName} on ${appointmentDetails.date} at ${appointmentDetails.time}`,
      html: clientHtml
    });

    // Send to coach
    const coachHtml = clientHtml.replace(
      `Hi ${clientName}!`,
      `Hi ${coachName}!`
    ).replace(
      `Your appointment has been confirmed with coach <strong>${coachName}</strong>`,
      `You have a new appointment with client <strong>${clientName}</strong>`
    );

    return this.sendEmail({
      to: coachEmail,
      subject: `New Appointment - ${clientName}`,
      text: `New appointment with ${clientName} on ${appointmentDetails.date} at ${appointmentDetails.time}`,
      html: coachHtml
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4000'}/reset-password?token=${resetToken}`;

    const subject = 'Reset Your Password - ACT Coaching For Life';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF6B6B; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .button { display: inline-block; padding: 12px 30px; background: #FF6B6B; color: white; text-decoration: none; border-radius: 5px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>We received a request to reset your password for your ACT Coaching For Life account.</p>

            <p>Click the button below to reset your password:</p>
            <p><a href="${resetUrl}" class="button">Reset Password</a></p>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>

            <div class="warning">
              <strong>Security Note:</strong> This link will expire in 1 hour for your security. If you didn't request this reset, please ignore this email.
            </div>

            <p>If you continue to have problems, please contact our support team.</p>

            <p><strong>ACT Coaching For Life Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request

      We received a request to reset your password for your ACT Coaching For Life account.

      Reset your password by clicking this link: ${resetUrl}

      This link will expire in 1 hour for your security.
      If you didn't request this reset, please ignore this email.

      ACT Coaching For Life Team
    `;

    return this.sendEmail({
      to: email,
      subject,
      text,
      html
    });
  }

  async sendCoachApplicationConfirmation({ email, first_name, application_id }: { email: string; first_name: string; application_id: string }) {
    const subject = 'Application Received - ACT Coaching For Life';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Received</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: #e3f2fd; border: 1px solid #2196f3; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Application Received</h1>
          </div>
          <div class="content">
            <h2>Thank you, ${first_name}!</h2>
            <p>We have received your coach application and it is currently under review.</p>

            <div class="info-box">
              <h3>What happens next?</h3>
              <ul>
                <li>Our team will review your qualifications within 3-5 business days</li>
                <li>We may contact your professional references</li>
                <li>You'll receive an email notification with our decision</li>
              </ul>
            </div>

            <p><strong>Application ID:</strong> ${application_id}</p>
            <p>Please keep this ID for your records.</p>

            <p>If you have any questions, please contact us at support@actcoachingforlife.com</p>

            <p>Best regards,<br><strong>ACT Coaching For Life Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 ACT Coaching For Life. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Application Received - ACT Coaching For Life

      Thank you, ${first_name}!

      We have received your coach application and it is currently under review.

      What happens next:
      - Our team will review your qualifications within 3-5 business days
      - We may contact your professional references
      - You'll receive an email notification with our decision

      Application ID: ${application_id}
      Please keep this ID for your records.

      If you have questions, contact support@actcoachingforlife.com

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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .next-steps { background: #e8f5e8; border: 1px solid #4CAF50; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ACT Coaching For Life!</h1>
          </div>
          <div class="content">
            <h2>Congratulations, ${first_name}!</h2>
            <p>Your coach application has been approved. You can now log in to your coach dashboard and start helping clients achieve their goals.</p>

            <div class="next-steps">
              <h3>Next Steps:</h3>
              <ul>
                <li>Complete your coach profile</li>
                <li>Set your availability schedule</li>
                <li>Review platform guidelines</li>
                <li>Start accepting client bookings</li>
              </ul>
            </div>

            <p>Ready to get started?</p>
            <p><a href="${loginUrl}" class="button">Login to Your Dashboard</a></p>

            <p>If you have any questions or need assistance, our support team is here to help at support@actcoachingforlife.com</p>

            <p>Welcome to the team!</p>
            <p><strong>ACT Coaching For Life Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 ACT Coaching For Life. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Congratulations! Your Coach Application Has Been Approved

      Dear ${first_name},

      Your coach application has been approved. You can now log in to your coach dashboard and start helping clients.

      Next Steps:
      - Complete your coach profile
      - Set your availability schedule
      - Review platform guidelines
      - Start accepting client bookings

      Login URL: ${loginUrl}

      Welcome to the team!
      ACT Coaching For Life Team
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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff7043 0%, #ff5722 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .reason-box { background: #fff3e0; border: 1px solid #ff9800; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Application Update</h1>
          </div>
          <div class="content">
            <h2>Thank you for your interest, ${first_name}</h2>
            <p>Thank you for your interest in becoming a coach with ACT Coaching For Life. After careful review, we have decided not to move forward with your application at this time.</p>

            <div class="reason-box">
              <h3>Feedback:</h3>
              <p>${rejection_reason}</p>
            </div>

            <p>You may reapply after 6 months. We encourage you to gain additional experience or training in the areas mentioned above.</p>

            <p>If you have questions about this decision, please contact support@actcoachingforlife.com</p>

            <p>We appreciate your interest in our platform and wish you the best in your coaching journey.</p>

            <p>Best regards,<br><strong>ACT Coaching For Life Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 ACT Coaching For Life. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Application Update - ACT Coaching For Life

      Dear ${first_name},

      Thank you for your interest in becoming a coach with ACT Coaching For Life. After careful review, we have decided not to move forward with your application at this time.

      Feedback: ${rejection_reason}

      You may reapply after 6 months. We encourage you to gain additional experience or training in the areas mentioned above.

      If you have questions, please contact support@actcoachingforlife.com

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

  async sendFollowUpEmail({ email, first_name, application_id, days_remaining }: {
    email: string;
    first_name: string;
    application_id: string;
    days_remaining: number;
  }) {
    const applicationUrl = `${process.env.FRONTEND_URL || 'http://localhost:4000'}/register/coach/verification?id=${application_id}`;
    const subject = 'Complete Your Coach Application - ACT Coaching For Life';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Complete Your Application</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #667eea; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Complete Your Application</h1>
          </div>
          <div class="content">
            <h2>Hi ${first_name}!</h2>
            <p>Your application expires in ${days_remaining} days.</p>
            <p><a href="${applicationUrl}" class="button">Complete Application</a></p>
            <p>Best regards,<br>ACT Coaching For Life Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Complete Your Coach Application\n\nHi ${first_name}!\n\nYour application expires in ${days_remaining} days.\n\nComplete at: ${applicationUrl}\n\nACT Coaching For Life Team`;

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

  async sendAdminPasswordReset({ email, password, firstName, lastName, role }: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: string;
  }) {
    const subject = 'Password Reset - ACT Coaching For Life';
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:4000'}/login`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
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
            background: linear-gradient(135deg, #FF6B6B 0%, #ff5722 100%);
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
            background: #fff3e0;
            border: 2px solid #ff9800;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .credentials-box h3 {
            margin-top: 0;
            color: #e65100;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .credential-item {
            margin: 15px 0;
            padding: 12px;
            background: white;
            border-radius: 4px;
            border-left: 4px solid #FF6B6B;
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
            background: linear-gradient(135deg, #FF6B6B 0%, #ff5722 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .warning {
            background: #ffebee;
            border: 1px solid #f44336;
            color: #b71c1c;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Completed</h1>
          </div>
          <div class="content">
            <h2>Hello${firstName ? `, ${firstName}` : ''}!</h2>
            <p>Your password has been reset by an administrator. Below are your new login credentials:</p>

            <div class="credentials-box">
              <h3>New Login Credentials</h3>
              <div class="credential-item">
                <div class="credential-label">Email Address</div>
                <div class="credential-value">${email}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">New Password</div>
                <div class="credential-value">${password}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Account Type</div>
                <div class="credential-value">${role.charAt(0).toUpperCase() + role.slice(1)}</div>
              </div>
            </div>

            <div class="warning">
              <span>⚠️</span>
              <strong>Important:</strong> Please change your password immediately after logging in for security purposes.
            </div>

            <center>
              <a href="${loginUrl}" class="button">Login to Your Account</a>
            </center>

            <div class="security-tips">
              <h4>🛡️ Security Reminder:</h4>
              <ul>
                <li>Your password was reset for security reasons</li>
                <li>Please change it to something only you know</li>
                <li>Use a strong, unique password</li>
                <li>Never share your credentials with anyone</li>
              </ul>
            </div>

            <p>If you did not request this password reset or have any concerns, please contact our support team immediately at <a href="mailto:support@actcoachingforlife.com">support@actcoachingforlife.com</a></p>

            <p>Best regards,<br><strong>The ACT Coaching For Life Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>ACT Coaching For Life</strong></p>
            <p>© ${new Date().getFullYear()} All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset - ACT Coaching For Life

      Hello${firstName ? `, ${firstName}` : ''}!

      Your password has been reset by an administrator. Here are your new login credentials:

      Email: ${email}
      New Password: ${password}
      Account Type: ${role.charAt(0).toUpperCase() + role.slice(1)}

      IMPORTANT: Please change your password immediately after logging in for security purposes.

      Login at: ${loginUrl}

      Security Reminder:
      - Your password was reset for security reasons
      - Please change it to something only you know
      - Use a strong, unique password
      - Never share your credentials with anyone

      If you did not request this password reset, please contact support@actcoachingforlife.com immediately.

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

  async sendUserCredentials({ email, password, firstName, lastName, role }: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: string;
  }) {
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
          .warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Your Account Has Been Created</h1>
          </div>
          <div class="content">
            <h2>Welcome${firstName ? `, ${firstName}` : ''}!</h2>
            <p>An administrator has created your ${role} account for ACT Coaching For Life. Below are your login credentials:</p>

            <div class="credentials-box">
              <h3>Login Credentials</h3>
              <div class="credential-item">
                <div class="credential-label">Email Address</div>
                <div class="credential-value">${email}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Temporary Password</div>
                <div class="credential-value">${password}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Account Type</div>
                <div class="credential-value">${role.charAt(0).toUpperCase() + role.slice(1)}</div>
              </div>
            </div>

            <div class="warning">
              <span>⚠️</span>
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
      Your ACT Coaching For Life Account Has Been Created

      Welcome${firstName ? `, ${firstName}` : ''}!

      An administrator has created your ${role} account. Here are your login credentials:

      Email: ${email}
      Temporary Password: ${password}
      Account Type: ${role.charAt(0).toUpperCase() + role.slice(1)}

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
      to: email,
      subject,
      text,
      html
    });
  }

  async sendSessionReminder({
    clientEmail,
    coachEmail,
    clientName,
    coachName,
    appointmentDetails,
    timeUntilSession
  }: {
    clientEmail: string;
    coachEmail: string;
    clientName: string;
    coachName: string;
    appointmentDetails: AppointmentDetails;
    timeUntilSession: string;
  }) {
    const clientSubject = `Session Reminder: Your appointment with ${coachName} is approaching`;
    const coachSubject = `Session Reminder: Your appointment with ${clientName} is approaching`;
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:4000'}/login`;

    const clientHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Session Reminder</title>
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
          .reminder-box {
            background: #e8f5e8;
            border: 2px solid #4CAF50;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
          }
          .reminder-box h3 {
            margin-top: 0;
            color: #2e7d32;
            font-size: 18px;
          }
          .appointment-details {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .detail-item {
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .detail-item:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #495057;
            display: inline-block;
            width: 120px;
          }
          .detail-value {
            color: #212529;
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
          .info-box {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
          }
          .info-box h4 {
            margin-top: 0;
            color: #1976d2;
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
            <h1>⏰ Session Reminder</h1>
          </div>
          <div class="content">
            <h2>Hi ${clientName}!</h2>
            <p>This is a friendly reminder that your coaching session is approaching soon.</p>

            <div class="reminder-box">
              <h3>📅 Your session starts ${timeUntilSession}</h3>
              <p>Don't forget about your upcoming appointment with <strong>${coachName}</strong></p>
            </div>

            <div class="appointment-details">
              <h3>Session Details</h3>
              <div class="detail-item">
                <span class="detail-label">Coach:</span>
                <span class="detail-value">${coachName}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${appointmentDetails.date}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${appointmentDetails.time}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${appointmentDetails.duration || '60 minutes'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${appointmentDetails.type || 'Video Session'}</span>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" class="button">Access Your Dashboard</a>
            </div>

            <div class="info-box">
              <h4>📝 Preparation Tips:</h4>
              <ul>
                <li>Review any notes from your previous session</li>
                <li>Prepare any questions or topics you'd like to discuss</li>
                <li>Ensure you have a stable internet connection for video sessions</li>
                <li>Find a quiet, private space for your session</li>
              </ul>
            </div>

            <p>If you need to reschedule or have any questions, please contact ${coachName} or our support team as soon as possible.</p>

            <p>Looking forward to your session!</p>
            <p><strong>The ACT Coaching For Life Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>ACT Coaching For Life</strong></p>
            <p>© ${new Date().getFullYear()} All rights reserved.</p>
            <p>This email was sent to ${clientEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const coachHtml = clientHtml
      .replace(`Hi ${clientName}!`, `Hi ${coachName}!`)
      .replace(`your coaching session`, `your coaching session with ${clientName}`)
      .replace(`with <strong>${coachName}</strong>`, `with <strong>${clientName}</strong>`)
      .replace(`Coach:</span>\n                <span class="detail-value">${coachName}`, `Client:</span>\n                <span class="detail-value">${clientName}`)
      .replace(`please contact ${coachName}`, `please contact ${clientName}`)
      .replace(`This email was sent to ${clientEmail}`, `This email was sent to ${coachEmail}`);

    const clientText = `
      Session Reminder - ACT Coaching For Life

      Hi ${clientName}!

      This is a reminder that your coaching session is approaching soon.

      Your session starts ${timeUntilSession}

      Session Details:
      - Coach: ${coachName}
      - Date: ${appointmentDetails.date}
      - Time: ${appointmentDetails.time}
      - Duration: ${appointmentDetails.duration || '60 minutes'}
      - Type: ${appointmentDetails.type || 'Video Session'}

      Preparation Tips:
      - Review any notes from your previous session
      - Prepare questions or topics you'd like to discuss
      - Ensure stable internet connection for video sessions
      - Find a quiet, private space for your session

      Access your dashboard: ${loginUrl}

      If you need to reschedule, please contact ${coachName} or our support team.

      Looking forward to your session!
      The ACT Coaching For Life Team
    `;

    const coachText = clientText
      .replace(`Hi ${clientName}!`, `Hi ${coachName}!`)
      .replace(`your coaching session`, `your coaching session with ${clientName}`)
      .replace(`Coach: ${coachName}`, `Client: ${clientName}`)
      .replace(`please contact ${coachName}`, `please contact ${clientName}`);

    // Send to client
    await this.sendEmail({
      to: clientEmail,
      subject: clientSubject,
      text: clientText,
      html: clientHtml
    });

    // Send to coach
    return this.sendEmail({
      to: coachEmail,
      subject: coachSubject,
      text: coachText,
      html: coachHtml
    });
  }
}

const emailService = new EmailService();

// Export the service and individual methods
export default emailService;
export const sendEmail = emailService.sendEmail.bind(emailService);