# Subscription Payment Processing Guide

This guide explains how to process subscription plans by verifying pending transactions in your system.

## Overview

The subscription payment system handles the complete flow from user payment submission to admin verification and activation. Here's how it works:

### 1. Payment Flow
```
User Submits Payment → Pending Verification → Admin Review → Verify/Reject → Transaction Created → User Notified
```

### 2. Key Collections

#### `subscriptionPayments` Collection
Stores all subscription payment submissions with the following statuses:
- `pending_verification`: Payment submitted, awaiting admin review
- `verified`: Payment approved by admin
- `rejected`: Payment rejected by admin

#### `transactions` Collection
Stores completed transaction records with:
- `type: 'subscription_payment'`
- `status: 'completed'`
- Payment details and verification info

#### `users` Collection
User subscription status is updated with:
- `subscriptionStatus`: 'active', 'pending_verification', 'rejected'
- `subscriptionPlanId`: The plan ID
- `role`: Updated to 'provider' or 'agency' based on plan type

## Using the Subscription Payment Processor

### 1. Basic Usage

```typescript
import { SubscriptionPaymentProcessor } from '@/lib/subscription-payment-processor';

// Get all pending payments
const pendingPayments = await SubscriptionPaymentProcessor.getPendingSubscriptionPayments();

// Verify a payment
const result = await SubscriptionPaymentProcessor.verifySubscriptionPayment(
  paymentId, 
  adminUserId
);

// Reject a payment
const result = await SubscriptionPaymentProcessor.rejectSubscriptionPayment(
  paymentId, 
  adminUserId, 
  'Insufficient payment proof'
);
```

### 2. Admin Interface

Use the `AdminSubscriptionProcessor` component in your admin dashboard:

```tsx
import { AdminSubscriptionProcessor } from '@/components/admin-subscription-processor';

export default function AdminDashboard() {
  return (
    <div>
      <AdminSubscriptionProcessor />
    </div>
  );
}
```

### 3. API Endpoints

#### Process Payments
```bash
POST /api/subscription-payments/process
Content-Type: application/json

{
  "action": "verify",
  "paymentId": "payment_id_here",
  "verifiedBy": "admin_user_id"
}
```

#### Get Payment Data
```bash
GET /api/subscription-payments/process?type=pending
GET /api/subscription-payments/process?type=all
GET /api/subscription-payments/process?type=stats
```

## Processing Steps

### Step 1: Review Pending Payments

1. Access the admin subscription payments page
2. View all pending payments with payment proofs
3. Check payment details (amount, method, reference number)

### Step 2: Verify Payment

When verifying a payment, the system will:
1. Update payment status to 'verified'
2. Activate user subscription
3. Update user role (provider/agency)
4. Create transaction record
5. Send notification to user
6. Set subscription renewal date

### Step 3: Reject Payment (if needed)

When rejecting a payment:
1. Update payment status to 'rejected'
2. Set rejection reason
3. Update user subscription status
4. Send notification to user
5. Allow user to resubmit

## Status Tracking

### Payment Statuses
- `pending_verification`: Initial state after user submission
- `verified`: Payment approved, subscription active
- `rejected`: Payment rejected, user can resubmit

### User Subscription Statuses
- `pending_verification`: Payment submitted, awaiting review
- `active`: Subscription active, user has premium access
- `rejected`: Payment rejected, user needs to resubmit

### Transaction Statuses
- `completed`: Payment verified and processed
- `pending`: Payment awaiting verification
- `failed`: Payment failed or rejected

## Best Practices

### 1. Regular Processing
- Check for pending payments daily
- Process payments within 24 hours
- Send notifications promptly

### 2. Verification Guidelines
- Verify payment amount matches plan price
- Check payment method and reference number
- Ensure payment proof is clear and valid
- Verify user identity if needed

### 3. Rejection Handling
- Provide clear rejection reasons
- Allow users to resubmit easily
- Follow up on rejected payments

### 4. Monitoring
- Track processing times
- Monitor rejection rates
- Review payment methods usage
- Check for fraudulent payments

## Error Handling

### Common Issues
1. **Payment not found**: Check payment ID
2. **Already processed**: Payment already verified/rejected
3. **Invalid status**: Payment not in pending state
4. **User not found**: Check user ID in payment record

### Troubleshooting
```typescript
try {
  const result = await SubscriptionPaymentProcessor.verifySubscriptionPayment(
    paymentId, 
    adminUserId
  );
  
  if (!result.success) {
    console.error('Verification failed:', result.message);
    // Handle error appropriately
  }
} catch (error) {
  console.error('Error:', error);
  // Handle exception
}
```

## Integration Examples

### 1. Admin Dashboard Integration

```tsx
// Add to your admin dashboard
import { AdminSubscriptionProcessor } from '@/components/admin-subscription-processor';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1>Admin Dashboard</h1>
      <AdminSubscriptionProcessor />
    </div>
  );
}
```

### 2. Automated Processing

```typescript
// Set up automated processing (e.g., cron job)
async function processPendingPayments() {
  try {
    const result = await SubscriptionPaymentProcessor.processPendingPayments(
      'system_admin_id',
      false // Don't auto-verify, just mark as reviewed
    );
    
    console.log(`Processed ${result.processed} payments`);
    if (result.errors.length > 0) {
      console.error('Errors:', result.errors);
    }
  } catch (error) {
    console.error('Batch processing failed:', error);
  }
}
```

### 3. Webhook Integration

```typescript
// Handle external payment notifications
export async function POST(request: NextRequest) {
  const { paymentId, status } = await request.json();
  
  if (status === 'completed') {
    // Auto-verify if payment is confirmed by external system
    await SubscriptionPaymentProcessor.verifySubscriptionPayment(
      paymentId,
      'system_webhook'
    );
  }
}
```

## Security Considerations

1. **Admin Access**: Ensure only admins can verify payments
2. **Payment Proof**: Validate uploaded images
3. **Amount Verification**: Always verify payment amounts
4. **User Identity**: Confirm user identity for large payments
5. **Audit Trail**: Keep logs of all verification actions

## Monitoring and Analytics

### Key Metrics
- Processing time per payment
- Verification success rate
- Rejection rate by reason
- Revenue from verified payments
- User satisfaction with process

### Reports
- Daily/weekly payment summaries
- Processing performance metrics
- Rejection analysis
- Revenue tracking

This system provides a comprehensive solution for processing subscription payments with proper verification, status tracking, and user notifications.
