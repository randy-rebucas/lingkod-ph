# LocalPro Payment System - Comprehensive Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Payment Methods](#payment-methods)
4. [Payout System](#payout-system)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Security Implementation](#security-implementation)
8. [Configuration](#configuration)
9. [Usage Examples](#usage-examples)
10. [Troubleshooting](#troubleshooting)
11. [Future Enhancements](#future-enhancements)

## 🎯 Overview

The LocalPro payment system is a comprehensive, production-ready solution that handles multiple payment methods, payouts, and financial transactions. The system supports both automated and manual payment processing with robust validation, monitoring, and security features.

### Key Features
- **Multi-Payment Methods**: GCash (automated), Maya, Bank Transfer, PayPal
- **Automated Processing**: Adyen-powered GCash payments with instant confirmation
- **Manual Verification**: Admin-controlled payment verification system
- **Payout Management**: Provider and partner payout systems
- **Commission Tracking**: Partner commission management and payments
- **Real-time Monitoring**: Payment status tracking and notifications
- **Comprehensive Validation**: Multi-layer validation and error handling
- **Audit Trail**: Complete financial audit logging

## 🏗️ Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Payment System Architecture              │
├─────────────────────────────────────────────────────────────┤
│  Frontend Components                                        │
│  ├── Payment Pages                                          │
│  ├── Payout Management                                      │
│  ├── Admin Interfaces                                       │
│  └── Commission Management                                  │
├─────────────────────────────────────────────────────────────┤
│  Core Services                                              │
│  ├── AdyenPaymentService                                    │
│  ├── PaymentValidator                                       │
│  ├── PaymentRetryService                                    │
│  ├── PaymentMonitoringService                               │
│  └── PayoutValidator                                        │
├─────────────────────────────────────────────────────────────┤
│  API Layer                                                  │
│  ├── /api/payments/gcash/*                                  │
│  ├── /api/admin/secure-action                               │
│  └── Payment Webhooks                                       │
├─────────────────────────────────────────────────────────────┤
│  Database Layer                                             │
│  ├── bookings                                               │
│  ├── transactions                                           │
│  ├── payouts                                                │
│  ├── paymentSessions                                        │
│  └── partnerCommissions                                     │
└─────────────────────────────────────────────────────────────┘
```

### Service Dependencies

```typescript
// Core Payment Services
AdyenPaymentService → PaymentConfig → Adyen SDK
PaymentValidator → PaymentConfig → Database
PaymentRetryService → Error Handling → Retry Logic
PaymentMonitoringService → Analytics → Alerts

// Payout Services
PayoutValidator → User Data → Commission Data
PartnerCommissionManager → Analytics → Payment Processing
```

## 💳 Payment Methods

### 1. Automated GCash (Adyen Integration)

**Implementation**: `src/lib/adyen-payment-service.ts`
**Component**: `src/components/gcash-payment-button.tsx`

#### Features
- Instant payment processing
- Real-time status updates
- Webhook-based confirmation
- Automatic booking confirmation

#### Flow
```
User → GCashPaymentButton → API → Adyen → GCash App → 
Webhook → Database Update → Notification
```

#### Configuration
```typescript
// Environment Variables Required
ADYEN_API_KEY=your_adyen_api_key
ADYEN_MERCHANT_ACCOUNT=your_merchant_account
ADYEN_ENVIRONMENT=test|live
ADYEN_CLIENT_KEY=your_client_key
ADYEN_HMAC_KEY=your_hmac_key
```

### 2. Manual Payment Methods

#### GCash (Manual)
- Account details provided to user
- QR code for easy payment
- Manual proof upload required
- Admin verification process

#### Maya
- Account number provided
- Manual proof upload required
- Admin verification process

#### Bank Transfer (BPI)
- Bank account details provided
- Manual proof upload required
- Admin verification process

### 3. PayPal Integration

**Status**: UI implemented, payment processing needs completion
**Location**: `src/app/(app)/subscription/page.tsx`

#### Planned Features
- Subscription payments
- Recurring billing
- International payments

## 💰 Payout System

### Provider Payouts

**Implementation**: `src/app/(app)/earnings/page.tsx`
**Validation**: `src/lib/payout-validator.ts`
**Admin Management**: `src/app/(app)/admin/payouts/page.tsx`

#### Payout Flow
```
Provider → Earnings Page → Payout Request → Validation → 
Admin Review → Payment Processing → Provider Notification
```

#### Payout Methods
- **GCash**: Direct transfer to GCash number
- **Bank Transfer**: Transfer to bank account
- **PayPal**: Transfer to PayPal account

#### Validation Rules
- Minimum payout: ₱500
- Maximum payout: ₱50,000
- Payout days: Saturdays only
- Payout details must be configured

### Partner Commission System

**Implementation**: `src/lib/partner-commission-manager.ts`
**Management**: `src/app/(app)/partners/commission-management/page.tsx`

#### Commission Features
- Dynamic commission rates
- Tier-based calculations
- Multiple payment methods
- Payment history tracking
- Dispute management

#### Commission Tiers
```typescript
interface CommissionTier {
  id: string;
  partnerId: string;
  tierName: string;
  minReferrals: number;
  maxReferrals?: number;
  commissionRate: number;
  bonusAmount: number;
  isActive: boolean;
}
```

## 🔌 API Endpoints

### GCash Payment Endpoints

#### Create Payment Session
```http
POST /api/payments/gcash/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "bookingId": "string",
  "returnUrl": "string"
}
```

#### Handle Payment Result
```http
POST /api/payments/gcash/result
Content-Type: application/json
Authorization: Bearer <token>

{
  "bookingId": "string",
  "pspReference": "string"
}
```

#### Webhook Handler
```http
POST /api/payments/gcash/webhook
Content-Type: application/json

{
  "live": "string",
  "notificationItems": [...]
}
```

### Admin Endpoints

#### Secure Admin Actions
```http
POST /api/admin/secure-action
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "action": "approve_payment" | "reject_payment" | "process_refund",
  "data": {...}
}
```

## 🗄️ Database Schema

### Collections

#### bookings
```typescript
interface Booking {
  id: string;
  clientId: string;
  providerId: string;
  serviceName: string;
  price: number;
  status: 'Pending' | 'Pending Verification' | 'Upcoming' | 'Completed' | 'Cancelled';
  paymentMethod?: 'gcash_adyen' | 'gcash_manual' | 'maya' | 'bank_transfer';
  paymentProofUrl?: string;
  paymentVerifiedAt?: Timestamp;
  paymentVerifiedBy?: string;
  adyenPspReference?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### transactions
```typescript
interface Transaction {
  id: string;
  bookingId: string;
  clientId: string;
  providerId: string;
  amount: number;
  type: 'booking_payment' | 'refund' | 'commission';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  createdAt: Timestamp;
  verifiedAt?: Timestamp;
  verifiedBy?: string;
  adyenPspReference?: string;
}
```

#### payouts
```typescript
interface Payout {
  id: string;
  providerId: string;
  providerName: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Cancelled';
  payoutDetails: {
    method: 'gcash' | 'bank';
    gCashNumber?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
  };
  requestedAt: Timestamp;
  processedAt?: Timestamp;
  transactionId: string;
}
```

#### paymentSessions
```typescript
interface PaymentSession {
  id: string;
  bookingId: string;
  sessionId: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  amount: number;
  currency: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  pspReference?: string;
}
```

#### partnerCommissions
```typescript
interface PartnerCommission {
  id: string;
  partnerId: string;
  partnerName: string;
  referralId: string;
  jobId: string;
  bookingId: string;
  commissionAmount: number;
  commissionRate: number;
  jobValue: number;
  status: 'pending' | 'paid' | 'cancelled' | 'disputed';
  createdAt: Timestamp;
  paidAt?: Timestamp;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  metadata: {
    jobCategory: string;
    jobLocation: string;
    clientId: string;
    providerId: string;
    completionDate: Timestamp;
  };
}
```

## 🔒 Security Implementation

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (admin, provider, client, partner)
- API endpoint protection
- Admin action verification

### Payment Security
- HMAC signature verification for webhooks
- Payment session timeout (15 minutes)
- Duplicate payment detection
- Amount validation with tolerance
- File upload validation

### Audit Logging
```typescript
// Financial Audit Logger
class FinancialAuditLogger {
  logPayment(paymentData: PaymentData): void;
  logPayout(payoutData: PayoutData): void;
  logCommission(commissionData: CommissionData): void;
  logRefund(refundData: RefundData): void;
}
```

### Rate Limiting
- API rate limiting for payment endpoints
- Admin action rate limiting
- File upload rate limiting

## ⚙️ Configuration

### Environment Variables

```bash
# Adyen Configuration
ADYEN_API_KEY=your_adyen_api_key
ADYEN_MERCHANT_ACCOUNT=your_merchant_account
ADYEN_ENVIRONMENT=test
ADYEN_CLIENT_KEY=your_client_key
ADYEN_HMAC_KEY=your_hmac_key

# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Payment Method Configuration
GCASH_ACCOUNT_NAME=LocalPro Services
GCASH_ACCOUNT_NUMBER=0917-123-4567
MAYA_ACCOUNT_NAME=LocalPro Services
MAYA_ACCOUNT_NUMBER=0918-000-5678
BANK_ACCOUNT_NAME=LocalPro Services Inc.
BANK_ACCOUNT_NUMBER=1234-5678-90
BANK_NAME=BPI

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@localpro.com
RESEND_API_KEY=your_resend_api_key
```

### Payment Settings
```typescript
const PAYMENT_SETTINGS = {
  PAYMENT_SESSION_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  PAYMENT_TOLERANCE: 0.01, // 1 cent tolerance
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000, // 1 second
};
```

## 📝 Usage Examples

### Creating a GCash Payment

```typescript
import { GCashPaymentButton } from '@/components/gcash-payment-button';

function PaymentPage() {
  const handlePaymentSuccess = () => {
    console.log('Payment successful!');
    router.push('/bookings');
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
  };

  return (
    <GCashPaymentButton
      bookingId="booking123"
      amount={1500}
      serviceName="House Cleaning"
      onPaymentSuccess={handlePaymentSuccess}
      onPaymentError={handlePaymentError}
    />
  );
}
```

### Requesting a Payout

```typescript
import { handleRequestPayout } from '@/ai/flows/request-payout';

async function requestPayout(providerId: string, amount: number) {
  try {
    await handleRequestPayout({
      providerId,
      amount
    });
    console.log('Payout requested successfully');
  } catch (error) {
    console.error('Payout request failed:', error);
  }
}
```

### Processing Commission Payment

```typescript
import { PartnerCommissionManager } from '@/lib/partner-commission-manager';

async function processCommissionPayment(
  partnerId: string,
  commissionIds: string[]
) {
  const result = await PartnerCommissionManager.processCommissionPayment(
    partnerId,
    commissionIds,
    {
      paymentMethod: 'gcash',
      paymentReference: 'PAY-123456',
      notes: 'Monthly commission payment'
    }
  );

  if (result.success) {
    console.log('Commission payment processed:', result.paymentId);
  } else {
    console.error('Commission payment failed:', result.error);
  }
}
```

### Validating Payment

```typescript
import { PaymentValidator } from '@/lib/payment-validator';

async function validatePayment(bookingId: string, amount: number) {
  const validator = PaymentValidator.getInstance();
  const result = await validator.validatePaymentAmount(bookingId, amount);
  
  if (result.isValid) {
    console.log('Payment amount is valid');
  } else {
    console.error('Payment validation failed:', result.errors);
  }
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. GCash Payment Failures
**Symptoms**: Payment button shows error, no redirect to GCash
**Solutions**:
- Check Adyen configuration
- Verify API keys are correct
- Check network connectivity
- Review browser console for errors

#### 2. Manual Payment Verification Issues
**Symptoms**: Payment proof not uploading, admin can't verify
**Solutions**:
- Check file size (max 5MB)
- Verify file type (JPEG, PNG, WebP only)
- Check Firebase Storage permissions
- Review admin role permissions

#### 3. Payout Request Failures
**Symptoms**: Payout request not submitting, validation errors
**Solutions**:
- Verify payout details are configured
- Check minimum payout amount (₱500)
- Ensure it's a valid payout day (Saturday)
- Review user permissions

#### 4. Webhook Processing Issues
**Symptoms**: Payments not confirming automatically
**Solutions**:
- Check webhook URL configuration
- Verify HMAC signature validation
- Review webhook endpoint logs
- Check Adyen webhook settings

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=payment:*
```

### Monitoring

Use the PaymentMonitoringService to track:
- Payment success rates
- Average processing times
- Error patterns
- Performance metrics

```typescript
import { PaymentMonitoringService } from '@/lib/payment-monitoring';

// Get daily metrics
const metrics = await PaymentMonitoringService.getDailyMetrics();
console.log('Payment metrics:', metrics);
```

## 🚀 Future Enhancements

### Planned Features

#### 1. Subscription Payment Integration
- Complete PayPal integration for recurring payments
- Subscription management interface
- Billing history and invoicing
- Automatic renewal handling

#### 2. Advanced Refund System
- Automated refund processing
- Refund request interface
- Integration with existing payment methods
- Refund analytics and reporting

#### 3. Escrow System
- Hold payments until service completion
- Dispute resolution mechanism
- Automated release conditions
- Escrow management interface

#### 4. Multi-Currency Support
- Support for different currencies
- Real-time exchange rates
- Localized payment methods
- Currency conversion handling

#### 5. Advanced Analytics
- Payment performance metrics
- Revenue forecasting
- Fraud detection
- Business intelligence dashboard

### Integration Opportunities

#### 1. Additional Payment Methods
- PayMaya integration
- GrabPay integration
- Credit card processing
- Cryptocurrency payments

#### 2. Banking Integration
- Direct bank API integration
- Automated bank transfers
- Real-time payment status
- Bank reconciliation

#### 3. Third-Party Services
- Accounting software integration
- Tax calculation services
- Compliance monitoring
- Financial reporting tools

## 📞 Support

For technical support or questions about the payment system:

1. **Documentation**: Refer to this comprehensive guide
2. **Code Examples**: Check the `/examples` directory
3. **API Reference**: Review the API endpoint documentation
4. **Troubleshooting**: Use the troubleshooting section above
5. **Development Team**: Contact the development team for complex issues

## 📄 License

This payment system is part of the LocalPro application and is subject to the project's licensing terms.

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready
