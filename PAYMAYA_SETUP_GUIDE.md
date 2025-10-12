# PayMaya Integration Setup Guide

This guide will help you set up the fully functional PayMaya payment system for Lingkod PH subscriptions, based on the [PayMaya Developer Hub documentation](https://developers.maya.ph/docs/pay-with-maya).

## 🚀 Quick Start

### 1. Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```env
# PayMaya Configuration (REQUIRED)
NEXT_PUBLIC_PAYMAYA_PUBLIC_KEY=your_paymaya_public_key_here
PAYMAYA_SECRET_KEY=your_paymaya_secret_key_here
PAYMAYA_WEBHOOK_SECRET=your_webhook_secret_here

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

### 2. PayMaya Developer Account Setup

1. **Create PayMaya Developer Account**
   - Go to [PayMaya Developer Hub](https://developers.maya.ph/)
   - Sign in with your PayMaya account or create a new one
   - Navigate to the Developer Dashboard

2. **Create New Application**
   - Click "Create App" or "New Application"
   - App Name: `Lingkod PH Subscriptions`
   - Select payment features: "Pay with Maya", "QR Code Payments"
   - Environment: Start with "Sandbox" for testing

3. **Get Credentials**
   - Copy the **Public Key** and **Secret Key**
   - Generate a **Webhook Secret** for security
   - Add them to your `.env.local` file

### 3. Test PayMaya Integration

Run the validation script to test your setup:

```bash
# Validate PayMaya setup
npm run paymaya:validate

# Test PayMaya integration
npm run paymaya:test

# Start development server
npm run dev
```

### 4. Configure PayMaya Webhooks

1. **In PayMaya Developer Dashboard:**
   - Go to your app settings
   - Click "Webhooks" tab
   - Click "Add Webhook"

2. **Webhook Configuration:**
   - Webhook URL: `https://yourdomain.com/api/payments/paymaya/webhook`
   - For local testing: Use ngrok or similar tool
   - Event Types: Select these events:
     - `payment.success`
     - `payment.failed`
     - `payment.cancelled`

## 🔧 Development Setup

### Local Testing with ngrok

For local development, you'll need to expose your local server to PayMaya:

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose port 3000
ngrok http 3000

# Use the ngrok URL for webhook configuration
# Example: https://abc123.ngrok.io/api/payments/paymaya/webhook
```

### Testing with PayMaya Sandbox

1. **Create Sandbox Accounts:**
   - Go to PayMaya Developer Dashboard
   - Navigate to "Sandbox" section
   - Create test merchant and customer accounts

2. **Test Payment Flow:**
   - Use test accounts to make payments
   - Check webhook events in the Developer Dashboard
   - Verify payment processing

## 🚀 Production Deployment

### 1. Switch to Live PayMaya

1. **Create Live Application:**
   - In PayMaya Developer Dashboard
   - Create a new app with "Production" environment
   - Get live Public Key and Secret Key

2. **Update Environment Variables:**
   ```env
   NEXT_PUBLIC_PAYMAYA_PUBLIC_KEY=your_live_public_key
   PAYMAYA_SECRET_KEY=your_live_secret_key
   PAYMAYA_WEBHOOK_SECRET=your_live_webhook_secret
   NODE_ENV=production
   ```

3. **Update Webhook URL:**
   - Change webhook URL to your production domain
   - Example: `https://lingkod-ph.com/api/payments/paymaya/webhook`

### 2. Test Production Integration

```bash
NODE_ENV=production npm run paymaya:test
```

## 📱 Usage

### For Users

1. **Subscribe to a Plan:**
   - Go to `/subscription`
   - Choose a plan (Free, Premium, or Elite)
   - Click "Pay with PayMaya"
   - Complete payment using PayMaya wallet or QR code

2. **Payment Options:**
   - **PayMaya Wallet**: Login and pay directly
   - **QR Code**: Scan with PayMaya app
   - **Card Payment**: Use linked cards in PayMaya

3. **Manage Subscription:**
   - Go to `/subscription/manage`
   - View current plan details
   - Cancel or modify subscription

### For Developers

#### API Endpoints

- `POST /api/payments/paymaya/create` - Create new payment
- `POST /api/payments/paymaya/webhook` - PayMaya webhook handler

#### Components

- `PayMayaPaymentButton` - Payment button with QR code support
- `SubscriptionPage` - Main subscription page
- `SubscriptionManagePage` - Subscription management

## 🔍 Key Features

### PayMaya Integration Features

✅ **Multiple Payment Methods**
- PayMaya Wallet login
- QR Code scanning
- Card payments through PayMaya

✅ **Subscription Support**
- Monthly recurring payments
- Automatic billing
- Payment failure handling

✅ **Security**
- Webhook signature verification
- Secure API endpoints
- Environment variable protection

✅ **User Experience**
- Seamless payment flow
- QR code generation
- Mobile-friendly interface

## 🔍 Troubleshooting

### Common Issues

1. **"PayMaya not configured" Error**
   - Check environment variables in `.env.local`
   - Verify PayMaya credentials are correct
   - Restart your development server

2. **Webhook Not Working**
   - Check webhook URL is accessible
   - Verify webhook events are enabled
   - Check server logs for errors
   - Use ngrok for local testing

3. **Payment Creation Failed**
   - Check PayMaya app configuration
   - Verify user authentication
   - Check network connectivity
   - Review PayMaya API logs

4. **QR Code Not Generating**
   - Check PayMaya API response
   - Verify QR code generation endpoint
   - Check image rendering in browser

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
DEBUG=paymaya:*
```

### Logs and Monitoring

- Check browser console for client-side errors
- Check server logs for API errors
- Monitor PayMaya Developer Dashboard for webhook events
- Use PayMaya's webhook simulator for testing

## 📚 Additional Resources

- [PayMaya Developer Hub](https://developers.maya.ph/)
- [Pay with Maya Documentation](https://developers.maya.ph/docs/pay-with-maya)
- [PayMaya API Reference](https://developers.maya.ph/docs)
- [PayMaya Sandbox Testing](https://developers.maya.ph/docs/sandbox)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review PayMaya Developer Dashboard logs
3. Check your application logs
4. Contact PayMaya Developer Support
5. Create an issue in the project repository

## ✅ Checklist

Before going live, ensure:

- [ ] PayMaya credentials are configured
- [ ] Webhook URL is configured and working
- [ ] All webhook events are enabled
- [ ] Integration tests pass
- [ ] Production environment variables are set
- [ ] Live PayMaya application is created
- [ ] Webhook URL points to production domain
- [ ] Error handling is working
- [ ] User notifications are working
- [ ] Payment flow is functional
- [ ] QR code generation is working

## 🎯 PayMaya vs PayPal

### Advantages of PayMaya for Philippines

✅ **Local Payment Method**
- Popular in the Philippines
- Better user adoption
- Local currency support (PHP)

✅ **Multiple Payment Options**
- PayMaya Wallet
- QR Code payments
- Card payments
- Bank transfers

✅ **Better User Experience**
- Familiar interface for Filipino users
- Mobile-first design
- Quick payment processing

✅ **Local Support**
- Philippine-based support
- Local business hours
- Better understanding of local market

---

**Note:** This integration uses PayMaya's official API and follows PayMaya's best practices for security and reliability. The implementation is optimized for the Philippine market and provides a seamless payment experience for Filipino users.
