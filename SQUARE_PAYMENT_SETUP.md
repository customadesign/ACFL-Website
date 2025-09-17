# Square Payment Integration Setup Guide

This guide covers the complete setup and implementation of Square payments in the ACT Coaching platform.

## Overview

The Square payment integration provides:
- **Authorization/Capture Flow**: Payments are authorized when booking, captured after session completion
- **Modern UI/UX**: Clean, responsive payment forms built with Square Web Payments SDK
- **Admin Management**: Comprehensive payment management interface for coaches and admins
- **Security**: PCI-compliant payment processing with Square's secure infrastructure

## Architecture

### Backend Integration
- **Square API**: Payment processing using Square's REST API
- **Database**: Payment records stored in Supabase with full audit trail
- **Webhooks**: Real-time payment status updates from Square
- **Service Layer**: `PaymentServiceV2` handles all payment operations

### Frontend Integration
- **Square Web Payments SDK**: Modern payment form components
- **React Components**: Reusable payment UI components
- **Next.js Pages**: Success/failure redirect pages
- **TypeScript**: Full type safety for payment operations

## Setup Instructions

### 1. Square Account Setup

1. **Create Square Developer Account**
   - Visit [Square Developer Portal](https://developer.squareup.com/)
   - Create an account and verify your identity
   - Create a new application for your coaching platform

2. **Get Square Credentials**
   - **Application ID**: Found in your Square application dashboard
   - **Location ID**: Your business location ID (found in Square dashboard)
   - **Access Token**: For backend API calls (sandbox and production)

### 2. Environment Configuration

#### Frontend (.env)
```bash
# Square Configuration
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-YOUR_APP_ID
NEXT_PUBLIC_SQUARE_LOCATION_ID=YOUR_LOCATION_ID
NEXT_PUBLIC_SQUARE_ENVIRONMENT=sandbox
```

#### Backend (.env)
```bash
# Square Configuration
SQUARE_APPLICATION_ID=sq0idp-YOUR_APP_ID
SQUARE_ACCESS_TOKEN=EAAAEYour_sandbox_access_token
SQUARE_LOCATION_ID=YOUR_LOCATION_ID
SQUARE_ENVIRONMENT=sandbox
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_signature_key
```

### 3. Database Migration

The database migration has been completed with these key tables:
- `payments`: Core payment records with Square integration
- `payment_logs`: Audit trail for all payment events
- `refunds`: Refund processing records
- `coach_rates`: Session pricing and rate management

### 4. Component Usage

#### Basic Payment Flow
```typescript
import SquareBookingFlow from '@/components/payments/SquareBookingFlow';

<SquareBookingFlow
  coachId="coach-id"
  selectedDate="2024-01-15"
  selectedTime="14:00"
  onBookingComplete={(result) => {
    console.log('Booking completed:', result);
  }}
/>
```

#### Payment Form Only
```typescript
import SquarePaymentForm from '@/components/payments/SquarePaymentForm';
import SquareProvider from '@/components/payments/SquareProvider';

<SquareProvider>
  <SquarePaymentForm
    amount={5000} // $50.00 in cents
    coachName="John Doe"
    sessionTitle="1-on-1 Coaching Session"
    coachId="coach-id"
    coachRateId="rate-id"
    onSuccess={(result) => {
      console.log('Payment authorized:', result);
    }}
  />
</SquareProvider>
```

#### Payment Management (Admin)
```typescript
import PaymentManagement from '@/components/payments/PaymentManagement';

<PaymentManagement
  isAdmin={true}
  onCapturePayment={handleCapturePayment}
  onRefundPayment={handleRefundPayment}
/>
```

## Payment Flow

### 1. Authorization Phase
1. Client selects session and enters payment details
2. Square Web SDK tokenizes payment information
3. Backend creates authorization-only payment
4. Session is booked with authorized payment
5. Client receives booking confirmation

### 2. Capture Phase (After Session)
1. Coach marks session as completed
2. Admin or automated system captures payment
3. Funds are transferred to coach (minus platform fee)
4. Client is charged and receives receipt

### 3. Cancellation/Refund
1. Authorized payments can be cancelled (voided)
2. Captured payments can be refunded (partial or full)
3. Refund distribution follows platform policies

## API Endpoints

### Payment Operations
- `POST /api/payments/create-payment-authorization` - Create payment authorization
- `POST /api/payments/capture-payment/:paymentId` - Capture authorized payment
- `POST /api/payments/cancel-authorization/:paymentId` - Cancel authorization
- `POST /api/payments/refunds` - Create refund

### Management Endpoints
- `GET /api/payments` - List payments (user-specific)
- `GET /api/admin/payments` - List all payments (admin)
- `GET /api/payments/summary` - Payment statistics
- `POST /api/payments/webhook/square` - Square webhook handler

## UI Components

### Core Components
- **SquareProvider**: Square Web SDK context provider
- **SquarePaymentForm**: Payment form with card input
- **SquareBookingFlow**: Complete booking flow with payments
- **PaymentStatusBadge**: Status indicator component
- **PaymentDetails**: Detailed payment information display
- **PaymentManagement**: Admin payment management interface

### Status Management
Payment statuses are clearly indicated throughout the UI:
- 🔵 **Authorized**: Payment method authorized, pending capture
- 🟢 **Succeeded**: Payment completed successfully
- 🔴 **Failed**: Payment failed or declined
- 🟡 **Pending**: Payment processing in progress
- 🟣 **Refunded**: Payment refunded to customer
- ⚫ **Cancelled**: Authorization cancelled before capture

## Security Considerations

### PCI Compliance
- Square handles all sensitive payment data
- No card information is stored on your servers
- Payment tokens are used for all operations

### Data Protection
- Payment logs maintain audit trail
- Personal information is encrypted
- Access controls restrict payment operations

### Webhook Security
- Square webhook signatures are verified
- Events are validated before processing
- Duplicate events are handled gracefully

## Testing

### Sandbox Testing
Square provides test cards for various scenarios:
- **Success**: 4111 1111 1111 1111
- **Decline**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 9995

### Test Scenarios
1. **Successful Authorization**: Complete booking flow
2. **Payment Decline**: Handle failed payments gracefully
3. **Cancellation**: Test authorization cancellation
4. **Capture**: Test post-session payment capture
5. **Refunds**: Test partial and full refunds

## Monitoring & Analytics

### Payment Metrics
- Authorization success rates
- Capture completion rates
- Refund frequency and amounts
- Coach earnings and platform fees

### Error Tracking
- Payment failures are logged with details
- Square API errors are captured and reported
- User experience issues are tracked

## Production Deployment

### 1. Square Production Setup
1. Switch to production Square application
2. Update environment variables
3. Verify webhook endpoints
4. Test with real payment methods

### 2. Go-Live Checklist
- [ ] Production Square credentials configured
- [ ] Webhook endpoints verified
- [ ] SSL certificates valid
- [ ] Payment forms tested
- [ ] Error handling validated
- [ ] Monitoring enabled

## Support & Troubleshooting

### Common Issues
1. **Invalid Application ID**: Check Square application configuration
2. **Location ID Missing**: Ensure location is properly set up
3. **Webhook Failures**: Verify signature validation
4. **Payment Declines**: Check card information and bank settings

### Support Resources
- Square Developer Documentation: https://developer.squareup.com/docs
- Square API Reference: https://developer.squareup.com/reference/square
- ACT Platform Support: Contact your development team

## Migration from Stripe

The platform maintains Stripe components for backward compatibility:
- Existing Stripe integrations continue to work
- New implementations should use Square
- Gradual migration path available
- Both payment methods can coexist

### Migration Steps
1. Enable Square payments for new coaches
2. Migrate existing coaches gradually
3. Update booking flows to use Square
4. Phase out Stripe components when ready

This integration provides a robust, secure, and user-friendly payment experience that supports the platform's coaching business model with authorization/capture flow and comprehensive management tools.