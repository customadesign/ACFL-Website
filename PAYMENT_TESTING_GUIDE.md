# Payment Testing Guide - Square Sandbox

Your application is configured to use **Square Sandbox (Test Mode)**, which means you can test payments without using real money or your actual bank account.

## ✅ Current Configuration
- **Frontend**: `NEXT_PUBLIC_SQUARE_ENVIRONMENT=sandbox`
- **Backend**: `SQUARE_ENVIRONMENT=sandbox`
- **Status**: ✅ Ready for testing (No real charges!)

---

## 🧪 Test Credit Card Numbers

Use these test cards provided by Square:

### **Successful Payments**
| Card Type | Card Number | CVV | Expiry | ZIP |
|-----------|-------------|-----|--------|-----|
| **Visa** | `4111 1111 1111 1111` | `123` | `12/25` | `12345` |
| **Mastercard** | `5105 1051 0510 5100` | `123` | `12/25` | `12345` |
| **Amex** | `3782 822463 10005` | `1234` | `12/25` | `12345` |
| **Discover** | `6011 0000 0000 0004` | `123` | `12/25` | `12345` |

### **Failed/Declined Payments**
| Card Type | Card Number | CVV | Expiry | Result |
|-----------|-------------|-----|--------|--------|
| **Generic Decline** | `4000 0000 0000 0002` | `123` | `12/25` | Card Declined |
| **Insufficient Funds** | `4000 0000 0000 9995` | `123` | `12/25` | Insufficient Funds |
| **Invalid CVV** | `4111 1111 1111 1111` | `111` | `12/25` | CVV Mismatch |

---

## 📝 Test Card Details

For all test cards:
- **Cardholder Name**: Any name (e.g., "Test User")
- **CVV**: Any 3 digits for Visa/MC/Discover, 4 digits for Amex
- **Expiration Date**: Any future date (e.g., 12/25, 06/26)
- **ZIP Code**: Any 5 digits (e.g., 12345)

---

## 🎯 Testing Scenarios

### **1. Successful Payment**
1. Navigate to booking/payment page
2. Use card: `4111 1111 1111 1111`
3. CVV: `123`, Expiry: `12/25`, ZIP: `12345`
4. Complete payment
5. ✅ Verify payment success message
6. ✅ Check appointment is created
7. ✅ Check confirmation email (if configured)

### **2. Declined Payment**
1. Navigate to booking/payment page
2. Use card: `4000 0000 0000 0002`
3. CVV: `123`, Expiry: `12/25`, ZIP: `12345`
4. Complete payment
5. ❌ Verify error message appears
6. ✅ Check no charge was created
7. ✅ Check no appointment was created

### **3. Payment with Different Card Types**
Test with all card types (Visa, Mastercard, Amex, Discover) to ensure compatibility.

### **4. Refund Testing**
1. Make a successful test payment
2. Go to Square Dashboard → Transactions
3. Find the test transaction
4. Issue a refund
5. ✅ Verify refund appears in your system

---

## 🌐 View Test Payments

### **Square Dashboard**
1. Go to: https://squareup.com/dashboard
2. **Switch to Sandbox mode** (toggle in top-right corner)
3. Navigate to **Transactions**
4. View all test payments (marked with "Test Mode" badge)

### **In Your Application**
- Check database `payments` table for test payment records
- Check `appointments` table to verify bookings
- Check backend logs for payment processing details

---

## 🔄 Switching to Production

⚠️ **When ready to accept real payments**, update these environment variables:

### **Frontend (.env)**
```env
NEXT_PUBLIC_SQUARE_ENVIRONMENT=production
NEXT_PUBLIC_SQUARE_APPLICATION_ID=<your-production-app-id>
NEXT_PUBLIC_SQUARE_LOCATION_ID=<your-production-location-id>
```

### **Backend (.env)**
```env
SQUARE_ENVIRONMENT=production
SQUARE_ACCESS_TOKEN=<your-production-access-token>
SQUARE_APPLICATION_ID=<your-production-app-id>
SQUARE_LOCATION_ID=<your-production-location-id>
```

---

## 🚨 Important Notes

1. **Test cards ONLY work in sandbox** - Real cards will be declined
2. **Real cards DON'T work in sandbox** - Use test cards only
3. **No real money is charged** in sandbox mode
4. **Test data can be cleared** anytime in Square Dashboard
5. **Always test thoroughly** before switching to production

---

## 📞 Support

- **Square Sandbox Docs**: https://developer.squareup.com/docs/testing/sandbox
- **Square Test Cards**: https://developer.squareup.com/docs/devtools/sandbox/payments
- **Square Support**: https://squareup.com/help

---

## ✅ Quick Test Checklist

- [ ] Test successful payment with Visa
- [ ] Test successful payment with Mastercard
- [ ] Test declined payment
- [ ] Test insufficient funds scenario
- [ ] Verify payment appears in Square Dashboard
- [ ] Verify appointment is created in database
- [ ] Test refund process
- [ ] Check email notifications (if configured)
- [ ] Test on different browsers
- [ ] Test on mobile devices

---

**Happy Testing! 🎉**
