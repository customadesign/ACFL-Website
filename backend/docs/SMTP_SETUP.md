# SMTP Email Configuration

## Overview
The application uses SMTP to send user credentials when administrators create new users. The email service is configured to work with the Linkage mail server.

## Configuration

### Environment Variables
Add the following to your `.env` file:

```env
# SMTP Configuration for sending user credentials
SMTP_HOST=mail.linkage.ph
SMTP_PORT=465
SMTP_USER=gabriel.maturan@linkage.ph
SMTP_PASSWORD=your-email-password-here
SMTP_FROM_NAME=ACT Coaching For Life
```

### SMTP Server Details
- **Host**: mail.linkage.ph
- **Port**: 465 (SSL/TLS)
- **Authentication**: Required
- **Security**: SSL/TLS enabled

## Features

### 1. Automatic Credential Email
When an admin creates a new user (client, coach, or staff):
- A secure password is automatically generated if not provided
- Credentials are sent via email to the user
- Email includes login instructions and security tips

### 2. Password Generation
- Automatic generation of secure 12-character passwords
- Includes uppercase, lowercase, numbers, and special characters
- Passwords are hashed before storage using bcrypt

### 3. Email Templates
Professional HTML email templates include:
- User credentials with temporary password
- Login URL
- Security recommendations
- Instructions to change password on first login

## API Endpoints

### Create User with Email
```http
POST /api/admin/users
Authorization: Bearer [admin-token]
Content-Type: application/json

{
  "userType": "client",
  "userData": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "password": "optional-custom-password"
  }
}
```

### Test Email Configuration
```http
POST /api/admin/test-email
Authorization: Bearer [admin-token]
Content-Type: application/json

{
  "testEmail": "test@example.com"
}
```

## Email Service Implementation

### Files
- `/backend/src/services/smtpEmailService.ts` - SMTP email service
- `/backend/src/utils/passwordGenerator.ts` - Password generation utilities
- `/backend/src/routes/adminRoutes.ts` - Admin API endpoints

### Usage Example
```typescript
import smtpEmailService from '../services/smtpEmailService';

// Send user credentials
await smtpEmailService.sendUserCredentials({
  email: 'user@example.com',
  password: 'temporaryPassword123',
  firstName: 'John',
  lastName: 'Doe',
  role: 'client'
});
```

## Security Considerations

1. **Password Storage**: All passwords are hashed using bcrypt with 12 rounds
2. **Temporary Passwords**: Users are prompted to change passwords on first login
3. **Email Security**: Uses SSL/TLS for secure email transmission
4. **No Plain Text**: Passwords are never stored or logged in plain text

## Troubleshooting

### Email Not Sending
1. Check SMTP credentials in `.env` file
2. Verify SMTP_PASSWORD is set correctly
3. Check server logs for connection errors
4. Test with the `/api/admin/test-email` endpoint

### Connection Issues
- Ensure port 465 is not blocked by firewall
- Verify SSL/TLS certificate acceptance
- Check network connectivity to mail.linkage.ph

### Authentication Failures
- Verify email account password
- Ensure account has SMTP access enabled
- Check for any account security restrictions

## Testing

1. Set up environment variables
2. Start the backend server
3. Use the test endpoint to verify configuration:
```bash
curl -X POST http://localhost:3001/api/admin/test-email \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"testEmail": "your-test-email@example.com"}'
```

## Support

For issues with the mail server configuration, contact:
- Email: gabriel.maturan@linkage.ph
- SMTP Support: Linkage IT Support