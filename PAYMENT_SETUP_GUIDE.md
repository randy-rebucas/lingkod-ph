# Payment System Setup Guide

This guide will help you configure the payment system for Localpro PH. The system supports multiple payment methods including Maya Checkout, PayPal, and bank transfers.

## 🚀 Quick Start

### 1. Generate Configuration Files
```bash
npm run setup-payment-config
```

### 2. Check Configuration Status
```bash
npm run check-payment-config
```

### 3. Follow Setup Instructions
```bash
npm run setup-payment-gateways
```

## 📋 Configuration Checklist

### ✅ Required Configurations

#### Maya Checkout
- [ ] Maya Public Key (`NEXT_PUBLIC_MAYA_PUBLIC_KEY`)
- [ ] Maya Secret Key (`MAYA_SECRET_KEY`)
- [ ] Maya Webhook Secret (`MAYA_WEBHOOK_SECRET`)

#### PayPal
- [ ] PayPal Client ID (`NEXT_PUBLIC_PAYPAL_CLIENT_ID`)
- [ ] PayPal Client Secret (`PAYPAL_CLIENT_SECRET`)

#### Firebase
- [ ] Firebase Project ID (`NEXT_PUBLIC_FIREBASE_PROJECT_ID`)
- [ ] Firebase Private Key (`FIREBASE_PRIVATE_KEY`)
- [ ] Firebase Client Email (`FIREBASE_CLIENT_EMAIL`)

#### Security
- [x] JWT Secret (`JWT_SECRET`) - Auto-generated
- [x] Encryption Key (`ENCRYPTION_KEY`) - Auto-generated

#### Application
- [ ] App URL (`NEXT_PUBLIC_APP_URL`)

### ⚠️ Optional Configurations

#### Email Service
- [ ] Resend API Key (`RESEND_API_KEY`)

#### Bank Transfer
- [ ] Bank Account Name (`BANK_ACCOUNT_NAME`)
- [ ] Bank Account Number (`BANK_ACCOUNT_NUMBER`)
- [ ] Bank Name (`BANK_NAME`)

## 🔧 Detailed Setup Instructions

### Maya Checkout Setup

1. **Create Maya Developer Account**
   - Go to [Maya Developer Hub](https://developers.maya.ph/)
   - Sign up for a developer account
   - Complete the registration process

2. **Access Maya Business Manager**
   - Go to [Maya Business Manager](https://business.maya.ph/)
   - Log in with your developer account
   - Navigate to "API Keys" section

3. **Generate API Keys**
   - Click "Generate New Key"
   - Select "Sandbox" environment for testing
   - Copy the Public Key (starts with `pk-`)
   - Copy the Secret Key (starts with `sk-`)

4. **Configure Webhooks**
   - Go to "Webhooks" section in Maya Business Manager
   - Add webhook URL: `http://localhost:3000/api/payments/maya/webhook`
   - Select events: `payment.paid`, `payment.failed`, `payment.cancelled`
   - Copy the webhook secret

5. **Update Environment Variables**
   ```env
   NEXT_PUBLIC_MAYA_PUBLIC_KEY=pk-your-actual-public-key
   MAYA_SECRET_KEY=sk-your-actual-secret-key
   MAYA_WEBHOOK_SECRET=your-webhook-secret
   ```

### PayPal Setup

1. **Create PayPal Developer Account**
   - Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
   - Sign up for a developer account
   - Complete the registration process

2. **Create Application**
   - Go to "My Apps & Credentials"
   - Click "Create App"
   - Select "Default Application"
   - Choose "Sandbox" for testing
   - Add features: "Accept payments" and "Future payments"

3. **Get API Credentials**
   - Click on your created app
   - Copy the "Client ID"
   - Copy the "Client Secret"

4. **Configure Webhooks**
   - Go to "Webhooks" section
   - Click "Create Webhook"
   - Webhook URL: `http://localhost:3000/api/payments/paypal/webhook`
   - Select events:
     - `PAYMENT.CAPTURE.COMPLETED`
     - `PAYMENT.CAPTURE.DENIED`
     - `PAYMENT.CAPTURE.REFUNDED`
   - Copy the webhook ID

5. **Update Environment Variables**
   ```env
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-client-id
   PAYPAL_CLIENT_SECRET=your-client-secret
   ```

### Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Enter project name: "localpro"
   - Enable Google Analytics (optional)
   - Create project

2. **Enable Firestore Database**
   - Go to "Firestore Database" in the left menu
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location (choose closest to Philippines)

3. **Enable Authentication**
   - Go to "Authentication" in the left menu
   - Click "Get started"
   - Go to "Sign-in method" tab
   - Enable "Email/Password" provider

4. **Generate Service Account Key**
   - Go to "Project settings" (gear icon)
   - Go to "Service accounts" tab
   - Click "Generate new private key"
   - Download the JSON file
   - Copy the values from the JSON file

5. **Update Environment Variables**
   ```env
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   ```

### Resend Email Setup

1. **Create Resend Account**
   - Go to [Resend](https://resend.com/)
   - Sign up for an account
   - Verify your email address

2. **Get API Key**
   - Go to "API Keys" section
   - Click "Create API Key"
   - Give it a name: "Localpro PH Development"
   - Copy the API key (starts with `re_`)

3. **Update Environment Variables**
   ```env
   RESEND_API_KEY=re_your_actual_api_key
   ```

### Bank Account Setup

1. **Prepare Bank Account Information**
   - Account holder name (exactly as it appears on the account)
   - Account number
   - Bank name (e.g., BPI, BDO, Metrobank, etc.)

2. **Update Environment Variables**
   ```env
   BANK_ACCOUNT_NAME=Your Real Company Name
   BANK_ACCOUNT_NUMBER=1234567890
   BANK_NAME=Your Bank Name
   ```

## 🧪 Testing Your Configuration

### 1. Validate Configuration
```bash
npm run validate-payments
```

### 2. Test Payment Gateways
```bash
# Test Maya integration
npm run test-maya

# Test PayPal integration
npm run test-paypal
```

### 3. Test in Development
```bash
# Start development server
npm run dev

# Test payment flows
# Go to: http://localhost:3000
# Create a test booking
# Try the payment flow
```

### 4. Test Webhooks
```bash
# Use ngrok to expose local server
ngrok http 3000

# Update webhook URLs in payment gateways
# Test webhook delivery
```

## 🔒 Security Notes

- JWT_SECRET and ENCRYPTION_KEY are auto-generated and secure
- Keep all API keys secure and never commit them to version control
- The .env.local file is already in .gitignore
- Use HTTPS for production URLs
- Test with sandbox credentials before going live

## 📚 Additional Resources

- [Maya Documentation](https://developers.maya.ph/docs/)
- [PayPal Documentation](https://developer.paypal.com/docs/)
- [Firebase Documentation](https://firebase.google.com/docs/)
- [Resend Documentation](https://resend.com/docs)

## 🆘 Troubleshooting

### Common Issues

1. **Configuration Not Working**
   - Run `npm run check-payment-config` to see what's missing
   - Ensure all required environment variables are set
   - Check that values are not using placeholder text

2. **Payment Gateway Errors**
   - Verify API keys are correct
   - Check that you're using sandbox credentials for testing
   - Ensure webhook URLs are accessible

3. **Firebase Connection Issues**
   - Verify Firebase project ID is correct
   - Check that service account key is properly formatted
   - Ensure Firestore and Authentication are enabled

### Getting Help

- Check the console logs for detailed error messages
- Run the validation scripts to identify issues
- Review the documentation for each service
- Test with minimal configurations first

## 🎉 Production Deployment

### Before Going Live

1. **Update to Production Credentials**
   - Replace sandbox API keys with production keys
   - Update webhook URLs to production domain
   - Set `MAYA_ENVIRONMENT=production`

2. **Security Checklist**
   - Use HTTPS for all URLs
   - Verify all environment variables are set
   - Test all payment flows thoroughly
   - Set up monitoring and alerting

3. **Final Testing**
   - Test with real payment methods
   - Verify webhook delivery
   - Check error handling
   - Monitor payment processing

### Environment Variables for Production

```env
# Production settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
MAYA_ENVIRONMENT=production

# Use production API keys
NEXT_PUBLIC_MAYA_PUBLIC_KEY=pk-live-your-production-key
MAYA_SECRET_KEY=sk-live-your-production-secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-production-client-id
PAYPAL_CLIENT_SECRET=your-production-client-secret
```

---

**Need help?** Run `npm run setup-payment-gateways` for detailed step-by-step instructions!
