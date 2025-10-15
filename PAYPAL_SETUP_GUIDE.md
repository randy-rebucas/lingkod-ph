# PayPal Integration Setup Guide

This guide will help you configure PayPal payments for Localpro. The system supports both one-time payments and recurring subscriptions.

## 🚀 Quick Start

### 1. PayPal Developer Account Setup

1. **Create PayPal Developer Account**
   - Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
   - Sign in with your PayPal account or create a new one
   - Complete the developer account verification

2. **Create Application**
   - Click "Create App" in the dashboard
   - Choose "Default Application" or "Custom Application"
   - Select "Sandbox" for testing or "Live" for production
   - Note down your Client ID and Client Secret

### 2. Environment Configuration

Add the following environment variables to your `.env.local` file:

```env
# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_WEBHOOK_CERT_ID=your-paypal-webhook-cert-id
```

### 3. Webhook Configuration

1. **Create Webhook**
   - In PayPal Developer Dashboard, go to "Webhooks"
   - Click "Create Webhook"
   - Set webhook URL: `https://yourdomain.com/api/payments/paypal/webhook`
   - Select events:
     - `PAYMENT.CAPTURE.COMPLETED`
     - `PAYMENT.CAPTURE.DENIED`
     - `PAYMENT.CAPTURE.REFUNDED`
     - `CHECKOUT.ORDER.APPROVED`
     - `BILLING.SUBSCRIPTION.ACTIVATED`
     - `BILLING.SUBSCRIPTION.CANCELLED`

2. **Get Webhook Certificate ID**
   - After creating the webhook, copy the Certificate ID
   - Add it to your environment variables as `PAYPAL_WEBHOOK_CERT_ID`

## 📋 Features Implemented

### ✅ One-Time Payments
- **PayPal Checkout Button**: Integrated in payment pages
- **Payment Creation**: API endpoint for creating PayPal orders
- **Payment Capture**: API endpoint for capturing payments
- **Payment Result Page**: Handles success/failure/cancellation
- **Webhook Processing**: Real-time payment status updates

### ✅ Recurring Subscriptions
- **PayPal Subscription Button**: For recurring billing
- **Subscription Creation**: API endpoint for creating subscriptions
- **Subscription Activation**: API endpoint for activating subscriptions
- **Subscription Management**: Handle subscription lifecycle events

### ✅ Security & Validation
- **Webhook Signature Verification**: Validates incoming webhooks
- **Environment Validation**: Checks configuration completeness
- **Error Handling**: Comprehensive error handling and logging
- **Audit Trail**: Webhook events stored for debugging

## 🔧 API Endpoints

### Payment Endpoints
- `POST /api/payments/paypal/create` - Create PayPal order
- `POST /api/payments/paypal/capture` - Capture PayPal payment
- `POST /api/payments/paypal/webhook` - Handle PayPal webhooks

### Subscription Endpoints
- `POST /api/payments/paypal/subscription/create` - Create subscription
- `POST /api/payments/paypal/subscription/activate` - Activate subscription

## 🎨 UI Components

### PayPalCheckoutButton
```tsx
<PayPalCheckoutButton
  bookingId="booking-123"
  amount={100.00}
  serviceName="Service Name"
  onPaymentSuccess={(transactionId) => {
    // Handle successful payment
  }}
  onPaymentError={(error) => {
    // Handle payment error
  }}
/>
```

### PayPalSubscriptionButton
```tsx
<PayPalSubscriptionButton
  planId="plan-123"
  planName="Premium Plan"
  amount={29.99}
  billingCycle="monthly"
  onSubscriptionSuccess={(subscriptionId) => {
    // Handle successful subscription
  }}
  onSubscriptionError={(error) => {
    // Handle subscription error
  }}
/>
```

## 🧪 Testing

### 1. Run Integration Test
```bash
npm run test:paypal
# or
yarn test:paypal
```

### 2. Test with PayPal Sandbox
1. Use PayPal sandbox credentials
2. Create test PayPal accounts in sandbox
3. Test payment flows with sandbox accounts
4. Verify webhook events are received

### 3. Test Scenarios
- ✅ Successful payment
- ✅ Failed payment
- ✅ Cancelled payment
- ✅ Successful subscription
- ✅ Failed subscription
- ✅ Webhook processing

## 🚀 Production Deployment

### 1. Switch to Live Environment
1. Update environment variables with live PayPal credentials
2. Change webhook URL to production domain
3. Update PayPal application settings to "Live"

### 2. Security Checklist
- ✅ Use HTTPS for all webhook URLs
- ✅ Implement proper webhook signature verification
- ✅ Store sensitive credentials securely
- ✅ Enable PayPal fraud protection
- ✅ Monitor webhook events and errors

### 3. Monitoring
- Monitor webhook event processing
- Set up alerts for failed payments
- Track subscription lifecycle events
- Monitor API response times

## 🔍 Troubleshooting

### Common Issues

1. **"PayPal is not configured"**
   - Check environment variables are set
   - Verify PayPal credentials are correct
   - Ensure application is in correct environment (sandbox/live)

2. **Webhook not receiving events**
   - Verify webhook URL is accessible
   - Check webhook events are selected
   - Ensure webhook certificate ID is correct

3. **Payment creation fails**
   - Check PayPal API credentials
   - Verify order data format
   - Check PayPal account status

4. **Subscription activation fails**
   - Verify subscription ID is correct
   - Check user approval token
   - Ensure subscription is in correct state

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
```

## 📚 Additional Resources

- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal REST API Reference](https://developer.paypal.com/docs/api/overview/)
- [PayPal Webhooks Guide](https://developer.paypal.com/docs/api/webhooks/)
- [PayPal Subscriptions API](https://developer.paypal.com/docs/subscriptions/)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review PayPal developer documentation
3. Contact PayPal developer support
4. Check application logs for detailed error messages

---

**Note**: This integration supports both sandbox (testing) and live (production) environments. Always test thoroughly in sandbox before deploying to production.
