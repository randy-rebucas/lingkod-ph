# PayPal Subscription System Setup Guide

This guide explains how to set up and use the fully functional PayPal subscription system for the Lingkod PH application.

## Features

✅ **PayPal Subscription Integration**
- Recurring monthly billing
- Secure payment processing
- Automatic subscription management

✅ **Subscription Plans**
- Free Plan (₱0/month)
- Premium Plan (₱499/month)
- Elite Plan (₱999/month)

✅ **User Management**
- Subscription status tracking
- Plan upgrades/downgrades
- Cancellation handling

✅ **Webhook Integration**
- Real-time subscription events
- Automatic status updates
- Payment failure handling

## Setup Instructions

### 1. PayPal Configuration

1. **Create PayPal Developer Account**
   - Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
   - Create a new application
   - Note down your Client ID and Client Secret

2. **Environment Variables**
   Add these to your `.env.local` file:
   ```env
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   ```

3. **Create Subscription Plans**
   Run the setup script to create PayPal subscription plans:
   ```bash
   npm run setup:paypal-plans
   ```

### 2. Webhook Configuration

1. **Set Webhook URL**
   In your PayPal developer dashboard, set the webhook URL to:
   ```
   https://yourdomain.com/api/subscriptions/webhook
   ```

2. **Enable Webhook Events**
   Enable the following events:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `BILLING.SUBSCRIPTION.PAYMENT.COMPLETED`
   - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
   - `BILLING.SUBSCRIPTION.EXPIRED`

### 3. Database Structure

The system uses the following Firestore collections:

- `users/{userId}` - User subscription data
- `subscriptions` - Subscription records
- `subscriptionPayments` - Payment history

## Usage

### For Users

1. **Subscribe to a Plan**
   - Go to `/subscription`
   - Choose a plan
   - Click "Subscribe with PayPal"
   - Complete payment on PayPal

2. **Manage Subscription**
   - Go to `/subscription/manage`
   - View current plan details
   - Cancel or modify subscription
   - Access billing information

### For Developers

#### API Endpoints

- `POST /api/subscriptions/create` - Create new subscription
- `POST /api/subscriptions/cancel` - Cancel subscription
- `POST /api/subscriptions/update` - Update subscription
- `POST /api/subscriptions/webhook` - PayPal webhook handler

#### Components

- `PayPalSubscriptionButton` - Subscription payment button
- `SubscriptionPage` - Main subscription page
- `SubscriptionManagePage` - Subscription management

## File Structure

```
src/
├── lib/
│   └── paypal-subscription-service.ts    # PayPal subscription API
├── components/
│   └── paypal-subscription-button.tsx    # Subscription button component
├── app/
│   ├── (app)/
│   │   └── subscription/
│   │       ├── page.tsx                  # Main subscription page
│   │       ├── success/
│   │       │   └── page.tsx              # Success page
│   │       ├── manage/
│   │       │   └── page.tsx              # Management page
│   │       └── actions.ts                # Server actions
│   └── api/
│       └── subscriptions/
│           ├── create/route.ts           # Create subscription API
│           ├── cancel/route.ts           # Cancel subscription API
│           ├── update/route.ts           # Update subscription API
│           └── webhook/route.ts          # Webhook handler
└── scripts/
    └── setup-paypal-subscription-plans.ts # Setup script
```

## Testing

### Sandbox Testing

1. Use PayPal sandbox credentials
2. Test with sandbox PayPal accounts
3. Verify webhook events in PayPal developer dashboard

### Production Deployment

1. Switch to live PayPal credentials
2. Update webhook URL to production domain
3. Test with real PayPal accounts

## Security Considerations

- Webhook signature verification (implemented)
- Secure API endpoints with authentication
- Environment variable protection
- Input validation and sanitization

## Troubleshooting

### Common Issues

1. **PayPal Not Configured**
   - Check environment variables
   - Verify PayPal credentials

2. **Webhook Not Working**
   - Check webhook URL configuration
   - Verify webhook events are enabled
   - Check server logs for errors

3. **Subscription Not Updating**
   - Check webhook processing
   - Verify database permissions
   - Check user authentication

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## Support

For issues or questions:
1. Check the console logs
2. Verify PayPal developer dashboard
3. Check Firestore database
4. Contact support team

## License

This subscription system is part of the Lingkod PH application and follows the same licensing terms.
