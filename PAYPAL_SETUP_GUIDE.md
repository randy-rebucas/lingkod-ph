# Complete PayPal Integration Setup Guide

This guide will help you set up the fully functional PayPal subscription system for Lingkod PH.

## 🚀 Quick Start

### 1. Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```env
# PayPal Configuration (REQUIRED)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here

# Application URL (for webhooks and redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Firebase Configuration (if not already set)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"

# Environment
NODE_ENV=development
```

### 2. PayPal Developer Account Setup

1. **Create PayPal Developer Account**
   - Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
   - Sign in with your PayPal account or create a new one
   - Click "Create App"

2. **Create New Application**
   - App Name: `Lingkod PH Subscriptions`
   - Merchant: Select your business account
   - Features: Enable "Subscriptions"
   - Environment: Start with "Sandbox" for testing

3. **Get Credentials**
   - Copy the **Client ID** and **Client Secret**
   - Add them to your `.env.local` file

### 3. Create PayPal Subscription Plans

Run the setup script to create subscription plans in PayPal:

```bash
# Install dependencies (if not already done)
npm install

# Run the PayPal plan setup script
npx tsx src/scripts/setup-paypal-subscription-plans.ts
```

This will create:
- Premium Plan (₱499/month)
- Elite Plan (₱999/month)

### 4. Configure PayPal Webhooks

1. **In PayPal Developer Dashboard:**
   - Go to your app settings
   - Click "Webhooks" tab
   - Click "Add Webhook"

2. **Webhook Configuration:**
   - Webhook URL: `https://yourdomain.com/api/subscriptions/webhook`
   - For local testing: Use ngrok or similar tool
   - Event Types: Select these events:
     - `BILLING.SUBSCRIPTION.ACTIVATED`
     - `BILLING.SUBSCRIPTION.CANCELLED`
     - `BILLING.SUBSCRIPTION.SUSPENDED`
     - `BILLING.SUBSCRIPTION.PAYMENT.COMPLETED`
     - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
     - `BILLING.SUBSCRIPTION.EXPIRED`

### 5. Test the Integration

Run the integration test script:

```bash
npx tsx src/scripts/test-paypal-integration.ts
```

This will test:
- PayPal configuration
- Access token generation
- Plan creation
- API endpoints

## 🔧 Development Setup

### Local Testing with ngrok

For local development, you'll need to expose your local server to PayPal:

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose port 3000
ngrok http 3000

# Use the ngrok URL for webhook configuration
# Example: https://abc123.ngrok.io/api/subscriptions/webhook
```

### Testing with PayPal Sandbox

1. **Create Sandbox Accounts:**
   - Go to PayPal Developer Dashboard
   - Click "Sandbox" → "Accounts"
   - Create a "Personal" account (for testing payments)
   - Create a "Business" account (for receiving payments)

2. **Test Subscription Flow:**
   - Use the Personal account to subscribe
   - Use the Business account to receive payments
   - Check webhook events in the Developer Dashboard

## 🚀 Production Deployment

### 1. Switch to Live PayPal

1. **Create Live Application:**
   - In PayPal Developer Dashboard
   - Create a new app with "Live" environment
   - Get live Client ID and Client Secret

2. **Update Environment Variables:**
   ```env
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_CLIENT_SECRET=your_live_client_secret
   NODE_ENV=production
   ```

3. **Create Live Subscription Plans:**
   ```bash
   NODE_ENV=production npx tsx src/scripts/setup-paypal-subscription-plans.ts
   ```

### 2. Update Webhook URL

- Change webhook URL to your production domain
- Example: `https://lingkod-ph.com/api/subscriptions/webhook`

### 3. Test Production Integration

```bash
NODE_ENV=production npx tsx src/scripts/test-paypal-integration.ts
```

## 📱 Usage

### For Users

1. **Subscribe to a Plan:**
   - Go to `/subscription`
   - Choose a plan (Free, Premium, or Elite)
   - Click "Subscribe with PayPal"
   - Complete payment on PayPal

2. **Manage Subscription:**
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

## 🔍 Troubleshooting

### Common Issues

1. **"PayPal not configured" Error**
   - Check environment variables in `.env.local`
   - Verify PayPal credentials are correct
   - Restart your development server

2. **Webhook Not Working**
   - Check webhook URL is accessible
   - Verify webhook events are enabled
   - Check server logs for errors
   - Use ngrok for local testing

3. **Subscription Creation Failed**
   - Check PayPal plan IDs exist
   - Verify user authentication
   - Check network connectivity
   - Review PayPal API logs

4. **Payment Not Processing**
   - Check PayPal account status
   - Verify subscription plan is active
   - Check webhook signature verification
   - Review error logs

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
DEBUG=paypal:*
```

### Logs and Monitoring

- Check browser console for client-side errors
- Check server logs for API errors
- Monitor PayPal Developer Dashboard for webhook events
- Use PayPal's webhook simulator for testing

## 📚 Additional Resources

- [PayPal Subscriptions API Documentation](https://developer.paypal.com/docs/subscriptions/)
- [PayPal Webhooks Guide](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)
- [PayPal Sandbox Testing](https://developer.paypal.com/docs/api-basics/sandbox/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review PayPal Developer Dashboard logs
3. Check your application logs
4. Contact PayPal Developer Support
5. Create an issue in the project repository

## ✅ Checklist

Before going live, ensure:

- [ ] PayPal credentials are configured
- [ ] Subscription plans are created in PayPal
- [ ] Webhook URL is configured and working
- [ ] All webhook events are enabled
- [ ] Integration tests pass
- [ ] Production environment variables are set
- [ ] Live PayPal application is created
- [ ] Webhook URL points to production domain
- [ ] Error handling is working
- [ ] User notifications are working
- [ ] Subscription management is functional

---

**Note:** This integration uses PayPal's official Subscriptions API and follows PayPal's best practices for security and reliability.
