# Square Payment Integration Guide

## Overview
Your ACT Coaching For Life application has been successfully integrated with Square payments. This integration supports authorization/capture flow for coaching sessions, allowing payments to be authorized before sessions and captured after completion.

## 🔧 Configuration

### Environment Variables
The following Square credentials have been configured in your `.env` file:

```env
# Square Configuration
SQUARE_ACCESS_TOKEN=EAAAlzwDUpXGtjvt_lBalsCtMx-MzEpCYqReOs6EKqC35J1WHfthRA6FaoILS1QD
SQUARE_APPLICATION_ID=sq0idp-3D-KDdMJ7gn58W9ZevfE6g
SQUARE_ENVIRONMENT=sandbox
SQUARE_WEBHOOK_SECRET=your-square-webhook-secret
```

**⚠️ Important**: These are sandbox credentials. For production, you'll need to:
1. Update `SQUARE_ENVIRONMENT=production`
2. Replace with production access token
3. Update webhook secret

### Square Dashboard Configuration
1. Go to [Square Developer Console](https://developer.squareup.com/console/en/apps/sq0idp-3D-KDdMJ7gn58W9ZevfE6g)
2. Configure webhooks endpoint: `https://your-domain.com/api/payments/webhook/square`
3. Enable these webhook events:
   - `payment.created`
   - `payment.updated`
   - `refund.created`
   - `refund.updated`

## 📊 Database Changes Required

Run the following SQL migration in your Supabase database:

```sql
-- Add Square customer ID to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS square_customer_id VARCHAR;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_square_customer_id ON clients (square_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_square_payment_id ON payments (stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_refunds_square_refund_id ON refunds (stripe_refund_id);

-- Add comments to clarify the new field usage
COMMENT ON COLUMN clients.square_customer_id IS 'Square customer ID for payment processing';
COMMENT ON COLUMN payments.stripe_payment_intent_id IS 'Square payment ID (formerly Stripe payment intent ID)';
COMMENT ON COLUMN payments.stripe_customer_id IS 'Square customer ID (formerly Stripe customer ID)';
COMMENT ON COLUMN refunds.stripe_refund_id IS 'Square refund ID (formerly Stripe refund ID)';
```

## 🔄 Payment Flow

### 1. Authorization (Before Session)
```http
POST /api/payments/create-payment-authorization
Content-Type: application/json
Authorization: Bearer <client-token>

{
  "coach_id": "uuid",
  "coach_rate_id": "uuid",
  "sourceId": "cnon:card-nonce-from-square-form",
  "description": "Coaching Session Payment",
  "metadata": {
    "session_date": "2024-01-15",
    "session_time": "10:00"
  }
}
```

**Response:**
```json
{
  "payment_intent_id": "square_payment_id",
  "client_secret": "receipt_url",
  "amount_cents": 10000,
  "payment_id": "uuid"
}
```

### 2. Capture (After Session)
```http
POST /api/payments/capture-payment/:paymentId
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "session_id": "uuid" // optional
}
```

### 3. Cancel Authorization
```http
POST /api/payments/cancel-authorization/:paymentId
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "reason": "Session cancelled by coach"
}
```

## 🎨 Frontend Integration

### Square Web Payments SDK
Include the Square Web Payments SDK in your frontend:

```html
<script type="application/javascript" src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
```

### Example Payment Form
```javascript
async function initializeSquarePayments() {
  const payments = Square.payments(appId, locationId);

  const card = await payments.card();
  await card.attach('#card-container');

  // Handle payment submission
  const handlePayment = async () => {
    const tokenResult = await card.tokenize();
    if (tokenResult.status === 'OK') {
      // Send tokenResult.token as sourceId to your backend
      const response = await fetch('/api/payments/create-payment-authorization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          coach_id: selectedCoachId,
          coach_rate_id: selectedRateId,
          sourceId: tokenResult.token,
          description: 'Coaching Session Payment'
        })
      });

      const result = await response.json();
      // Handle result
    }
  };
}
```

## 🚀 Testing

### 1. Run Integration Test
```bash
cd backend
node test-square-integration.js
```

### 2. Test Card Numbers (Sandbox)
- **Success**: `4111 1111 1111 1111`
- **Decline**: `4000 0000 0000 0002`
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### 3. API Endpoints
All endpoints are available at:
- Create Authorization: `POST /api/payments/create-payment-authorization`
- Capture Payment: `POST /api/payments/capture-payment/:paymentId`
- Cancel Authorization: `POST /api/payments/cancel-authorization/:paymentId`
- Webhooks: `POST /api/payments/webhook/square`

## 🔒 Security Features

1. **PCI Compliance**: Square handles card data tokenization
2. **Webhook Verification**: Implement webhook signature verification
3. **Idempotency**: All payment requests use idempotency keys
4. **Authorization Only**: Cards are authorized but not charged until session completion

## 📈 Key Features Implemented

✅ **Authorization/Capture Flow**: Payments authorized before sessions, captured after
✅ **Customer Management**: Automatic Square customer creation and reuse
✅ **Refund Support**: Full and partial refunds with Square API
✅ **Webhook Handling**: Real-time payment status updates
✅ **Error Handling**: Comprehensive error handling and logging
✅ **Database Integration**: Seamless Supabase integration
✅ **TypeScript Support**: Full type safety with Square SDK

## 🐛 Troubleshooting

### Common Issues
1. **"Invalid access token"**: Check your Square credentials in `.env`
2. **"Location not found"**: Verify your Square account has active locations
3. **"Card nonce invalid"**: Ensure you're using the correct Square Web SDK

### Logs
Payment events are logged in the `payment_logs` table with detailed information.

## 📞 Support

- **Square Documentation**: https://developer.squareup.com/docs
- **Sandbox Testing**: https://developer.squareup.com/docs/testing/test-values
- **Webhook Testing**: Use ngrok for local webhook testing

---

**Status**: ✅ Integration Complete and Tested
**Environment**: 🧪 Sandbox (Ready for Production)
**Last Updated**: 2024-09-17