# Payment System Environment Setup Guide

## Overview

This guide provides comprehensive instructions for setting up the payment system environment variables and configurations for the LocalPro application.

## Required Environment Variables

### 1. Adyen Configuration (GCash Integration)

```env
# Adyen API Configuration
ADYEN_API_KEY=your_adyen_api_key_here
ADYEN_MERCHANT_ACCOUNT=your_merchant_account_here
ADYEN_ENVIRONMENT=test
ADYEN_CLIENT_KEY=your_client_key_here
ADYEN_HMAC_KEY=your_hmac_key_here
```

**How to obtain:**
1. Sign up for an Adyen account at https://www.adyen.com/
2. Navigate to Developers > API credentials
3. Create a new API credential for your application
4. Copy the API key, merchant account, and client key
5. Generate an HMAC key for webhook verification

### 2. PayPal Configuration

```env
# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_secret_here
```

**How to obtain:**
1. Create a PayPal Developer account at https://developer.paypal.com/
2. Create a new application in the PayPal Developer Dashboard
3. Copy the Client ID and Client Secret
4. For production, use live credentials; for testing, use sandbox credentials

### 3. Payment Method Details

```env
# GCash Configuration
GCASH_ACCOUNT_NAME=LocalPro Services
GCASH_ACCOUNT_NUMBER=09179157515

# Maya Configuration
MAYA_ACCOUNT_NAME=LocalPro Services
MAYA_ACCOUNT_NUMBER=09179157515

# Bank Transfer Configuration
BANK_ACCOUNT_NAME=LocalPro Services Inc.
BANK_ACCOUNT_NUMBER=1234-5678-90
BANK_NAME=BPI
```

**Note:** Replace these with your actual account details.

### 4. Application Configuration

```env
# Application URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
```

### 5. Email Configuration

```env
# SMTP Configuration (Optional - for custom email service)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Resend Configuration (Recommended)
RESEND_API_KEY=your_resend_api_key
```

### 6. Security Configuration

```env
# JWT and Encryption
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

## Environment Setup by Deployment Type

### Development Environment

1. Create a `.env.local` file in your project root
2. Copy the environment variables above
3. Use test/sandbox credentials for all payment gateways
4. Set `ADYEN_ENVIRONMENT=test`
5. Use development Firebase project

### Staging Environment

1. Create a `.env.staging` file
2. Use test credentials but with production-like configuration
3. Set up staging Firebase project
4. Configure staging domain in `NEXT_PUBLIC_APP_URL`

### Production Environment

1. Use your hosting platform's environment variable configuration
2. Use live/production credentials for all payment gateways
3. Set `ADYEN_ENVIRONMENT=live`
4. Use production Firebase project
5. Configure production domain in `NEXT_PUBLIC_APP_URL`

## Payment Gateway Setup Instructions

### Adyen Setup

1. **Create Adyen Account**
   - Visit https://www.adyen.com/
   - Sign up for a merchant account
   - Complete the verification process

2. **Configure API Credentials**
   - Go to Developers > API credentials
   - Create a new API credential
   - Note down the API key and merchant account

3. **Enable GCash Payment Method**
   - Contact Adyen support to enable GCash for your account
   - Configure GCash settings in your Adyen dashboard

4. **Set up Webhooks**
   - Go to Developers > Webhooks
   - Create a new webhook endpoint: `https://your-domain.com/api/payments/gcash/webhook`
   - Configure the webhook to send AUTHORISATION events
   - Generate and note the HMAC key

### PayPal Setup

1. **Create PayPal Developer Account**
   - Visit https://developer.paypal.com/
   - Sign up for a developer account

2. **Create Application**
   - Go to My Apps & Credentials
   - Create a new application
   - Select the appropriate product (Payments Standard or Advanced)

3. **Get Credentials**
   - Copy the Client ID and Client Secret
   - Use sandbox credentials for testing
   - Use live credentials for production

## Configuration Validation

### Test Configuration

Use the following script to validate your configuration:

```typescript
// src/lib/config-validator.ts
import { PaymentConfig } from './payment-config';

export function validatePaymentConfiguration(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate Adyen configuration
  if (!PaymentConfig.validateAdyenConfig()) {
    errors.push('Adyen configuration is incomplete');
  }

  // Validate PayPal configuration
  if (!PaymentConfig.validatePayPalConfig()) {
    errors.push('PayPal configuration is incomplete');
  }

  // Check for default values (warnings)
  if (PaymentConfig.GCASH.accountNumber === '09179157515') {
    warnings.push('Using default GCash account number');
  }

  if (PaymentConfig.BANK.accountNumber === '1234-5678-90') {
    warnings.push('Using default bank account number');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

## Security Best Practices

### 1. Environment Variable Security

- Never commit `.env` files to version control
- Use different credentials for different environments
- Rotate API keys regularly
- Use strong, unique secrets for JWT and encryption

### 2. Payment Gateway Security

- Enable webhook signature verification
- Use HTTPS for all payment-related endpoints
- Implement rate limiting on payment endpoints
- Log all payment events for audit purposes

### 3. Database Security

- Use Firebase Security Rules to protect payment data
- Encrypt sensitive payment information
- Implement proper access controls
- Regular security audits

## Testing Payment Integration

### 1. Test Cards and Accounts

**Adyen Test Cards:**
- Success: 4111 1111 1111 1111
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0000 0000 3220

**PayPal Test Accounts:**
- Use PayPal sandbox test accounts
- Create buyer and seller test accounts

### 2. Webhook Testing

Use tools like ngrok to test webhooks locally:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the ngrok URL for webhook testing
```

### 3. Integration Testing

Create test scenarios for:
- Successful payments
- Failed payments
- Payment timeouts
- Webhook failures
- Network interruptions

## Monitoring and Alerts

### 1. Payment Metrics

Monitor the following metrics:
- Payment success rate
- Average processing time
- Failed payment reasons
- Payment method distribution

### 2. Error Alerts

Set up alerts for:
- High failure rates
- Payment gateway downtime
- Webhook failures
- Unusual payment patterns

### 3. Logging

Ensure comprehensive logging for:
- All payment events
- API calls to payment gateways
- Webhook processing
- Error conditions

## Troubleshooting

### Common Issues

1. **Adyen Configuration Issues**
   - Verify API key and merchant account
   - Check environment setting (test vs live)
   - Ensure GCash is enabled for your account

2. **PayPal Integration Issues**
   - Verify client ID and secret
   - Check sandbox vs live environment
   - Ensure proper redirect URLs

3. **Webhook Issues**
   - Verify webhook URL is accessible
   - Check HMAC signature validation
   - Ensure proper event filtering

### Support Contacts

- **Adyen Support:** https://support.adyen.com/
- **PayPal Developer Support:** https://developer.paypal.com/support/
- **Firebase Support:** https://firebase.google.com/support/

## Production Checklist

Before going live, ensure:

- [ ] All environment variables are properly configured
- [ ] Payment gateways are configured for production
- [ ] Webhook endpoints are accessible and secure
- [ ] SSL certificates are installed and valid
- [ ] Error handling and logging are comprehensive
- [ ] Monitoring and alerting are set up
- [ ] Security measures are implemented
- [ ] Backup and recovery procedures are in place
- [ ] Payment reconciliation processes are established
- [ ] Compliance requirements are met (PCI DSS, etc.)

## Conclusion

Proper configuration of the payment system is crucial for the success of your application. Follow this guide carefully and test thoroughly before deploying to production. Regular monitoring and maintenance will ensure the payment system continues to operate smoothly and securely.