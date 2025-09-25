# Manual Payment Verification System

## Overview

The manual payment verification system allows users to pay for bookings using local payment methods (GCash, PayMaya, Bank Transfer) and provides an admin interface for verification.

## Features

### For Users
- **Multiple Payment Methods**: GCash, PayMaya, and Bank Transfer
- **Payment Instructions**: Step-by-step instructions for each payment method
- **Account Details**: Secure display of payment account information
- **Proof Upload**: Upload payment receipts/screenshots
- **Reference Number**: Generate or enter payment reference numbers
- **Status Tracking**: Real-time payment status updates

### For Admins
- **Verification Interface**: Review pending booking payments
- **Payment Proof Viewing**: View uploaded payment proofs
- **Approve/Reject**: Approve or reject payments with reasons
- **User Notifications**: Automatic notifications to users
- **Audit Trail**: Complete payment history and verification logs

## How It Works

### User Payment Flow

1. **Select Service**: User chooses a service and provider
2. **Choose Payment Method**: Select between automated GCash or Manual Payment
3. **Payment Instructions**: Follow step-by-step instructions for chosen method
4. **Make Payment**: Complete payment using their preferred method
5. **Upload Proof**: Upload screenshot/receipt of payment
6. **Submit**: Submit payment for admin verification
7. **Wait for Verification**: Receive notification once verified

### Admin Verification Flow

1. **Receive Notification**: Admin gets notified of new payment
2. **Review Payment**: Access admin panel to view payment details
3. **Verify Proof**: Check payment proof against booking details
4. **Approve/Reject**: Make decision and provide reason if rejecting
5. **Update Status**: System automatically updates booking payment status
6. **Send Notifications**: User receives confirmation or rejection notice

## Payment Methods Supported

### GCash
- **Account Name**: LocalPro Services
- **Account Number**: 09179157515 (configurable via environment)
- **Instructions**: Send money via GCash app with exact amount

### PayMaya
- **Account Name**: LocalPro Services  
- **Account Number**: 09179157515 (configurable via environment)
- **Instructions**: Send money via PayMaya app with exact amount

### Bank Transfer (BPI)
- **Account Name**: LocalPro Services Inc.
- **Account Number**: 1234-5678-90 (configurable via environment)
- **Bank Name**: BPI
- **Instructions**: Transfer via online banking or mobile app

## Configuration

### Environment Variables

```bash
# GCash Configuration
GCASH_ACCOUNT_NAME=LocalPro Services
GCASH_ACCOUNT_NUMBER=09179157515

# PayMaya Configuration  
MAYA_ACCOUNT_NAME=LocalPro Services
MAYA_ACCOUNT_NUMBER=09179157515

# Bank Transfer Configuration
BANK_ACCOUNT_NAME=LocalPro Services Inc.
BANK_ACCOUNT_NUMBER=1234-5678-90
BANK_NAME=BPI
```

### Database Collections

#### bookingPayments
```typescript
{
  id: string;
  bookingId: string;
  clientId: string;
  providerId: string;
  amount: number;
  paymentMethod: 'gcash' | 'maya' | 'bank';
  referenceNumber: string;
  paymentProofUrl: string;
  notes?: string;
  status: 'pending_verification' | 'verified' | 'rejected';
  createdAt: Timestamp;
  verifiedAt?: Timestamp;
  verifiedBy?: string;
  rejectionReason?: string;
}
```

## Admin Interface

### Access
- Navigate to `/admin/payments`
- Requires admin role
- Shows all pending verification payments

### Verification Process
1. **View Payment Details**: Click eye icon to view full payment information
2. **Review Proof**: Check uploaded payment proof image
3. **Verify Amount**: Ensure payment amount matches booking price
4. **Check Reference**: Verify reference number is valid
5. **Approve**: Click "Verify Payment" to approve
6. **Reject**: Click "Reject" and provide reason

### Actions Available
- **Approve Payment**: Verifies payment and confirms booking
- **Reject Payment**: Rejects payment with reason, allows resubmission
- **View Proof**: Full-screen view of payment proof
- **User Details**: Access to user information and contact details

## Security Features

### Payment Validation
- **Amount Verification**: Ensures exact payment amount
- **Duplicate Detection**: Prevents duplicate payments
- **File Validation**: Validates uploaded proof files
- **Reference Verification**: Checks payment reference numbers

### Admin Security
- **Role-based Access**: Only admins can verify payments
- **Audit Trail**: All actions are logged with timestamps
- **Secure File Storage**: Payment proofs stored securely
- **Notification System**: Real-time notifications for all parties

## Notifications

### User Notifications
- **Payment Submitted**: Confirmation when payment is submitted
- **Payment Verified**: Success notification when approved
- **Payment Rejected**: Rejection notice with reason

### Admin Notifications
- **New Payment**: Alert when new payment needs verification
- **Payment Status**: Updates on payment verification status

## Best Practices

### For Users
1. **Exact Amount**: Send exactly the booking amount
2. **Clear Proof**: Upload clear, readable payment receipts
3. **Valid Reference**: Use the provided reference number
4. **Timely Submission**: Submit payment proof promptly

### For Admins
1. **Quick Response**: Verify payments within 24 hours
2. **Thorough Review**: Check all payment details carefully
3. **Clear Communication**: Provide clear rejection reasons
4. **Documentation**: Keep records of all verification actions

## Troubleshooting

### Common Issues

#### Payment Not Showing
- Check if payment was submitted correctly
- Verify user has proper permissions
- Check database for payment record

#### Proof Upload Failed
- Ensure file is under 5MB
- Check file format (JPEG, PNG, WebP only)
- Verify internet connection

#### Verification Failed
- Check admin permissions
- Verify payment details match
- Ensure all required fields are present

### Support
For technical issues or questions about the payment verification system, contact the development team or check the system logs for detailed error information.
