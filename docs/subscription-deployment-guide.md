# Subscription System Deployment Guide

## 🚀 Production Deployment Checklist

This guide ensures the subscription system is properly deployed and configured for production use.

### Prerequisites

- [ ] Firebase project configured with Firestore
- [ ] Firebase Admin SDK credentials set up
- [ ] Payment provider accounts configured (GCash, PayPal, Maya)
- [ ] Environment variables configured
- [ ] Domain and SSL certificate ready

### 1. Environment Configuration

#### Required Environment Variables

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key

# Payment Configuration
ADYEN_API_KEY=your-adyen-api-key
ADYEN_MERCHANT_ACCOUNT=your-merchant-account
ADYEN_ENVIRONMENT=live
ADYEN_CLIENT_KEY=your-client-key
ADYEN_HMAC_KEY=your-hmac-key

PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# GCash Configuration
GCASH_ACCOUNT_NAME=Your Business Name
GCASH_ACCOUNT_NUMBER=your-gcash-number

# Maya Configuration
MAYA_ACCOUNT_NAME=Your Business Name
MAYA_ACCOUNT_NUMBER=your-maya-number

# Bank Transfer Configuration
BANK_ACCOUNT_NAME=Your Business Name Inc.
BANK_ACCOUNT_NUMBER=your-bank-account
BANK_NAME=Your Bank Name
```

### 2. Database Setup

#### Initialize Subscription Plans

```bash
# Run the initialization script
npm run init-subscriptions
```

This will create:
- Provider subscription plans (Free, Pro, Trial)
- Client subscription plans (Free, Premium, Trial)
- Default feature configurations

#### Firestore Security Rules

Update your `firestore.rules` to include subscription collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Subscription Plans (read-only for users)
    match /subscriptionPlans/{planId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin can modify
    }
    
    match /clientSubscriptionPlans/{planId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin can modify
    }
    
    // Provider Subscriptions
    match /providerSubscriptions/{subscriptionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.providerId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.providerId;
    }
    
    // Client Subscriptions
    match /clientSubscriptions/{subscriptionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.clientId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.clientId;
    }
    
    // Usage Tracking
    match /subscriptionUsage/{usageId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.providerId;
    }
    
    match /clientSubscriptionUsage/{usageId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.clientId;
    }
    
    // Payment Records (read-only for users)
    match /subscriptionPayments/{paymentId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.providerId;
      allow write: if false; // Only server can modify
    }
    
    match /clientSubscriptionPayments/{paymentId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.clientId;
      allow write: if false; // Only server can modify
    }
  }
}
```

### 3. Payment Integration Setup

#### GCash (Adyen) Configuration

1. **Adyen Account Setup**
   - Create Adyen merchant account
   - Configure GCash payment method
   - Set up webhook endpoints
   - Test in sandbox environment

2. **Webhook Configuration**
   ```bash
   # Webhook URL for payment notifications
   https://yourdomain.com/api/payments/adyen/webhook
   ```

#### PayPal Configuration

1. **PayPal Developer Account**
   - Create PayPal app
   - Configure webhook endpoints
   - Set up IPN (Instant Payment Notification)

2. **Webhook URL**
   ```bash
   https://yourdomain.com/api/payments/paypal/webhook
   ```

#### Maya Configuration

1. **Maya Business Account**
   - Register for Maya Business
   - Configure payment gateway
   - Set up webhook notifications

### 4. Application Deployment

#### Build and Deploy

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Deploy to your hosting platform
# (Vercel, Netlify, AWS, etc.)
```

#### Health Checks

Create health check endpoints:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      payments: 'configured',
      subscriptions: 'active'
    }
  });
}
```

### 5. Testing and Validation

#### Run Production Readiness Check

```bash
npm run check-production-readiness
```

#### Test Subscription System

```bash
npm run test-subscriptions
```

#### Manual Testing Checklist

- [ ] **Provider Subscription Flow**
  - [ ] Free plan assignment
  - [ ] Trial subscription creation
  - [ ] Trial-to-paid conversion
  - [ ] Feature access validation
  - [ ] Usage tracking

- [ ] **Client Subscription Flow**
  - [ ] Free plan assignment
  - [ ] Trial subscription creation
  - [ ] Trial-to-paid conversion
  - [ ] Feature access validation
  - [ ] Usage tracking

- [ ] **Payment Processing**
  - [ ] GCash payments
  - [ ] PayPal payments
  - [ ] Maya payments
  - [ ] Bank transfer processing
  - [ ] Payment failure handling

- [ ] **Feature Guards**
  - [ ] Provider feature restrictions
  - [ ] Client feature restrictions
  - [ ] Upgrade prompts
  - [ ] Usage limit enforcement

### 6. Monitoring and Analytics

#### Set Up Monitoring

1. **Error Tracking**
   - Configure Sentry or similar service
   - Monitor subscription-related errors
   - Set up alerts for payment failures

2. **Analytics**
   - Track subscription conversions
   - Monitor trial-to-paid rates
   - Analyze feature usage patterns

3. **Performance Monitoring**
   - Monitor API response times
   - Track database query performance
   - Set up uptime monitoring

#### Key Metrics to Monitor

- **Subscription Metrics**
  - Trial signup rate
  - Trial-to-paid conversion rate
  - Monthly recurring revenue (MRR)
  - Churn rate
  - Average revenue per user (ARPU)

- **Payment Metrics**
  - Payment success rate
  - Payment failure rate
  - Average payment processing time
  - Refund rate

- **Feature Usage**
  - Feature adoption rate
  - Usage limit hit rate
  - Upgrade prompt conversion rate

### 7. Security Considerations

#### Data Protection

- [ ] **Encryption**
  - All payment data encrypted in transit
  - Sensitive data encrypted at rest
  - PCI DSS compliance for payment processing

- [ ] **Access Control**
  - Role-based access control implemented
  - API endpoints properly authenticated
  - Admin functions restricted

- [ ] **Audit Logging**
  - All subscription changes logged
  - Payment transactions tracked
  - User actions recorded

#### Compliance

- [ ] **GDPR Compliance**
  - User data export functionality
  - Data deletion capabilities
  - Privacy policy updated

- [ ] **PCI DSS Compliance**
  - Secure payment processing
  - No storage of sensitive payment data
  - Regular security audits

### 8. Backup and Recovery

#### Database Backups

```bash
# Daily automated backups
gcloud firestore export gs://your-backup-bucket/subscriptions-$(date +%Y%m%d)
```

#### Disaster Recovery Plan

1. **Backup Strategy**
   - Daily automated backups
   - Cross-region backup replication
   - Point-in-time recovery capability

2. **Recovery Procedures**
   - Documented recovery steps
   - Tested recovery procedures
   - Recovery time objectives (RTO) defined

### 9. Post-Deployment Tasks

#### Immediate Tasks

- [ ] Verify all payment methods working
- [ ] Test subscription creation flow
- [ ] Validate feature access controls
- [ ] Check webhook endpoints
- [ ] Monitor error logs

#### Ongoing Maintenance

- [ ] **Weekly**
  - Review subscription metrics
  - Check payment success rates
  - Monitor system performance

- [ ] **Monthly**
  - Analyze conversion rates
  - Review feature usage patterns
  - Update subscription plans if needed

- [ ] **Quarterly**
  - Security audit
  - Performance optimization
  - Feature enhancement planning

### 10. Troubleshooting Guide

#### Common Issues

1. **Payment Failures**
   - Check payment provider status
   - Verify webhook endpoints
   - Review error logs

2. **Subscription Not Updating**
   - Check database permissions
   - Verify API endpoint responses
   - Review user authentication

3. **Feature Access Issues**
   - Validate subscription status
   - Check usage limits
   - Review feature guard logic

#### Support Contacts

- **Technical Support**: [your-support-email]
- **Payment Issues**: [payment-support-email]
- **Emergency Contact**: [emergency-phone]

---

## 🎉 Deployment Complete!

Your subscription system is now ready for production use. Monitor the system closely during the first few days and be prepared to address any issues quickly.

For additional support or questions, refer to the troubleshooting guide or contact the development team.
