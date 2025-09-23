# SMTP Email Configuration

The email service has been updated to use SMTP instead of Resend. You need to configure the following environment variables in your `.env` file:

## Required Environment Variables

Add these to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password

# Optional: Custom sender name and email
SMTP_FROM_NAME=ACT Coaching For Life
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

## Common SMTP Providers

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
```

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
```

## Security Notes

1. **App Passwords**: For Gmail and Yahoo, you'll need to use app-specific passwords instead of your regular password.

2. **Two-Factor Authentication**: If you have 2FA enabled on your email account, you must use app passwords.

3. **SSL/TLS**:
   - Port 587 with `SMTP_SECURE=false` uses STARTTLS
   - Port 465 with `SMTP_SECURE=true` uses SSL/TLS
   - Port 25 is usually blocked by most providers

## Testing

The email service will automatically check if all required environment variables are configured. If not configured properly, you'll see a warning message in the console, and emails will be logged instead of sent.

## Features Supported

- ✅ HTML and plain text emails
- ✅ Email attachments (for invoice PDFs)
- ✅ CC/BCC support
- ✅ Custom sender name and email
- ✅ Error handling and logging
- ✅ Automatic fallback when not configured

## Changes Made

1. **Removed Resend Dependencies**:
   - Removed `resend` package from package.json
   - Removed all Resend imports and API calls

2. **Consolidated Email Services**:
   - Updated `emailService.ts` to use nodemailer with SMTP
   - Removed duplicate `smtpEmailService.ts` file
   - Updated `staffInvitationController.ts` to use main email service

3. **Maintained Functionality**:
   - All existing email templates and functionality preserved
   - Invoice PDF email attachments still work
   - Staff invitation emails continue to work
   - All coach application emails remain functional

4. **Improved Configuration**:
   - Unified SMTP configuration across all email features
   - Added proper error handling and validation
   - Fallback logging when SMTP is not configured

## Affected Features

All these features now use SMTP instead of Resend:
- ✅ Invoice generation and email delivery
- ✅ Staff invitation emails
- ✅ Coach application confirmation/approval/rejection emails
- ✅ Password reset emails
- ✅ Welcome emails for new users
- ✅ Appointment confirmation emails

The application will work exactly the same way from a user perspective, but now uses your SMTP configuration instead of Resend API.