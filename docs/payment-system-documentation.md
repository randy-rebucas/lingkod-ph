# Payment System Documentation

## Overview

The Lingkod PH payment system is a comprehensive solution that handles multiple payment methods, verification processes, and transaction management. The system supports both automated payments (PayPal) and manual payment verification for local payment methods (GCash, Maya, Bank Transfer).

## Architecture

### Core Components

1. **Payment Page** (`src/app/(app)/bookings/[bookingId]/payment/page.tsx`)
   - User interface for payment instructions and proof upload
   - Supports multiple payment methods
   - Real-time status updates

2. **Admin Transaction Management** (`src/app/(app)/admin/transactions/page.tsx`)
   - Payment verification interface for administrators
   - Approve/reject payment functionality
   - Payment proof viewing

3. **Payment History** (`src/app/(app)/payments/page.tsx`)
   - User transaction history
   - Detailed transaction information
   - Status tracking

4. **Payment Notifications** (`src/lib/payment-notifications.ts`)
   - Email notifications for payment events
   - Automated communication system

5. **Admin API** (`src/app/api/admin/secure-action/route.ts`)
   - Secure payment operations
   - Refund processing
   - Audit logging

## Payment Methods

### 1. PayPal Integration
- **File**: `src/components/paypal-checkout-button.tsx`
- **Features**:
  - Direct payment processing
  - Automatic verification
  - Subscription payments
  - Real-time status updates

### 2. Manual Payment Methods
- **GCash**: Account number and QR code provided
- **Maya**: Account number provided
- **Bank Transfer (BPI)**: Account details provided
- **Process**: Manual proof upload → Admin verification

## Payment Flow

### For Clients

1. **Payment Instructions**
   ```
   Client books service → Redirected to payment page → Choose payment method
   ```

2. **PayPal Payment**
   ```
   Select PayPal → Complete payment → Automatic verification → Booking confirmed
   ```

3. **Manual Payment**
   ```
   Select GCash/Maya/Bank → Make payment → Upload proof → Wait for verification
   ```

4. **Payment Status Tracking**
   - `Pending Payment`: Initial state
   - `Pending Verification`: Proof uploaded, awaiting admin review
   - `Upcoming`: Payment approved, booking confirmed
   - `Payment Rejected`: Payment rejected with reason
   - `Completed`: Service completed

### For Administrators

1. **Payment Verification**
   ```
   Admin receives notification → Reviews payment proof → Approve/Reject
   ```

2. **Approval Process**
   - View payment proof
   - Verify payment details
   - Approve payment
   - Notify client and provider
   - Create transaction record

3. **Rejection Process**
   - View payment proof
   - Identify issues
   - Provide rejection reason
   - Notify client
   - Allow re-upload

## Database Schema

### Bookings Collection
```typescript
{
  id: string;
  status: "Pending Payment" | "Pending Verification" | "Upcoming" | "In Progress" | "Completed" | "Cancelled" | "Payment Rejected";
  paymentProofUrl?: string;
  paymentRejectionReason?: string;
  paymentRejectedAt?: Timestamp;
  paymentRejectedBy?: string;
  paymentVerifiedAt?: Timestamp;
  paymentVerifiedBy?: string;
  // ... other booking fields
}
```

### Transactions Collection
```typescript
{
  id: string;
  bookingId?: string;
  clientId: string;
  providerId?: string;
  amount: number;
  type: 'booking_payment' | 'subscription_payment' | 'payout_request' | 'refund';
  status: 'pending' | 'completed' | 'rejected' | 'failed' | 'refunded';
  paymentMethod: string;
  createdAt: Timestamp;
  verifiedAt?: Timestamp;
  verifiedBy?: string;
  rejectedAt?: Timestamp;
  rejectedBy?: string;
  rejectionReason?: string;
  refundReason?: string;
  refundAmount?: number;
  refundedBy?: string;
  refundedAt?: Timestamp;
  paypalOrderId?: string;
  payerEmail?: string;
}
```

## Key Features

### 1. Payment Proof Upload
- **File Types**: Images (JPG, PNG, etc.)
- **Storage**: Firebase Storage
- **Path**: `payment-proofs/{bookingId}/{timestamp}_{filename}`
- **Security**: Access control and validation

### 2. Real-time Notifications
- **In-app**: Firebase Firestore notifications
- **Email**: Automated email notifications
- **Recipients**: Clients, providers, admins

### 3. Payment Verification
- **Admin Interface**: Dedicated verification page
- **Actions**: Approve, reject with reason
- **Audit Trail**: Complete action logging
- **Notifications**: Automatic user notifications

### 4. Refund Processing
- **Admin API**: Secure refund endpoint
- **Process**: Update transaction status, notify user
- **Tracking**: Complete refund history
- **Booking Updates**: Automatic booking cancellation

### 5. Payment History
- **User View**: Complete transaction history
- **Details**: Amount, method, status, dates
- **Filtering**: By type, status, date range
- **Export**: Transaction details for records

## Security Features

### 1. Access Control
- **Role-based**: Admin-only verification access
- **Authentication**: Firebase Auth integration
- **Session Management**: Secure session handling

### 2. Data Validation
- **File Upload**: Type and size validation
- **Payment Data**: Amount and method validation
- **Input Sanitization**: XSS protection

### 3. Audit Logging
- **Actions**: All payment operations logged
- **Details**: User, timestamp, action, result
- **Compliance**: Financial audit trail

### 4. Rate Limiting
- **Upload Limits**: Prevent abuse
- **API Limits**: Protect endpoints
- **User Limits**: Per-user restrictions

## API Endpoints

### Admin Payment Operations
```
POST /api/admin/secure-action
{
  "action": "financial",
  "operation": "verify_payment",
  "data": {
    "bookingId": "string",
    "action": "approve" | "reject",
    "reason": "string" // for rejections
  }
}
```

### Refund Processing
```
POST /api/admin/secure-action
{
  "action": "financial",
  "operation": "refund_transaction",
  "data": {
    "transactionId": "string",
    "reason": "string",
    "amount": "number" // optional, defaults to full amount
  }
}
```

## Email Notifications

### Payment Approved
- **Subject**: "Payment Confirmed - {Service Name}"
- **Content**: Booking details, confirmation message
- **Action**: View bookings link

### Payment Rejected
- **Subject**: "Payment Rejected - {Service Name}"
- **Content**: Rejection reason, next steps
- **Action**: Upload new payment link

### Payment Upload Confirmation
- **Subject**: "Payment Proof Received - {Service Name}"
- **Content**: Confirmation of receipt, next steps
- **Action**: View bookings link

### Refund Processed
- **Subject**: "Refund Processed - {Service Name}"
- **Content**: Refund details, timeline
- **Action**: View payment history link

## Configuration

### Environment Variables
```env
# Payment Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
```

### Payment Method Configuration
```typescript
// GCash Configuration
const gcashConfig = {
  accountName: "Lingkod PH Services",
  accountNumber: "0917-123-4567",
  qrCode: "base64_encoded_qr_code"
};

// Bank Transfer Configuration
const bankConfig = {
  accountName: "Lingkod PH Services Inc.",
  accountNumber: "1234-5678-90",
  bankName: "BPI"
};
```

## Error Handling

### Common Error Scenarios

1. **Upload Failures**
   - File size too large
   - Invalid file type
   - Network issues
   - Storage quota exceeded

2. **Payment Verification**
   - Invalid payment proof
   - Amount mismatch
   - Duplicate payments
   - Expired proofs

3. **System Errors**
   - Database connection issues
   - Email service failures
   - Authentication errors
   - Rate limit exceeded

### Error Recovery

1. **Retry Mechanisms**
   - Automatic retry for transient failures
   - User-initiated retry options
   - Exponential backoff

2. **Fallback Options**
   - Alternative payment methods
   - Manual processing
   - Support contact

3. **User Communication**
   - Clear error messages
   - Next steps guidance
   - Support contact information

## Monitoring and Analytics

### Key Metrics
- Payment success rate
- Verification time
- Rejection rate
- Refund rate
- User satisfaction

### Logging
- Payment events
- Admin actions
- System errors
- Performance metrics

### Alerts
- High rejection rates
- System failures
- Security incidents
- Performance degradation

## Testing

### Test Scenarios

1. **Payment Upload**
   - Valid file upload
   - Invalid file types
   - Large file handling
   - Network interruptions

2. **Payment Verification**
   - Admin approval flow
   - Admin rejection flow
   - Notification delivery
   - Status updates

3. **Refund Processing**
   - Full refunds
   - Partial refunds
   - Error handling
   - Notification delivery

### Test Data
```typescript
// Sample booking for testing
const testBooking = {
  id: "test-booking-123",
  serviceName: "House Cleaning",
  amount: 1500,
  clientId: "test-client-123",
  providerId: "test-provider-123",
  status: "Pending Verification"
};
```

## Deployment Considerations

### Production Setup
1. **SSL Certificates**: Required for payment processing
2. **Firebase Rules**: Secure database access
3. **Storage Rules**: Secure file uploads
4. **Email Service**: Reliable SMTP provider
5. **Monitoring**: Error tracking and alerts

### Security Checklist
- [ ] HTTPS enabled
- [ ] Firebase security rules configured
- [ ] File upload validation
- [ ] Rate limiting enabled
- [ ] Audit logging active
- [ ] Error handling implemented
- [ ] Input validation in place

## Maintenance

### Regular Tasks
1. **Monitor payment success rates**
2. **Review rejected payments**
3. **Update payment method information**
4. **Clean up old payment proofs**
5. **Review audit logs**
6. **Update security measures**

### Backup Strategy
1. **Database backups**: Daily automated backups
2. **File storage**: Redundant storage
3. **Configuration**: Version control
4. **Documentation**: Regular updates

## Support and Troubleshooting

### Common Issues

1. **Payment not showing as verified**
   - Check admin verification queue
   - Verify notification delivery
   - Check database status

2. **Upload failures**
   - Check file size and type
   - Verify storage permissions
   - Check network connectivity

3. **Email not received**
   - Check spam folder
   - Verify email configuration
   - Check SMTP logs

### Support Contacts
- **Technical Issues**: development@lingkodph.com
- **Payment Issues**: payments@lingkodph.com
- **General Support**: support@lingkodph.com

## Future Enhancements

### Planned Features
1. **Automated Payment Verification**: AI-powered proof validation
2. **Multiple Currency Support**: International payment methods
3. **Payment Scheduling**: Recurring payment options
4. **Advanced Analytics**: Detailed payment insights
5. **Mobile App Integration**: Native mobile payments
6. **API Integration**: Third-party payment processors

### Technical Improvements
1. **Performance Optimization**: Faster upload and processing
2. **Enhanced Security**: Additional fraud detection
3. **Better UX**: Improved user interface
4. **Scalability**: Handle higher transaction volumes
5. **Integration**: More payment method options

---

## Conclusion

The Lingkod PH payment system provides a robust, secure, and user-friendly solution for handling various payment methods and verification processes. The system is designed to scale with the platform's growth while maintaining security and reliability standards.

For technical support or questions about the payment system, please contact the development team or refer to the API documentation for detailed implementation guides.
