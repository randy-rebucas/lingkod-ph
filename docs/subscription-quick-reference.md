# Subscription System - Quick Reference Guide

## 🚀 Quick Start

### 1. Initialize Default Plans
```typescript
import { subscriptionService } from '@/lib/subscription-service';

// Run once to create default subscription plans
await subscriptionService.initializeDefaultPlans();
```

### 2. Check Feature Access
```tsx
import { useFeatureAccess } from '@/hooks/use-subscription';

const { hasAccess } = useFeatureAccess('performance_analytics');
```

### 3. Protect Pro Features
```tsx
import { FeatureGuard } from '@/components/feature-guard';

<FeatureGuard feature="performance_analytics">
  <AnalyticsDashboard />
</FeatureGuard>
```

---

## 📋 Subscription Plans

| Feature | Free | Pro (₱399/month) |
|---------|------|------------------|
| Job Applications | 10/month | 50/month |
| Services | 5 | 20 |
| Bookings | 20/month | 100/month |
| Featured Placement | ❌ | ✅ |
| Priority Job Access | ❌ | ✅ |
| Performance Analytics | ❌ | ✅ |
| Pro Badge | ❌ | ✅ |
| Supplies Discounts | ❌ | ✅ |

---

## 🔧 API Endpoints

### Get Plans
```bash
GET /api/subscriptions/plans
```

### Get Current Subscription
```bash
GET /api/subscriptions/current
Authorization: Bearer <token>
```

### Create Subscription
```bash
POST /api/subscriptions/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "plan_id",
  "paymentMethod": "paypal",
  "paymentReference": "payment_id",
  "amount": 399
}
```

### Check Feature Access
```bash
POST /api/subscriptions/check-access
Authorization: Bearer <token>
Content-Type: application/json

{
  "feature": "featured_placement"
}
```

---

## 🎯 Feature Keys

```typescript
const FEATURES = {
  FEATURED_PLACEMENT: 'featured_placement',
  PRIORITY_JOB_ACCESS: 'priority_job_access',
  PERFORMANCE_ANALYTICS: 'performance_analytics',
  PRO_BADGE: 'pro_badge',
  SUPPLIES_DISCOUNT: 'supplies_discount',
  EXTENDED_JOB_APPLICATIONS: 'extended_job_applications',
  EXTENDED_SERVICES: 'extended_services',
  EXTENDED_BOOKINGS: 'extended_bookings'
};
```

---

## 🧩 Components

### Payment Button
```tsx
<SubscriptionPaymentButton
  plan={proPlan}
  onPaymentSuccess={(id) => console.log('Success:', id)}
  onPaymentError={(error) => console.error('Error:', error)}
/>
```

### Pro Badge
```tsx
<VerifiedProBadge variant="large" />
<SubscriptionBadge tier="pro" variant="compact" />
```

### Feature Guards
```tsx
<AnalyticsGuard>
  <AnalyticsDashboard />
</AnalyticsGuard>

<FeaturedPlacementGuard>
  <FeaturedProviderCard />
</FeaturedPlacementGuard>

<PriorityJobGuard>
  <HighValueJobCard />
</PriorityJobGuard>
```

---

## 🎣 Hooks

### Main Subscription Hook
```tsx
const {
  subscription,
  plans,
  loading,
  checkFeatureAccess,
  refreshSubscription,
  upgradeToPro
} = useSubscription();
```

### Feature Access Hook
```tsx
const { hasAccess, loading, remainingUsage, limit } = useFeatureAccess('featured_placement');
```

### Pro Status Hook
```tsx
const { isPro, isActive, subscription } = useProSubscription();
```

---

## 🗄️ Database Collections

| Collection | Purpose |
|------------|---------|
| `subscriptionPlans` | Available plans and features |
| `providerSubscriptions` | Active provider subscriptions |
| `subscriptionUsage` | Monthly usage tracking |
| `subscriptionPayments` | Payment history |
| `suppliesDiscounts` | Partner discount offers |
| `subscriptionAnalytics` | Performance metrics |

---

## 🔐 Security Rules

```javascript
// Firestore Rules
match /subscriptionPlans/{planId} {
  allow read: if true;
  allow write: if isAdmin();
}

match /providerSubscriptions/{subscriptionId} {
  allow read: if isOwner(resource.data.providerId) || isAdmin();
  allow write: if isAdmin();
}
```

---

## 🛠️ Services

### Subscription Service
```typescript
import { subscriptionService } from '@/lib/subscription-service';

// Get plans
const plans = await subscriptionService.getSubscriptionPlans();

// Get provider subscription
const subscription = await subscriptionService.getProviderSubscription(providerId);

// Check feature access
const access = await subscriptionService.checkFeatureAccess(providerId, 'featured_placement');

// Record usage
await subscriptionService.recordFeatureUsage(providerId, 'priority_job_access');
```

### Job Priority Service
```typescript
import { JobPriorityService } from '@/lib/job-priority-service';

// Get jobs with priority
const jobs = await JobPriorityService.getJobsWithPriority(providerId);

// Get priority jobs only
const priorityJobs = await JobPriorityService.getPriorityJobs(providerId);

// Record priority access
await JobPriorityService.recordPriorityJobAccess(providerId, jobId, 'high_value');
```

### Provider Ranking Service
```typescript
import { providerRankingService } from '@/lib/provider-ranking-service';

// Get ranked providers
const providers = await providerRankingService.getRankedProviders();

// Get featured providers
const featured = await providerRankingService.getFeaturedProviders(5);

// Search with ranking
const results = await providerRankingService.searchProviders(searchTerm);
```

---

## 🎨 UI Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/subscription` | Provider | Subscription management |
| `/analytics` | Provider | Performance analytics (Pro) |
| `/supplies` | Provider | Partner discounts (Pro) |
| `/admin/subscriptions` | Admin | Subscription management |

---

## 💳 Payment Methods

| Method | Status | Integration |
|--------|--------|-------------|
| PayPal | ✅ Active | Automated |
| GCash | ✅ Active | Adyen |
| Maya | ✅ Active | Manual |
| Bank Transfer | ✅ Active | Manual |

---

## 🚨 Error Handling

### Common Errors
```typescript
// Firebase not initialized
if (!db) {
  throw new Error('Firebase Firestore is not initialized');
}

// Feature access denied
if (!hasAccess) {
  return <UpgradePrompt feature={feature} />;
}

// Payment failed
if (!paymentSuccess) {
  toast({ variant: 'destructive', title: 'Payment Failed' });
}
```

---

## 📊 Monitoring

### Key Metrics
- Subscription conversion rate
- Payment success rate
- Feature usage patterns
- Churn rate
- Monthly recurring revenue (MRR)

### Logging
```typescript
console.log('Subscription created:', subscriptionId);
console.log('Feature access:', feature, hasAccess);
console.log('Usage recorded:', providerId, feature, amount);
```

---

## 🔄 Workflow Examples

### Provider Upgrades to Pro
1. User clicks "Upgrade to Pro"
2. Payment processed via PayPal/GCash
3. Subscription created in database
4. Usage tracking initialized
5. Pro features unlocked
6. Badge displayed in UI

### Feature Access Check
1. Component renders
2. `useFeatureAccess` hook called
3. Subscription service checks access
4. Usage limits verified
5. Access granted/denied
6. UI updated accordingly

### Priority Job Access
1. Job marked as high-value/urgent
2. Pro subscribers see job first
3. Usage recorded when applied
4. Analytics updated
5. Admin dashboard reflects usage

---

## 🆘 Troubleshooting

### Issue: Firebase Connection
**Solution:** Check environment variables and Firebase config

### Issue: Payment Processing
**Solution:** Verify API credentials and webhook setup

### Issue: Feature Access Denied
**Solution:** Check subscription status and usage limits

### Issue: Subscription Not Updating
**Solution:** Verify real-time listeners and database permissions

---

## 📞 Support

For technical support or feature requests:
- Check the main documentation: `docs/subscription-system-documentation.md`
- Review error logs in browser console
- Verify Firebase configuration
- Test payment integrations in sandbox mode
