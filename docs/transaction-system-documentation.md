# Transaction System Documentation

## Overview

The Lingkod PH transaction system has been completely redesigned to provide comprehensive transaction tracking and management across all platform entities. The new system supports multiple transaction types, entities, and actions with proper categorization and filtering capabilities.

## Key Features

- **Comprehensive Transaction Types**: Support for bookings, subscriptions, payouts, advertisements, commissions, refunds, loyalty points, penalties, bonuses, and system transactions
- **Flexible Entity-Action Model**: Each transaction has an entity (what it's related to) and an action (what's happening)
- **Backward Compatibility**: Seamless migration from legacy transaction format
- **Advanced Filtering**: Filter transactions by entity, action, status, payment method, date range, and amount
- **Type Safety**: Full TypeScript support with proper interfaces and type guards
- **Audit Trail**: Complete transaction history with metadata and verification tracking

## Transaction Entities

### 1. Booking Transactions
- **Entity**: `TransactionEntity.BOOKING`
- **Actions**: Payment, Payment Verification, Payment Rejection
- **Use Cases**: Service booking payments, payment verification by admins, payment rejections

### 2. Subscription Transactions
- **Entity**: `TransactionEntity.SUBSCRIPTION`
- **Actions**: Purchase, Renewal, Upgrade, Downgrade, Cancellation
- **Use Cases**: Provider/agency subscription payments, plan changes, renewals

### 3. Payout Transactions
- **Entity**: `TransactionEntity.PAYOUT`
- **Actions**: Request, Processing, Completion, Rejection
- **Use Cases**: Provider payout requests, admin processing, completed payouts

### 4. Advertisement Transactions
- **Entity**: `TransactionEntity.ADVERTISEMENT`
- **Actions**: Creation, Renewal, Boost, Promotion
- **Use Cases**: Service promotion payments, profile boosts, featured listings

### 5. Commission Transactions
- **Entity**: `TransactionEntity.COMMISSION`
- **Actions**: Earned, Payout, Adjustment
- **Use Cases**: Partner commission tracking, commission payments

### 6. Refund Transactions
- **Entity**: `TransactionEntity.REFUND`
- **Actions**: Request, Processing, Completion, Rejection
- **Use Cases**: Booking refunds, subscription refunds, system refunds

### 7. Loyalty Transactions
- **Entity**: `TransactionEntity.LOYALTY`
- **Actions**: Points Earned, Points Redeemed, Points Expired, Points Adjustment
- **Use Cases**: Loyalty point tracking, redemptions, adjustments

### 8. Penalty Transactions
- **Entity**: `TransactionEntity.PENALTY`
- **Actions**: Applied, Waived
- **Use Cases**: Service violations, penalty tracking

### 9. Bonus Transactions
- **Entity**: `TransactionEntity.BONUS`
- **Actions**: Awarded, Adjustment
- **Use Cases**: Performance bonuses, referral bonuses, special rewards

### 10. System Transactions
- **Entity**: `TransactionEntity.SYSTEM`
- **Actions**: Adjustment, Refund, Credit
- **Use Cases**: System corrections, administrative adjustments

## Transaction Statuses

- **Pending**: Transaction is waiting for processing
- **Completed**: Transaction has been successfully processed
- **Failed**: Transaction failed to process
- **Cancelled**: Transaction was cancelled
- **Rejected**: Transaction was rejected
- **Refunded**: Transaction has been refunded
- **Processing**: Transaction is currently being processed
- **Verified**: Transaction has been verified by admin
- **Expired**: Transaction has expired

## Payment Methods

- **GCash**: GCash mobile payment
- **Maya**: Maya mobile payment
- **Bank Transfer**: Bank transfer payment
- **PayPal**: PayPal payment
- **Credit Card**: Credit card payment
- **Debit Card**: Debit card payment
- **Cash**: Cash payment
- **Manual Verification**: Manually verified payment
- **System Credit**: System-generated credit
- **Loyalty Points**: Loyalty points redemption

## Usage Examples

### Creating a Booking Transaction

```typescript
import { TransactionService } from '@/lib/transaction-service';
import { TransactionAction, TransactionStatus } from '@/lib/transaction-types';

// Create a booking payment transaction
const result = await TransactionService.createBookingTransaction(
  {
    bookingId: 'booking-123',
    clientId: 'client-456',
    providerId: 'provider-789',
    amount: 1500,
    paymentMethod: PaymentMethod.GCASH,
    serviceName: 'House Cleaning',
    referenceNumber: 'GC123456789'
  },
  TransactionAction.PAYMENT,
  TransactionStatus.PENDING
);
```

### Creating a Subscription Transaction

```typescript
// Create a subscription purchase transaction
const result = await TransactionService.createSubscriptionTransaction(
  {
    userId: 'user-123',
    planId: 'provider-premium',
    planName: 'Provider Premium',
    planType: 'provider',
    amount: 299,
    paymentMethod: PaymentMethod.PAYPAL,
    paypalOrderId: 'PAYPAL-ORDER-123'
  },
  TransactionAction.SUBSCRIPTION_PURCHASE,
  TransactionStatus.COMPLETED
);
```

### Creating a Payout Transaction

```typescript
// Create a payout request transaction
const result = await TransactionService.createPayoutTransaction(
  {
    payoutId: 'payout-123',
    providerId: 'provider-456',
    amount: 5000,
    payoutDetails: {
      method: 'bank_transfer',
      accountName: 'John Doe',
      accountNumber: '1234567890',
      bankName: 'BDO'
    }
  },
  TransactionAction.PAYOUT_REQUEST,
  TransactionStatus.PENDING
);
```

### Querying Transactions

```typescript
// Get all booking transactions for a user
const { transactions } = await TransactionService.getTransactions({
  entity: TransactionEntity.BOOKING,
  userId: 'user-123',
  status: TransactionStatus.COMPLETED
});

// Get transactions within a date range
const { transactions } = await TransactionService.getTransactions({
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date('2024-01-31'),
  amountMin: 1000
});
```

### Getting Transaction Statistics

```typescript
// Get transaction statistics
const stats = await TransactionService.getTransactionStats({
  entity: TransactionEntity.SUBSCRIPTION,
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date('2024-01-31')
});

console.log(`Total subscription revenue: ₱${stats.totalAmount}`);
console.log(`Total subscriptions: ${stats.totalTransactions}`);
```

## Migration from Legacy Format

The system includes a migration script to convert existing transactions from the legacy format to the new format:

```bash
# Run migration
npm run migrate-transactions migrate

# Validate migration
npm run migrate-transactions validate

# Rollback if needed
npm run migrate-transactions rollback
```

### Legacy to New Format Mapping

| Legacy Type | New Entity | New Action |
|-------------|------------|------------|
| `booking_payment` | `BOOKING` | `PAYMENT_VERIFICATION` (if completed) |
| `subscription_payment` | `SUBSCRIPTION` | `SUBSCRIPTION_PURCHASE` |
| `payout_request` | `PAYOUT` | `PAYOUT_REQUEST` |
| `payout_processed` | `PAYOUT` | `PAYOUT_COMPLETION` |
| `refund` | `REFUND` | `REFUND_COMPLETION` |

## Transaction Display Component

The system includes a comprehensive transaction display component that supports:

- **Filtering**: By entity, action, status, payment method, date range, amount
- **Search**: By transaction ID, reference number, description
- **Details View**: Complete transaction information with metadata
- **Backward Compatibility**: Displays both legacy and new format transactions

```typescript
import TransactionDisplay from '@/components/transaction-display';

// Basic usage
<TransactionDisplay 
  userId="user-123"
  showFilters={true}
  limit={50}
  title="My Transactions"
  description="View all your transaction history"
/>

// Admin view with all transactions
<TransactionDisplay 
  showFilters={true}
  limit={100}
  title="All Transactions"
  description="View all platform transactions"
  showActions={true}
/>
```

## Database Schema

### New Transaction Document Structure

```typescript
{
  id: string;
  entity: TransactionEntity;
  action: TransactionAction;
  status: TransactionStatus;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  userId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  
  // Entity-specific fields
  bookingId?: string;
  clientId?: string;
  providerId?: string;
  subscriptionId?: string;
  payoutId?: string;
  advertisementId?: string;
  commissionId?: string;
  refundId?: string;
  
  // Common fields
  referenceNumber?: string;
  paypalOrderId?: string;
  payerEmail?: string;
  verifiedBy?: string;
  verifiedAt?: Timestamp;
  rejectedBy?: string;
  rejectedAt?: Timestamp;
  rejectionReason?: string;
  
  // Metadata
  metadata?: Record<string, any>;
}
```

## Security Considerations

- **Access Control**: Transactions are filtered by user ID to ensure users only see their own transactions
- **Admin Override**: Admin users can view all transactions with proper authorization
- **Audit Trail**: All transaction modifications are logged with timestamps and user information
- **Data Validation**: All transaction data is validated before creation and updates

## Performance Considerations

- **Indexing**: Proper Firestore indexes are required for efficient querying
- **Pagination**: Large transaction lists are paginated to improve performance
- **Caching**: Transaction statistics can be cached for better performance
- **Batch Operations**: Multiple transactions can be processed in batches

## Error Handling

The transaction system includes comprehensive error handling:

- **Validation Errors**: Input validation with detailed error messages
- **Database Errors**: Proper error handling for Firestore operations
- **Migration Errors**: Detailed error reporting during migration
- **Rollback Support**: Ability to rollback failed migrations

## Future Enhancements

- **Real-time Notifications**: WebSocket support for real-time transaction updates
- **Advanced Analytics**: More detailed transaction analytics and reporting
- **Export Functionality**: Export transactions to CSV/Excel
- **API Integration**: REST API for external transaction management
- **Webhook Support**: Webhook notifications for transaction events

## Troubleshooting

### Common Issues

1. **Migration Failures**: Check Firestore permissions and indexes
2. **Query Performance**: Ensure proper indexes are created
3. **Type Errors**: Verify all imports are correct
4. **Display Issues**: Check component props and data format

### Support

For issues or questions about the transaction system, please refer to:
- Code documentation in `/src/lib/transaction-*.ts`
- Component documentation in `/src/components/transaction-display.tsx`
- Migration script in `/src/scripts/migrate-transactions.ts`
