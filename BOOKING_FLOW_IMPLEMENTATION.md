# New Booking Flow Implementation

## Overview

This implementation provides a coach-controlled pricing flow with immediate payments, replacing the previous authorization/capture model. The new flow ensures coaches have full control over pricing and clients pay immediately upon coach acceptance.

## Business Flow

### 1. Client Request Phase
1. **Client submits booking request** using `BookingRequestForm.tsx`
   - Selects session type, duration, preferred date/time
   - Provides notes and area of focus
   - No payment required at this stage

2. **System creates booking request** via `BookingService.createBookingRequest()`
   - Status: `pending`
   - Expires in 24 hours if coach doesn't respond
   - Coach receives notification

### 2. Coach Review Phase
1. **Coach views pending requests** in `BookingRequestManager.tsx`
   - See all client details and preferences
   - Can adjust pricing based on requirements
   - Can use existing rates or set custom price

2. **Coach accepts with final pricing** via `BookingService.acceptBookingRequest()`
   - Sets final price (coach has full control)
   - Can add notes for client
   - Status changes to `payment_required`
   - Client has 2 hours to complete payment

3. **Coach can reject** via `BookingService.rejectBookingRequest()`
   - Status changes to `rejected`
   - Client receives notification with reason

### 3. Client Payment Phase
1. **Client receives notification** about coach acceptance
   - Shows final price set by coach
   - Payment deadline (2 hours)
   - Direct link to payment page

2. **Client completes immediate payment** using `BookingPaymentInterface.tsx`
   - Uses Square immediate payment (not authorization)
   - Full amount charged immediately
   - No capture step needed

3. **Payment processed** via `SquarePaymentService.processImmediatePayment()`
   - Creates session/appointment record
   - Status changes to `paid_confirmed`
   - Both parties receive confirmation

## Technical Architecture

### Backend Services

#### `BookingService`
- Manages the complete booking lifecycle
- Handles request creation, acceptance, rejection, and payment processing
- Integrates with Square for immediate payments
- Creates session records upon successful payment

#### `SquarePaymentService`
- Processes immediate payments (no authorization/capture)
- Handles refunds for completed payments
- Manages Square customer records
- Logs all payment events

#### `BookingNotificationService`
- Sends notifications for all booking events
- Supports email, push, and real-time notifications
- Handles payment reminders and expiration cleanup

### Frontend Components

#### Coach Interface
- **`BookingRequestManager.tsx`**: View and manage incoming booking requests
  - Display client details and preferences
  - Set custom pricing or use existing rates
  - Accept/reject with notes

#### Client Interface
- **`BookingRequestForm.tsx`**: Submit new booking requests
  - Select session details and preferences
  - No payment required at submission

- **`BookingPaymentInterface.tsx`**: Complete payment for accepted bookings
  - View final pricing set by coach
  - Process immediate payment
  - Track booking status

#### Payment Components
- **`SquarePaymentForm.tsx`**: Updated to support both authorization and immediate payment
- **`SquareImmediatePaymentForm.tsx`**: Dedicated component for immediate payments

### Database Schema

#### `booking_requests` Table
```sql
- id (uuid, primary key)
- client_id (uuid, foreign key)
- coach_id (uuid, foreign key)
- session_type (enum: individual, group, package)
- duration_minutes (integer)
- preferred_date (date, optional)
- preferred_time (time, optional)
- notes (text, optional)
- area_of_focus (text, optional)
- status (enum: pending, coach_accepted, payment_required, paid_confirmed, rejected, cancelled, expired)
- coach_adjusted_price_cents (integer, optional)
- coach_rate_id (uuid, optional)
- coach_notes (text, optional)
- payment_deadline (timestamp, optional)
- created_at (timestamp)
- updated_at (timestamp)
- expires_at (timestamp)
```

#### `booking_events` Table
```sql
- id (uuid, primary key)
- booking_request_id (uuid, foreign key)
- event_type (enum: request_created, coach_accepted, coach_rejected, payment_completed, booking_confirmed)
- actor_type (enum: client, coach, system)
- actor_id (uuid)
- details (jsonb)
- created_at (timestamp)
```

## API Endpoints

### Client Endpoints
- `POST /api/bookings/request` - Create booking request
- `GET /api/bookings/client/requests` - Get client's booking requests
- `GET /api/bookings/client/requests/:id` - Get specific booking request
- `POST /api/bookings/client/requests/:id/pay` - Process payment for accepted booking

### Coach Endpoints
- `GET /api/bookings/coach/pending` - Get pending booking requests
- `GET /api/bookings/coach/requests/:id` - Get specific booking request
- `POST /api/bookings/coach/requests/:id/accept` - Accept booking with pricing
- `POST /api/bookings/coach/requests/:id/reject` - Reject booking request

### Admin Endpoints
- `POST /api/bookings/admin/refunds` - Create refund
- `POST /api/bookings/webhooks/square` - Square webhook handler

## Key Features

### Coach Pricing Control
- Coaches can adjust pricing for each booking request
- Can use existing rates or set custom prices
- Full transparency with clients about final pricing

### Immediate Payment
- No authorization/capture complexity
- Payment processed immediately upon coach acceptance
- Reduces payment failures and disputes

### Status Progression
- Clear status tracking: `pending` → `payment_required` → `paid_confirmed`
- Automatic expiration handling
- Comprehensive audit trail

### Notification System
- Real-time notifications for all status changes
- Email and push notification support
- Payment reminders and deadline management

### Error Handling
- Comprehensive error handling for payment failures
- Automatic cleanup of expired requests
- Refund support for completed payments

## Benefits Over Previous System

1. **Coach Control**: Coaches can set pricing based on specific client needs
2. **Immediate Payment**: No complex authorization/capture flow
3. **Clear Status**: Transparent booking progression for both parties
4. **Better UX**: Simplified payment flow with immediate confirmation
5. **Reduced Complexity**: Eliminates capture timing issues
6. **Audit Trail**: Complete tracking of all booking events

## Usage Examples

### For Clients
1. Browse coaches and click "Request Session"
2. Fill out `BookingRequestForm` with preferences
3. Wait for coach response (notification sent)
4. Complete payment when coach accepts
5. Session confirmed immediately after payment

### For Coaches
1. Receive notification of new booking request
2. Review client details in `BookingRequestManager`
3. Set final pricing and accept/reject
4. Client receives payment notification
5. Session confirmed when client pays

This implementation provides a streamlined, coach-controlled booking experience with immediate payment processing and comprehensive notification support.