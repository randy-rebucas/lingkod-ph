# Payment System Quick Reference

## 🚀 Quick Start

### Essential Files
```
src/lib/
├── adyen-payment-service.ts      # GCash payment processing
├── payment-config.ts             # Payment configuration
├── payment-validator.ts          # Payment validation
├── payment-retry-service.ts      # Retry mechanisms
├── payout-validator.ts           # Payout validation
└── partner-commission-manager.ts # Commission management

src/components/
├── gcash-payment-button.tsx      # GCash payment component
└── payment-method-icon.tsx       # Payment method icons

src/app/(app)/
├── bookings/[bookingId]/payment/ # Payment pages
├── admin/transactions/           # Admin payment management
├── admin/payouts/               # Admin payout management
├── earnings/                    # Provider earnings
└── partners/commission-management/ # Partner commissions
```

## 💳 Payment Methods

| Method | Type | Status | Auto Confirm |
|--------|------|--------|--------------|
| GCash (Adyen) | Automated | ✅ Active | Yes |
| GCash (Manual) | Manual | ✅ Active | No |
| Maya | Manual | ✅ Active | No |
| Bank Transfer | Manual | ✅ Active | No |
| PayPal | Automated | 🚧 Planned | Yes |

## 🔧 Environment Variables

```bash
# Required for GCash payments
ADYEN_API_KEY=your_key
ADYEN_MERCHANT_ACCOUNT=your_account
ADYEN_CLIENT_KEY=your_client_key
ADYEN_HMAC_KEY=your_hmac_key

# Payment accounts
GCASH_ACCOUNT_NUMBER=0917-123-4567
MAYA_ACCOUNT_NUMBER=0918-000-5678
BANK_ACCOUNT_NUMBER=1234-5678-90
```

## 📊 Database Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `bookings` | Booking payments | `paymentMethod`, `status`, `paymentProofUrl` |
| `transactions` | Payment records | `amount`, `type`, `status`, `paymentMethod` |
| `payouts` | Provider payouts | `amount`, `status`, `payoutDetails` |
| `paymentSessions` | GCash sessions | `sessionId`, `status`, `pspReference` |
| `partnerCommissions` | Partner earnings | `commissionAmount`, `status`, `paymentMethod` |

## 🎯 Common Tasks

### 1. Create GCash Payment
```typescript
import { GCashPaymentButton } from '@/components/gcash-payment-button';

<GCashPaymentButton
  bookingId="booking123"
  amount={1500}
  serviceName="House Cleaning"
  onPaymentSuccess={() => router.push('/bookings')}
  onPaymentError={(error) => console.error(error)}
/>
```

### 2. Request Payout
```typescript
import { handleRequestPayout } from '@/ai/flows/request-payout';

await handleRequestPayout({
  providerId: user.uid,
  amount: 2500
});
```

### 3. Validate Payment
```typescript
import { PaymentValidator } from '@/lib/payment-validator';

const validator = PaymentValidator.getInstance();
const result = await validator.validatePaymentAmount(bookingId, amount);
```

### 4. Process Commission
```typescript
import { PartnerCommissionManager } from '@/lib/partner-commission-manager';

await PartnerCommissionManager.processCommissionPayment(
  partnerId,
  commissionIds,
  { paymentMethod: 'gcash', paymentReference: 'PAY-123' }
);
```

## 🔍 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payments/gcash/create` | POST | Create GCash session |
| `/api/payments/gcash/result` | POST | Handle payment result |
| `/api/payments/gcash/webhook` | POST | Adyen webhook |
| `/api/admin/secure-action` | POST | Admin actions |

## 🚨 Troubleshooting

### GCash Payment Issues
- ✅ Check Adyen configuration
- ✅ Verify API keys
- ✅ Check network connectivity
- ✅ Review browser console

### Manual Payment Issues
- ✅ Check file size (max 5MB)
- ✅ Verify file type (JPEG, PNG, WebP)
- ✅ Check Firebase Storage permissions
- ✅ Review admin permissions

### Payout Issues
- ✅ Verify payout details configured
- ✅ Check minimum amount (₱500)
- ✅ Ensure valid payout day (Saturday)
- ✅ Review user permissions

## 📈 Payment Flow

```
Booking Payment:
Client → Payment Page → Method Selection → Processing → Confirmation

Provider Payout:
Provider → Earnings → Request → Admin Review → Processing → Notification

Partner Commission:
Referral → Commission → Calculation → Payment → Management
```

## 🔒 Security Checklist

- ✅ JWT authentication
- ✅ Role-based access control
- ✅ HMAC webhook verification
- ✅ Payment session timeout
- ✅ File upload validation
- ✅ Audit logging
- ✅ Rate limiting

## 📱 Payment Status Codes

| Status | Description |
|--------|-------------|
| `Pending` | Awaiting payment |
| `Pending Verification` | Payment uploaded, awaiting admin |
| `Upcoming` | Payment confirmed, booking scheduled |
| `Completed` | Service completed |
| `Cancelled` | Booking cancelled |
| `Payment Rejected` | Payment proof rejected |

## 💰 Payout Status Codes

| Status | Description |
|--------|-------------|
| `Pending` | Awaiting admin processing |
| `Paid` | Successfully processed |
| `Cancelled` | Payout cancelled |

## 🎛️ Admin Actions

| Action | Endpoint | Required Role |
|--------|----------|---------------|
| Approve Payment | `/admin/transactions` | admin |
| Reject Payment | `/admin/transactions` | admin |
| Process Payout | `/admin/payouts` | admin |
| View Analytics | `/admin/reports` | admin |

## 📊 Monitoring

```typescript
// Check payment metrics
import { PaymentMonitoringService } from '@/lib/payment-monitoring';
const metrics = await PaymentMonitoringService.getDailyMetrics();

// Check system health
import { PaymentProductionValidator } from '@/lib/payment-production-validator';
const health = await PaymentProductionValidator.validateSystemHealth();
```

## 🚀 Development Commands

```bash
# Validate payment system
npm run validate-payments

# Test payment flows
npm run test:payments

# Check production readiness
npm run check-production
```

## 📞 Support

- **Documentation**: `/docs/payment-system-comprehensive-documentation.md`
- **Examples**: Check component usage in existing pages
- **Issues**: Review troubleshooting section
- **Team**: Contact development team for complex issues

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: December 2024