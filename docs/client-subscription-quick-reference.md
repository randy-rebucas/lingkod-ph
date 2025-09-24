# Client Subscription System - Quick Reference Guide

## 🚀 Quick Start

### 1. Initialize Default Plans
```typescript
import { clientSubscriptionService } from '@/lib/client-subscription-service';

// Run once to create default client subscription plans
await clientSubscriptionService.initializeDefaultPlans();
```

### 2. Check Feature Access
```tsx
import { useClientFeatureAccess } from '@/hooks/use-client-subscription';

const { hasAccess } = useClientFeatureAccess('advanced_search');
```

### 3. Protect Premium Features
```tsx
import { ClientFeatureGuard } from '@/components/client-feature-guard';

<ClientFeatureGuard feature="advanced_search">
  <AdvancedSearchInterface />
</ClientFeatureGuard>
```

---

## 📋 Client Subscription Plans

| Feature | Free | Premium (₱199/month) |
|---------|------|----------------------|
| Job Posts | 3 | 10 |
| Bookings/Month | 10 | 50 |
| Favorites | 20 | 100 |
| Advanced Search | ❌ | ✅ |
| Priority Booking | ❌ | ✅ |
| Booking Analytics | ❌ | ✅ |
| Priority Support | ❌ | ✅ |
| Exclusive Deals | ❌ | ✅ |
| Custom Requests | ❌ | ✅ |

---

## 🔧 API Endpoints

### Get Plans
```bash
GET /api/client-subscriptions/plans
```

### Get Current Subscription
```bash
GET /api/client-subscriptions/current
Authorization: Bearer <token>
```

### Create Subscription
```bash
POST /api/client-subscriptions/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "plan_id",
  "paymentMethod": "paypal",
  "paymentReference": "payment_id",
  "amount": 199
}
```

### Check Feature Access
```bash
POST /api/client-subscriptions/check-access
Authorization: Bearer <token>
Content-Type: application/json

{
  "feature": "advanced_search"
}
```

---

## 🎯 Feature Keys

```typescript
const CLIENT_FEATURES = {
  ADVANCED_SEARCH: 'advanced_search',
  PRIORITY_BOOKING: 'priority_booking',
  BOOKING_ANALYTICS: 'booking_analytics',
  PRIORITY_SUPPORT: 'priority_support',
  EXCLUSIVE_DEALS: 'exclusive_deals',
  CUSTOM_REQUESTS: 'custom_requests',
  VERIFIED_PROVIDER_ACCESS: 'verified_provider_access',
  EXTENDED_JOB_POSTS: 'extended_job_posts',
  EXTENDED_BOOKINGS: 'extended_bookings',
  EXTENDED_FAVORITES: 'extended_favorites'
};
```

---

## 🧩 Components

### Payment Button
```tsx
<ClientSubscriptionPaymentButton
  plan={premiumPlan}
  onPaymentSuccess={(id) => console.log('Success:', id)}
  onPaymentError={(error) => console.error('Error:', error)}
/>
```

### Premium Badge
```tsx
<VerifiedPremiumClientBadge variant="large" />
<ClientSubscriptionBadge tier="premium" variant="compact" />
```

### Feature Guards
```tsx
<AdvancedSearchGuard>
  <AdvancedSearchInterface />
</AdvancedSearchGuard>

<PriorityBookingGuard>
  <PriorityBookingForm />
</PriorityBookingGuard>

<BookingAnalyticsGuard>
  <ClientAnalyticsDashboard />
</BookingAnalyticsGuard>

<ExclusiveDealsGuard>
  <PartnerDiscountsList />
</ExclusiveDealsGuard>

<CustomRequestsGuard>
  <CustomServiceRequestForm />
</CustomRequestsGuard>
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
  upgradeToPremium
} = useClientSubscription();
```

### Feature Access Hook
```tsx
const { hasAccess, loading, remainingUsage, limit } = useClientFeatureAccess('advanced_search');
```

### Premium Status Hook
```tsx
const { isPremium, isActive, subscription } = usePremiumClientSubscription();
```

---

## 🗄️ Database Collections

| Collection | Purpose |
|------------|---------|
| `clientSubscriptionPlans` | Available client plans and features |
| `clientSubscriptions` | Active client subscriptions |
| `clientSubscriptionUsage` | Monthly usage tracking |
| `clientSubscriptionPayments` | Payment history |
| `clientExclusiveDeals` | Partner discount offers |
| `clientAnalytics` | Client performance metrics |
| `customServiceRequests` | Custom service requests |
| `priorityBookings` | Priority booking requests |

---

## 🔐 Security Rules

```javascript
// Firestore Rules
match /clientSubscriptionPlans/{planId} {
  allow read: if true;
  allow write: if isAdmin();
}

match /clientSubscriptions/{subscriptionId} {
  allow read: if isOwner(resource.data.clientId) || isAdmin();
  allow write: if isAdmin();
}
```

---

## 🛠️ Services

### Client Subscription Service
```typescript
import { clientSubscriptionService } from '@/lib/client-subscription-service';

// Get plans
const plans = await clientSubscriptionService.getClientSubscriptionPlans();

// Get client subscription
const subscription = await clientSubscriptionService.getClientSubscription(clientId);

// Check feature access
const access = await clientSubscriptionService.checkClientFeatureAccess(clientId, 'advanced_search');

// Record usage
await clientSubscriptionService.recordClientFeatureUsage(clientId, 'advanced_search');
```

### Client Search Service
```typescript
import { clientSearchService } from '@/lib/client-search-service';

// Enhanced search
const results = await clientSearchService.searchProviders(clientId, searchTerm, filters, 20);

// Get verified providers
const verified = await clientSearchService.getVerifiedProviders(clientId, 20);

// Get Pro providers
const proProviders = await clientSearchService.getProProviders(clientId, 20);
```

---

## 🎨 UI Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/client-subscription` | Client | Subscription management |
| `/client-analytics` | Client | Booking analytics (Premium) |
| `/admin/client-subscriptions` | Admin | Client subscription management |

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
- Client subscription conversion rate
- Payment success rate
- Feature usage patterns
- Churn rate
- Monthly recurring revenue (MRR)

### Logging
```typescript
console.log('Client subscription created:', subscriptionId);
console.log('Client feature access:', feature, hasAccess);
console.log('Client usage recorded:', clientId, feature, amount);
```

---

## 🔄 Workflow Examples

### Client Upgrades to Premium
1. Client clicks "Upgrade to Premium"
2. Payment processed via PayPal/GCash
3. Subscription created in database
4. Usage tracking initialized
5. Premium features unlocked
6. Badge displayed in UI

### Feature Access Check
1. Component renders
2. `useClientFeatureAccess` hook called
3. Subscription service checks access
4. Usage limits verified
5. Access granted/denied
6. UI updated accordingly

### Advanced Search Access
1. Client performs search
2. Premium access verified
3. Advanced filters applied
4. Verified providers prioritized
5. Usage recorded
6. Results returned

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
- Check the main documentation: `docs/client-subscription-system-documentation.md`
- Review error logs in browser console
- Verify Firebase configuration
- Test payment integrations in sandbox mode
