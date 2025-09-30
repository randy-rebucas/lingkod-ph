# LocalPro - Utility Functions Documentation

## Overview

This document provides comprehensive documentation for the utility functions, hooks, and helper libraries in the LocalPro application. These utilities provide essential functionality for authentication, data management, error handling, and user experience enhancements.

## Table of Contents

1. [Authentication Utilities](#authentication-utilities)
2. [Custom Hooks](#custom-hooks)
3. [Rate Limiting](#rate-limiting)
4. [Audit Logging](#audit-logging)
5. [Email Services](#email-services)
6. [Analytics Services](#analytics-services)
7. [Data Management](#data-management)
8. [Error Handling](#error-handling)

---

## Authentication Utilities

### Auth Utils

**File**: `src/lib/auth-utils.ts`

**Purpose**: Provides server-side authentication and role verification utilities.

#### Functions

##### `verifyAdminRole(userId: string): Promise<boolean>`
Verifies if a user has admin role and is not suspended.

```typescript
const isAdmin = await verifyAdminRole('user123');
if (isAdmin) {
  // Allow admin operations
}
```

**Parameters**:
- `userId`: The user ID to verify

**Returns**: `Promise<boolean>` - True if user is admin and active

**Implementation**:
- Queries Firestore for user document
- Checks role field equals 'admin'
- Verifies accountStatus is not 'suspended'
- Returns false on any error

##### `verifyUserRole(userId: string, allowedRoles: string[]): Promise<boolean>`
Verifies if a user has one of the specified roles.

```typescript
const canAccess = await verifyUserRole('user123', ['provider', 'agency']);
if (canAccess) {
  // Allow provider/agency operations
}
```

**Parameters**:
- `userId`: The user ID to verify
- `allowedRoles`: Array of allowed role strings

**Returns**: `Promise<boolean>` - True if user has one of the allowed roles

---

## Custom Hooks

### useLocalStorage Hook

**File**: `src/hooks/use-local-storage.ts`

**Purpose**: Provides a React hook for managing localStorage with type safety and error handling.

#### Usage
```typescript
import { useLocalStorage } from '@/hooks/use-local-storage';

function MyComponent() {
  const [userPreferences, setUserPreferences] = useLocalStorage('userPrefs', {
    theme: 'light',
    language: 'en'
  });

  const updateTheme = (theme: string) => {
    setUserPreferences(prev => ({ ...prev, theme }));
  };

  return (
    <div>
      <p>Current theme: {userPreferences.theme}</p>
      <button onClick={() => updateTheme('dark')}>Dark Theme</button>
    </div>
  );
}
```

#### Features
- **Type Safety**: Full TypeScript support with generics
- **Error Handling**: Graceful handling of localStorage errors
- **SSR Safe**: Handles server-side rendering scenarios
- **Automatic Serialization**: JSON serialization/deserialization
- **Default Values**: Support for initial values

#### API
```typescript
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void]
```

---

### useIsMobile Hook

**File**: `src/hooks/use-mobile.tsx`

**Purpose**: Detects if the user is on a mobile device based on screen width.

#### Usage
```typescript
import { useIsMobile } from '@/hooks/use-mobile';

function ResponsiveComponent() {
  const isMobile = useIsMobile();

  return (
    <div>
      {isMobile ? (
        <MobileLayout />
      ) : (
        <DesktopLayout />
      )}
    </div>
  );
}
```

#### Features
- **Responsive Detection**: Detects mobile devices based on breakpoint
- **Real-time Updates**: Updates when window is resized
- **SSR Safe**: Handles server-side rendering
- **Performance Optimized**: Uses matchMedia API for efficiency

#### Configuration
```typescript
const MOBILE_BREAKPOINT = 768; // pixels
```

---

### useErrorHandler Hook

**File**: `src/hooks/use-error-handler.ts`

**Purpose**: Provides consistent error handling with toast notifications and logging.

#### Usage
```typescript
import { useErrorHandler } from '@/hooks/use-error-handler';

function MyComponent() {
  const { handleError } = useErrorHandler({
    showToast: true,
    logError: true,
    fallbackMessage: 'Something went wrong'
  });

  const handleSubmit = async () => {
    try {
      await submitData();
    } catch (error) {
      handleError(error, 'form submission');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

#### Options
```typescript
interface ErrorHandlerOptions {
  showToast?: boolean;        // Show toast notification (default: true)
  logError?: boolean;         // Log error to console (default: true)
  fallbackMessage?: string;   // Fallback error message
}
```

#### Features
- **Toast Notifications**: Automatic error toast display
- **Error Logging**: Console logging with context
- **Error Classification**: Handles different error types
- **User-Friendly Messages**: Converts technical errors to user messages

---

### useDebounce Hook

**File**: `src/hooks/use-debounce.ts`

**Purpose**: Debounces values to prevent excessive API calls or updates.

#### Usage
```typescript
import { useDebounce } from '@/hooks/use-debounce';

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

#### API
```typescript
function useDebounce<T>(value: T, delay: number): T
```

#### Features
- **Performance Optimization**: Reduces unnecessary operations
- **Type Safety**: Full TypeScript support
- **Memory Efficient**: Proper cleanup of timeouts
- **Configurable Delay**: Customizable debounce delay

---

## Rate Limiting

### Rate Limiter

**File**: `src/lib/rate-limiter.ts`

**Purpose**: Implements comprehensive rate limiting for API endpoints and user actions.

#### Usage
```typescript
import { rateLimiters } from '@/lib/rate-limiter';

// In API route
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimiters.bookingCreation.checkLimit(request);
  
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult.retryAfter!);
  }
  
  // Process request
}
```

#### Configuration
```typescript
const rateLimiters = {
  general: new RateLimiter({
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 100            // 100 requests per minute
  }),
  
  bookingCreation: new RateLimiter({
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 5              // 5 bookings per minute
  }),
  
  messaging: new RateLimiter({
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 30             // 30 messages per minute
  }),
  
  jobApplications: new RateLimiter({
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 10             // 10 job applications per minute
  })
};
```

#### Features
- **In-Memory Storage**: Fast in-memory rate limiting (Redis recommended for production)
- **Automatic Cleanup**: Removes expired entries automatically
- **Custom Key Generation**: Support for custom rate limiting keys
- **Response Headers**: Includes rate limit headers in responses
- **Configurable Windows**: Flexible time window configuration

---

## Audit Logging

### Audit Logger

**File**: `src/lib/audit-logger.ts`

**Purpose**: Provides comprehensive audit logging for security and compliance.

#### Usage
```typescript
import { auditLogger } from '@/lib/audit-logger';

// Log authentication events
await auditLogger.logAuthentication(
  userId,
  userRole,
  true, // success
  { method: 'email', ipAddress: '192.168.1.1' }
);

// Log booking operations
await auditLogger.logBookingCreation(
  userId,
  userRole,
  bookingId,
  { serviceId, providerId, amount }
);

// Log security events
await auditLogger.logSecurityEvent(
  userId,
  userRole,
  'unauthorized_access_attempt',
  { endpoint: '/api/admin/users', reason: 'insufficient_permissions' }
);
```

#### Log Entry Structure
```typescript
interface AuditLogEntry {
  id: string;
  userId: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  timestamp: Timestamp;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  errorMessage?: string;
}
```

#### Logging Methods
- `logAuthentication()` - Authentication events
- `logBookingCreation()` - Booking creation
- `logBookingUpdate()` - Booking modifications
- `logBookingCancellation()` - Booking cancellations
- `logJobPosting()` - Job posting events
- `logMessageSent()` - Message sending
- `logProfileUpdate()` - Profile modifications
- `logPaymentAttempt()` - Payment operations
- `logSecurityEvent()` - Security-related events
- `logDataAccess()` - Data access events
- `logError()` - Error logging

---

## Email Services

### Email Service

**File**: `src/lib/email-service.ts`

**Purpose**: Handles email sending with templates and error handling.

#### Usage
```typescript
import { sendEmail } from '@/lib/email-service';

// Send simple email
await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to LocalPro',
  html: '<h1>Welcome!</h1><p>Thank you for joining LocalPro.</p>'
});

// Send email with template
await sendEmail({
  to: 'user@example.com',
  subject: 'Booking Confirmation',
  template: 'booking-confirmation',
  data: {
    userName: 'John Doe',
    serviceName: 'House Cleaning',
    date: '2024-01-15'
  }
});
```

#### Features
- **Template Support**: Email template system
- **Error Handling**: Comprehensive error handling
- **Retry Logic**: Automatic retry for failed sends
- **Logging**: Email sending audit logs
- **Rate Limiting**: Prevents email spam

---

## Analytics Services

### Provider Analytics

**File**: `src/lib/provider-analytics.ts`

**Purpose**: Provides comprehensive analytics for service providers.

#### Usage
```typescript
import { getProviderAnalytics } from '@/lib/provider-analytics';

const analytics = await getProviderAnalytics({
  providerId: 'provider123',
  period: 'monthly',
  date: new Date('2024-01-01')
});

console.log(analytics.analytics.marketShare); // Market share percentage
console.log(analytics.recommendations.pricing); // Pricing recommendations
```

#### Analytics Data
```typescript
interface ProviderAnalytics {
  providerId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: Date;
  analytics: {
    marketShare: number;
    competitivePosition: number;
    pricingAnalysis: {
      averagePrice: number;
      priceRange: { min: number; max: number };
      priceCompetitiveness: number;
    };
    clientDemographics: {
      ageGroups: Record<string, number>;
      locations: Record<string, number>;
      preferences: Record<string, number>;
    };
    servicePerformance: {
      servicePopularity: Record<string, number>;
      serviceProfitability: Record<string, number>;
      seasonalTrends: Record<string, number>;
    };
    operationalEfficiency: {
      utilizationRate: number;
      capacityUtilization: number;
      resourceEfficiency: number;
    };
    growthMetrics: {
      growthRate: number;
      expansionOpportunities: string[];
      marketGaps: string[];
    };
    qualityMetrics: {
      qualityScore: number;
      improvementAreas: string[];
      bestPractices: string[];
    };
  };
  recommendations: {
    pricing: string[];
    marketing: string[];
    operations: string[];
    growth: string[];
  };
  insights: {
    keyFindings: string[];
    trends: string[];
    opportunities: string[];
    risks: string[];
  };
}
```

---

### Partner Analytics

**File**: `src/lib/partner-analytics.ts`

**Purpose**: Provides analytics for business partners and affiliates.

#### Usage
```typescript
import { getPartnerAnalytics } from '@/lib/partner-analytics';

const analytics = await getPartnerAnalytics('partner123');
console.log(analytics.referrals.total); // Total referrals
console.log(analytics.commissions.total); // Total commissions
```

#### Analytics Data
```typescript
interface PartnerAnalytics {
  partnerId: string;
  referrals: {
    total: number;
    active: number;
    converted: number;
  };
  commissions: {
    total: number;
    pending: number;
    paid: number;
  };
  performance: {
    conversionRate: number;
    averageCommission: number;
    monthlyGrowth: number;
  };
  lastUpdated: Timestamp;
}
```

---

## Data Management

### Firebase Utilities

**File**: `src/lib/firebase.ts`

**Purpose**: Provides Firebase configuration and utility functions.

#### Usage
```typescript
import { getDb, getAuthInstance, getStorageInstance } from '@/lib/firebase';

// Get Firestore instance
const db = getDb();
const docRef = doc(db, 'users', 'user123');

// Get Auth instance
const auth = getAuthInstance();

// Get Storage instance
const storage = getStorageInstance();
```

#### Features
- **Error Handling**: Graceful handling of Firebase initialization errors
- **Development Support**: Mock objects for development without Firebase
- **Type Safety**: Full TypeScript support
- **Configuration**: Environment-based configuration

---

### Seed Categories

**File**: `src/lib/seed-categories.ts`

**Purpose**: Seeds the database with initial service categories.

#### Usage
```typescript
import { seedCategories } from '@/lib/seed-categories';

// Seed categories in development
if (process.env.NODE_ENV === 'development') {
  await seedCategories();
}
```

#### Features
- **Category Management**: Predefined service categories
- **Hierarchical Structure**: Parent-child category relationships
- **Localization**: Multi-language category support
- **Development Tool**: Useful for development and testing

---

## Error Handling

### Error Handler Hook

**File**: `src/hooks/use-error-handler.ts`

**Purpose**: Provides consistent error handling across the application.

#### Error Types Handled
- **Authentication Errors**: Login and permission issues
- **Network Errors**: Connection and HTTP errors
- **Firebase Errors**: Database and storage errors
- **Validation Errors**: Form and input validation errors

#### Error Classification
```typescript
// Authentication errors
if (error.message.includes('Authentication required')) {
  errorMessage = 'Please log in to continue';
  toastMessage = 'You need to be logged in to perform this action.';
}

// Network errors
else if (error.message.includes('fetch') || error.message.includes('HTTP')) {
  errorMessage = 'Network error. Please check your connection.';
  toastMessage = 'Unable to connect to the service. Please check your internet connection.';
}

// Firebase errors
else if (error.message.includes('Firebase')) {
  errorMessage = 'Database error occurred';
  toastMessage = 'A database error occurred. Please try again.';
}
```

---

## Development Guidelines

### Creating New Utilities

1. **Type Safety**: Use TypeScript for all utility functions
2. **Error Handling**: Implement comprehensive error handling
3. **Documentation**: Document all functions with JSDoc comments
4. **Testing**: Write unit tests for utility functions
5. **Performance**: Optimize for performance and efficiency
6. **Reusability**: Design for reusability across the application

### Best Practices

1. **Single Responsibility**: Each utility should have a single, clear purpose
2. **Pure Functions**: Prefer pure functions when possible
3. **Error Boundaries**: Implement proper error boundaries
4. **Logging**: Include appropriate logging for debugging
5. **Configuration**: Make utilities configurable when appropriate
6. **Security**: Ensure utilities don't expose sensitive data

---

This documentation provides comprehensive coverage of the utility functions in the LocalPro application. For specific implementation details, refer to the source code and related documentation files.
