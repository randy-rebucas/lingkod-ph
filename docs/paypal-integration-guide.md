# PayPal Integration Guide

## Overview

This guide covers the complete PayPal integration implementation in the LocalPro application. The integration provides secure, instant payment processing for booking payments using PayPal's REST API.

## 🚀 Features Implemented

### ✅ Core Features
- **PayPal Order Creation**: Create payment orders via PayPal API
- **Payment Capture**: Capture authorized payments automatically
- **Webhook Handling**: Process PayPal webhook events
- **Payment Verification**: Real-time payment status updates
- **Error Handling**: Comprehensive error handling and retry logic
- **Security**: Proper authentication and validation
- **User Experience**: Seamless payment flow with status updates

### ✅ Technical Features
- **Environment Configuration**: Proper environment variable management
- **Database Integration**: Payment tracking in Firestore
- **Email Notifications**: Automated payment confirmations
- **Admin Integration**: Payment management in admin panel
- **Mobile Responsive**: Works on all device sizes
- **Internationalization**: Multi-language support ready

## 📁 File Structure

```
src/
├── lib/
│   └── paypal-payment-service.ts          # Core PayPal service
├── components/
│   └── paypal-checkout-button.tsx         # PayPal payment component
├── app/
│   ├── api/payments/paypal/
│   │   ├── create/route.ts                # Create PayPal order
│   │   ├── capture/route.ts               # Capture PayPal payment
│   │   └── webhook/route.ts               # Handle PayPal webhooks
│   └── (app)/bookings/[bookingId]/payment/
│       ├── page.tsx                       # Payment page (updated)
│       └── result/page.tsx                # Payment result page
└── scripts/
    └── test-paypal-integration.ts         # Integration test script
```

## 🔧 Configuration

### Environment Variables

Add these to your `.env.local` file:

```bash
# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here

# Optional: PayPal Webhook Configuration
PAYPAL_WEBHOOK_CERT_ID=your_webhook_cert_id_here
```

### PayPal Developer Setup

1. **Create PayPal Developer Account**
   - Visit [PayPal Developer](https://developer.paypal.com/)
   - Create a new application
   - Choose "REST API" integration

2. **Get Credentials**
   - Copy Client ID and Client Secret
   - Use Sandbox credentials for development
   - Use Live credentials for production

3. **Configure Webhooks** (Optional)
   - Set webhook URL: `https://yourdomain.com/api/payments/paypal/webhook`
   - Subscribe to events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

## 🛠️ Usage

### 1. Basic Integration

The PayPal payment button is automatically integrated into the payment page:

```tsx
<PayPalCheckoutButton
  bookingId={booking.id}
  amount={booking.price}
  serviceName={booking.serviceName}
  onPaymentSuccess={() => {
    // Handle successful payment
  }}
  onPaymentError={(error) => {
    // Handle payment error
  }}
/>
```

### 2. Service Usage

```typescript
import { paypalPaymentService } from '@/lib/paypal-payment-service';

// Create payment order
const result = await paypalPaymentService.createOrder({
  amount: 100.00,
  currency: 'PHP',
  bookingId: 'booking_123',
  clientId: 'user_123',
  serviceName: 'House Cleaning',
  returnUrl: 'https://yourapp.com/success',
  cancelUrl: 'https://yourapp.com/cancel'
});

// Capture payment
const capture = await paypalPaymentService.captureOrder(orderId, bookingId);
```

## 🔄 Payment Flow

### 1. Payment Initiation
```
User clicks "Pay with PayPal" → 
PayPal order created → 
User redirected to PayPal → 
User authorizes payment → 
Redirected back to app
```

### 2. Payment Processing
```
Payment result received → 
Order captured → 
Booking status updated → 
Transaction recorded → 
Notifications sent
```

### 3. Database Updates
```
bookings collection:
- status: 'Upcoming'
- paymentVerifiedAt: timestamp
- paymentMethod: 'paypal'
- paypalOrderId: order_id

transactions collection:
- New transaction record
- status: 'completed'
- paymentMethod: 'paypal'

paypalOrders collection:
- Order tracking data
- status: 'COMPLETED'
```

## 🧪 Testing

### 1. Run Integration Test
```bash
npm run test-paypal
```

### 2. Test Payment Flow
1. Create a test booking
2. Navigate to payment page
3. Click "Pay with PayPal"
4. Use PayPal sandbox credentials
5. Complete payment flow
6. Verify booking status update

### 3. Test Webhooks (Optional)
1. Use PayPal webhook simulator
2. Send test events to your webhook endpoint
3. Verify event processing

## 🔒 Security Features

### 1. Authentication
- Firebase token validation
- PayPal API authentication
- Request signature verification

### 2. Validation
- Booking ownership verification
- Payment amount validation
- Order status validation
- Duplicate payment prevention

### 3. Error Handling
- Comprehensive error catching
- User-friendly error messages
- Retry mechanisms
- Logging and monitoring

## 📊 Monitoring

### 1. Payment Analytics
- Success/failure rates
- Payment method usage
- Transaction volumes
- Error tracking

### 2. Admin Dashboard
- Payment verification interface
- Transaction history
- Refund management
- User notifications

## 🚀 Deployment

### 1. Development
```bash
# Set up environment
npm run setup-dev

# Test integration
npm run test-paypal

# Start development server
npm run dev
```

### 2. Production
1. **Update Environment Variables**
   - Use live PayPal credentials
   - Set production webhook URLs
   - Configure proper domains

2. **Deploy Application**
   ```bash
   npm run build
   npm run start
   ```

3. **Configure PayPal**
   - Update webhook URLs
   - Test live transactions
   - Monitor payment flows

## 🔧 Troubleshooting

### Common Issues

1. **PayPal Not Configured**
   - Check environment variables
   - Verify PayPal credentials
   - Run `npm run test-paypal`

2. **Payment Failures**
   - Check PayPal sandbox/live mode
   - Verify webhook configuration
   - Review error logs

3. **Webhook Issues**
   - Verify webhook URL accessibility
   - Check webhook event subscriptions
   - Review webhook signature validation

### Debug Commands
```bash
# Test PayPal configuration
npm run test-paypal

# Validate payment system
npm run validate-payments

# Check environment setup
npm run setup-dev
```

## 📚 API Reference

### PayPal Service Methods

#### `createOrder(paymentRequest)`
Creates a new PayPal payment order.

**Parameters:**
- `amount`: Payment amount (number)
- `currency`: Currency code (string)
- `bookingId`: Booking identifier (string)
- `clientId`: User identifier (string)
- `serviceName`: Service description (string)
- `returnUrl`: Success redirect URL (string)
- `cancelUrl`: Cancel redirect URL (string)

**Returns:**
- `success`: Boolean
- `orderId`: PayPal order ID (string)
- `approvalUrl`: PayPal approval URL (string)
- `error`: Error message (string)

#### `captureOrder(orderId, bookingId)`
Captures an authorized PayPal payment.

**Parameters:**
- `orderId`: PayPal order ID (string)
- `bookingId`: Booking identifier (string)

**Returns:**
- `success`: Boolean
- `transactionId`: PayPal transaction ID (string)
- `payerEmail`: Payer email address (string)
- `error`: Error message (string)

### API Endpoints

#### `POST /api/payments/paypal/create`
Creates a new PayPal payment order.

**Headers:**
- `Authorization`: Bearer token
- `Content-Type`: application/json

**Body:**
```json
{
  "bookingId": "string",
  "returnUrl": "string",
  "cancelUrl": "string"
}
```

#### `POST /api/payments/paypal/capture`
Captures a PayPal payment.

**Headers:**
- `Authorization`: Bearer token
- `Content-Type`: application/json

**Body:**
```json
{
  "bookingId": "string",
  "orderId": "string"
}
```

#### `POST /api/payments/paypal/webhook`
Handles PayPal webhook events.

**Headers:**
- `paypal-transmission-sig`: Webhook signature
- `paypal-cert-id`: Certificate ID
- `paypal-auth-algo`: Authentication algorithm
- `paypal-transmission-id`: Transmission ID
- `paypal-transmission-time`: Transmission time

## 🎯 Best Practices

### 1. Security
- Always validate PayPal responses
- Use HTTPS in production
- Implement proper error handling
- Log all payment activities

### 2. User Experience
- Provide clear payment instructions
- Show payment status updates
- Handle errors gracefully
- Send confirmation emails

### 3. Monitoring
- Track payment success rates
- Monitor error patterns
- Set up alerts for failures
- Regular security audits

## 📞 Support

### PayPal Resources
- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal REST API Reference](https://developer.paypal.com/docs/api/overview/)
- [PayPal Webhook Guide](https://developer.paypal.com/docs/api/webhooks/)

### LocalPro Support
- Check application logs
- Review error messages
- Test with sandbox credentials
- Contact development team

---

## 🎉 Conclusion

The PayPal integration is now fully functional and ready for production use. It provides a secure, reliable payment processing solution that integrates seamlessly with the LocalPro booking system.

**Key Benefits:**
- ✅ Instant payment confirmation
- ✅ Secure payment processing
- ✅ Comprehensive error handling
- ✅ Mobile-responsive design
- ✅ Admin management tools
- ✅ Email notifications
- ✅ Webhook support
- ✅ Production-ready

The integration follows PayPal's best practices and provides a smooth user experience for both clients and administrators.
