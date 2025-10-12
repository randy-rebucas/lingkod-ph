# Maya Checkout Integration Setup

This document provides instructions for setting up Maya Checkout integration in the Lingkod PH application.

## Overview

Maya Checkout has been integrated to provide multiple payment options including:
- Credit/Debit Cards
- E-wallets (GCash, GrabPay, etc.)
- QR Code payments
- Bank transfers

## Prerequisites

1. **Maya Developer Account**: You need to have a Maya developer account and access to Maya Business Manager
2. **API Keys**: Obtain your Maya API keys (Public Key and Secret Key)
3. **Environment Setup**: Configure your environment variables

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Maya Checkout Configuration
NEXT_PUBLIC_MAYA_PUBLIC_KEY=your_maya_public_key_here
MAYA_SECRET_KEY=your_maya_secret_key_here
MAYA_ENVIRONMENT=sandbox

# App URL for redirects
NEXT_PUBLIC_APP_URL=http://localhost:9006
```

### Environment Values

- **NEXT_PUBLIC_MAYA_PUBLIC_KEY**: Your Maya public key (starts with `pk-`)
- **MAYA_SECRET_KEY**: Your Maya secret key (starts with `sk-`)
- **MAYA_ENVIRONMENT**: Set to `sandbox` for testing, `production` for live
- **NEXT_PUBLIC_APP_URL**: Your application URL for redirect URLs

## Getting Maya API Keys

### Sandbox Environment

1. Go to [Maya Developer Hub](https://developers.maya.ph/)
2. Sign up for a developer account
3. Access the sandbox environment
4. Generate your sandbox API keys from Maya Business Manager

### Production Environment

1. Contact Maya Relations Manager or email [partners@maya.ph](mailto:partners@maya.ph)
2. Complete the merchant onboarding process
3. Get your production API keys

## Features Implemented

### 1. Maya Checkout Service (`src/lib/maya-checkout-service.ts`)

- **createCheckout()**: Creates a new Maya checkout session
- **getPaymentStatus()**: Retrieves payment status
- **verifyWebhookSignature()**: Verifies webhook authenticity
- **createBookingCheckout()**: Creates checkout for booking payments
- **createSubscriptionCheckout()**: Creates checkout for subscription payments

### 2. API Endpoints

- **POST `/api/payments/maya/checkout`**: Creates a Maya checkout session
- **GET `/api/payments/maya/status`**: Gets payment status
- **POST `/api/payments/maya/webhook`**: Handles Maya webhooks

### 3. UI Components

- **MayaCheckoutButton**: Standalone Maya payment button
- **PaymentMethodSelector**: Payment method selection interface

### 4. Success/Failure Pages

- **`/subscription/success`**: Payment success page
- **`/subscription/failure`**: Payment failure page
- **`/subscription/cancel`**: Payment cancellation page

## Usage Examples

### 1. Using MayaCheckoutButton

```tsx
import { MayaCheckoutButton } from '@/components/maya-checkout-button';

<MayaCheckoutButton
  amount={499}
  type="subscription"
  planId="premium"
  onSuccess={(checkoutId) => console.log('Payment successful:', checkoutId)}
  onError={(error) => console.error('Payment failed:', error)}
>
  Pay with Maya
</MayaCheckoutButton>
```

### 2. Using PaymentMethodSelector

```tsx
import { PaymentMethodSelector } from '@/components/payment-method-selector';

<PaymentMethodSelector
  amount={499}
  type="subscription"
  planId="premium"
  onPaymentSuccess={(method, transactionId) => {
    console.log('Payment successful via:', method);
  }}
  onPaymentError={(method, error) => {
    console.error('Payment failed via:', method, error);
  }}
/>
```

## Webhook Configuration

### Setting up Webhooks in Maya

1. Log in to Maya Business Manager
2. Go to Webhooks section
3. Add webhook URL: `https://yourdomain.com/api/payments/maya/webhook`
4. Select events: `payment.paid`, `payment.failed`, `payment.cancelled`

### Webhook Security

The webhook endpoint verifies the signature using HMAC-SHA256 to ensure authenticity.

## Testing

### Sandbox Testing

1. Use sandbox API keys
2. Use test cards from [Maya Sandbox Credentials](https://developers.maya.ph/docs/sandbox-credentials-and-cards)
3. Test different payment scenarios

### Test Cards

```
Visa: 4111 1111 1111 1111
Mastercard: 5555 5555 5555 4444
Expiry: Any future date
CVV: Any 3 digits
```

## Error Handling

The integration includes comprehensive error handling for:
- Invalid API keys
- Network errors
- Payment failures
- Webhook verification failures

## Security Considerations

1. **API Keys**: Never expose secret keys in client-side code
2. **Webhook Verification**: Always verify webhook signatures
3. **HTTPS**: Use HTTPS in production
4. **PCI Compliance**: Maya handles PCI compliance for card data

## Troubleshooting

### Common Issues

1. **Invalid API Keys**: Verify your API keys are correct
2. **Webhook Not Working**: Check webhook URL and signature verification
3. **Redirect Issues**: Ensure NEXT_PUBLIC_APP_URL is set correctly
4. **CORS Issues**: Maya handles CORS for their checkout pages

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## Production Deployment

1. Update environment variables to production values
2. Set `MAYA_ENVIRONMENT=production`
3. Update webhook URLs to production domain
4. Test with real payment methods
5. Monitor webhook delivery

## Support

- **Maya Developer Documentation**: [https://developers.maya.ph/docs/maya-checkout](https://developers.maya.ph/docs/maya-checkout)
- **Maya Support**: [partners@maya.ph](mailto:partners@maya.ph)
- **Developer Hub**: [https://developers.maya.ph/](https://developers.maya.ph/)

## Changelog

- **v1.0.0**: Initial Maya Checkout integration
  - Basic checkout functionality
  - Webhook handling
  - UI components
  - Success/failure pages
