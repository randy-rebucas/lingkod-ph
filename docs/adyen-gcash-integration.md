# Adyen GCash Integration Documentation

## Overview

This document outlines the implementation of Adyen GCash integration for Lingkod PH, providing automated payment processing with instant confirmation.

## Features Implemented

### 1. Adyen Payment Service (`src/lib/adyen-payment-service.ts`)
- Complete Adyen SDK integration
- GCash payment session creation
- Payment result handling
- Webhook processing
- Database integration for payment tracking

### 2. API Endpoints
- `POST /api/payments/gcash/create` - Create GCash payment session
- `POST /api/payments/gcash/result` - Handle payment result verification
- `POST /api/payments/gcash/webhook` - Process Adyen webhooks

### 3. Frontend Components
- `GCashPaymentButton` - Automated GCash payment component
- Payment result page for redirect handling
- Updated payment page with tabbed interface

### 4. Database Schema Updates
- `paymentSessions` collection for tracking payment sessions
- Enhanced booking and transaction records with Adyen references

## Environment Variables Required

Add the following environment variables to your `.env.local` file:

```env
# Adyen Configuration
ADYEN_API_KEY=your_adyen_api_key_here
ADYEN_MERCHANT_ACCOUNT=your_merchant_account_here
ADYEN_ENVIRONMENT=test
ADYEN_CLIENT_KEY=your_client_key_here
ADYEN_HMAC_KEY=your_hmac_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Adyen Account Setup

### 1. Create Adyen Account
1. Sign up at [Adyen Customer Area](https://ca-test.adyen.com)
2. Complete merchant account setup
3. Enable GCash payment method in your merchant account

### 2. API Credentials
1. Generate API key in Customer Area
2. Note your merchant account name
3. Get client key for frontend integration
4. Generate HMAC key for webhook verification

### 3. Webhook Configuration
1. Set webhook URL: `https://yourdomain.com/api/payments/gcash/webhook`
2. Enable `AUTHORISATION` event notifications
3. Configure HMAC signature verification

## Payment Flow

### Automated GCash Payment
1. User selects "Instant" GCash option
2. System creates Adyen payment session
3. User redirected to GCash payment page
4. User completes payment in GCash app
5. Adyen webhook notifies system of result
6. System updates booking status automatically
7. User receives confirmation notification

### Manual GCash Payment (Existing)
1. User selects "Manual" GCash option
2. User makes payment to provided account
3. User uploads payment proof
4. Admin verifies payment manually
5. System updates booking status

## Database Collections

### paymentSessions
```typescript
{
  bookingId: string;
  pspReference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: 'gcash';
  createdAt: Timestamp;
  completedAt?: Timestamp;
  failedAt?: Timestamp;
  failureReason?: string;
  redirectUrl?: string;
}
```

### Enhanced Booking Fields
```typescript
{
  // Existing fields...
  adyenPspReference?: string;
  paymentMethod?: 'gcash_adyen' | 'gcash_manual' | 'paypal' | 'bank_transfer';
}
```

### Enhanced Transaction Fields
```typescript
{
  // Existing fields...
  adyenPspReference?: string;
  paymentMethod?: 'gcash_adyen' | 'gcash_manual' | 'paypal' | 'bank_transfer';
}
```

## Security Features

### 1. Webhook Verification
- HMAC signature validation
- Request origin verification
- Payload integrity checking

### 2. Payment Session Security
- Unique session references
- Timeout handling
- Status validation

### 3. User Authorization
- Booking ownership verification
- Payment state validation
- Session-based authentication

## Error Handling

### Common Error Scenarios
1. **Payment Creation Failed**
   - Invalid booking state
   - Adyen API errors
   - Network connectivity issues

2. **Payment Verification Failed**
   - Invalid PSP reference
   - Payment not found
   - Status mismatch

3. **Webhook Processing Failed**
   - Invalid signature
   - Malformed payload
   - Database errors

### Error Recovery
1. Retry mechanisms for transient failures
2. User-friendly error messages
3. Fallback to manual payment option
4. Admin notification for critical errors

## Testing

### Test Environment Setup
1. Use Adyen test environment
2. Configure test merchant account
3. Use test GCash credentials
4. Enable test webhook notifications

### Test Scenarios
1. Successful payment flow
2. Payment failure handling
3. Webhook processing
4. Error recovery
5. User experience validation

## Monitoring and Analytics

### Key Metrics
- Payment success rate
- Average processing time
- Error rates by type
- User conversion rates

### Logging
- Payment session creation
- Webhook processing
- Error occurrences
- Performance metrics

## Deployment Checklist

### Pre-deployment
- [ ] Adyen account configured
- [ ] Environment variables set
- [ ] Webhook URL configured
- [ ] Test payments verified
- [ ] Error handling tested

### Post-deployment
- [ ] Webhook connectivity verified
- [ ] Payment flow tested
- [ ] Monitoring alerts configured
- [ ] Documentation updated

## Support and Troubleshooting

### Common Issues
1. **Webhook not receiving notifications**
   - Check webhook URL configuration
   - Verify HMAC key setup
   - Check firewall/network settings

2. **Payment sessions not creating**
   - Verify API key permissions
   - Check merchant account status
   - Validate request payload

3. **Payment verification failing**
   - Check PSP reference format
   - Verify payment status in Adyen
   - Review error logs

### Support Contacts
- **Adyen Support**: [Adyen Support Portal](https://support.adyen.com)
- **Technical Issues**: development@lingkodph.com
- **Payment Issues**: payments@lingkodph.com

## Future Enhancements

### Planned Features
1. **Payment Method Expansion**
   - Maya integration
   - GrabPay integration
   - Other local payment methods

2. **Advanced Features**
   - Recurring payments
   - Partial payments
   - Payment scheduling

3. **Analytics Enhancement**
   - Real-time dashboards
   - Advanced reporting
   - Performance optimization

---

## Conclusion

The Adyen GCash integration provides a seamless, automated payment experience for users while maintaining the existing manual payment option as a fallback. The implementation includes comprehensive error handling, security measures, and monitoring capabilities to ensure reliable payment processing.

For technical support or questions about the integration, please refer to the source code documentation or contact the development team.
