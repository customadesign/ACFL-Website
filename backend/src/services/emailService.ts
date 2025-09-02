import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@linkage-va-hub.com';

interface EmailData {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateData?: Record<string, any>;
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
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!process.env.RESEND_API_KEY;
    
    if (!this.isConfigured) {
      console.warn('Resend API key not configured. Email notifications will be disabled.');
    }
  }

  async sendEmail({ to, subject, text, html, templateData = {} }: EmailData) {
    if (!this.isConfigured) {
      console.log('Email service not configured. Would have sent:', { to, subject });
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const emailData = {
        from: `${process.env.RESEND_FROM_NAME || 'ACT Coaching For Life'} <${FROM_EMAIL}>`,
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        text: text,
        html: html,
      };

      console.log('Attempting to send email with Resend:', {
        to: emailData.to,
        from: emailData.from,
        subject: emailData.subject,
        hasApiKey: !!process.env.RESEND_API_KEY,
        apiKeyLength: process.env.RESEND_API_KEY?.length
      });

      const { data, error } = await resend.emails.send(emailData);
      
      if (error) {
        console.error('Resend error:', error);
        return { 
          success: false, 
          error: error.message || 'Email sending failed',
          details: error
        };
      }
      
      console.log('Email sent successfully to:', to);
      console.log('Resend response:', data);
      return { success: true, messageId: data.id };
    } catch (error: any) {
      console.error('Email sending failed:', error);
      
      // Return detailed error for debugging
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
}

export default new EmailService();