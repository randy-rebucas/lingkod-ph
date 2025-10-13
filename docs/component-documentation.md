# Component Documentation - LocalPro

This document provides comprehensive documentation for all React components in the LocalPro platform, including UI components, feature-specific components, and reusable elements.

## Table of Contents

1. [Component Overview](#component-overview)
2. [UI Components](#ui-components)
3. [Feature Components](#feature-components)
4. [Layout Components](#layout-components)
5. [Form Components](#form-components)
6. [Navigation Components](#navigation-components)
7. [Component Best Practices](#component-best-practices)

---

## Component Overview

The LocalPro component library is built using Radix UI primitives with custom styling and functionality. All components follow consistent design patterns and accessibility standards.

### Component Architecture

```
src/components/
├── ui/                    # Base UI components (Radix UI)
├── feature-specific/      # Feature-specific components
├── layout/               # Layout and navigation components
└── forms/                # Form and input components
```

### Design System

**Color Palette:**
- Primary: `#00528A` (Blue)
- Secondary: `#f6f9fc` (Light Gray)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)
- Text: `#484848` (Dark Gray)

**Typography:**
- Font Family: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif`
- Headings: `font-headline` class
- Body: Default system font stack

---

## UI Components

### Button Component

**File:** `src/components/ui/button.tsx`

**Variants:**
- `default`: Primary button style
- `destructive`: Error/danger actions
- `outline`: Secondary actions
- `secondary`: Alternative primary style
- `ghost`: Minimal style
- `link`: Link-style button

**Sizes:**
- `default`: Standard size
- `sm`: Small size
- `lg`: Large size
- `icon`: Icon-only button

**Usage Example:**
```tsx
import { Button } from '@/components/ui/button';

// Primary button
<Button>Click me</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Outline button
<Button variant="outline">Cancel</Button>

// Button with icon
<Button size="icon">
  <Plus className="h-4 w-4" />
</Button>
```

### Card Component

**File:** `src/components/ui/card.tsx`

**Sub-components:**
- `Card`: Main container
- `CardHeader`: Header section
- `CardTitle`: Title text
- `CardDescription`: Description text
- `CardContent`: Main content area
- `CardFooter`: Footer section

**Usage Example:**
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Service Details</CardTitle>
    <CardDescription>Complete information about the service</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Service content goes here</p>
  </CardContent>
</Card>
```

### Input Component

**File:** `src/components/ui/input.tsx`

**Features:**
- Consistent styling
- Focus states
- Error states
- Disabled states
- Placeholder support

**Usage Example:**
```tsx
import { Input } from '@/components/ui/input';

<Input 
  type="text" 
  placeholder="Enter your name" 
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Badge Component

**File:** `src/components/ui/badge.tsx`

**Variants:**
- `default`: Standard badge
- `secondary`: Secondary style
- `destructive`: Error/danger style
- `outline`: Outline style

**Usage Example:**
```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="default">Active</Badge>
<Badge variant="destructive">Cancelled</Badge>
<Badge variant="outline">Pending</Badge>
```

### Avatar Component

**File:** `src/components/ui/avatar.tsx`

**Sub-components:**
- `Avatar`: Main container
- `AvatarImage`: Profile image
- `AvatarFallback`: Fallback text/icon

**Usage Example:**
```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

<Avatar>
  <AvatarImage src="/profile.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### Table Component

**File:** `src/components/ui/table.tsx`

**Sub-components:**
- `Table`: Main table container
- `TableHeader`: Header row container
- `TableBody`: Body rows container
- `TableFooter`: Footer row container
- `TableRow`: Individual row
- `TableHead`: Header cell
- `TableCell`: Data cell

**Usage Example:**
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## Feature Components

### Payment Method Selector

**File:** `src/components/payment-method-selector.tsx`

**Purpose:** Allows users to select payment methods for bookings and subscriptions.

**Props:**
```typescript
interface PaymentMethodSelectorProps {
  amount: number;
  type: 'booking' | 'subscription';
  bookingId?: string;
  planId?: string;
  onPaymentSuccess?: (method: string, checkoutId: string) => void;
  onPaymentError?: (method: string, error: string) => void;
}
```

**Supported Payment Methods:**
- Maya Checkout (Credit/Debit Cards, E-wallets, QR Codes)
- PayPal (PayPal Balance, Credit/Debit Cards, Bank Transfer)
- Bank Transfer (Manual with proof upload)

**Usage Example:**
```tsx
import { PaymentMethodSelector } from '@/components/payment-method-selector';

<PaymentMethodSelector
  amount={1500}
  type="booking"
  bookingId="booking_123"
  onPaymentSuccess={(method, checkoutId) => {
    console.log('Payment successful:', method, checkoutId);
  }}
  onPaymentError={(method, error) => {
    console.error('Payment failed:', method, error);
  }}
/>
```

### Maya Checkout Button

**File:** `src/components/maya-checkout-button.tsx`

**Purpose:** Handles Maya payment integration with checkout flow.

**Props:**
```typescript
interface MayaCheckoutButtonProps {
  amount: number;
  type: 'booking' | 'subscription';
  bookingId?: string;
  planId?: string;
  onSuccess: (checkoutId: string) => void;
  onError: (error: string) => void;
  className?: string;
  children: React.ReactNode;
}
```

**Usage Example:**
```tsx
import { MayaCheckoutButton } from '@/components/maya-checkout-button';

<MayaCheckoutButton
  amount={1500}
  type="booking"
  bookingId="booking_123"
  onSuccess={(checkoutId) => {
    // Handle successful payment
  }}
  onError={(error) => {
    // Handle payment error
  }}
>
  Pay with Maya
</MayaCheckoutButton>
```

### Booking Dialog

**File:** `src/components/booking-dialog.tsx`

**Purpose:** Modal dialog for creating and managing bookings.

**Features:**
- Service selection
- Date and time picker
- Provider selection
- Price calculation
- Notes and special requirements

**Usage Example:**
```tsx
import { BookingDialog } from '@/components/booking-dialog';

<BookingDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  serviceId="service_123"
  providerId="provider_456"
  onBookingCreated={(booking) => {
    console.log('Booking created:', booking);
  }}
/>
```

### Quote Builder Client

**File:** `src/components/quote-builder-client.tsx`

**Purpose:** Interactive quote builder for service providers.

**Features:**
- Service item management
- Price calculation
- AI-powered descriptions
- Client preview
- Export functionality

**Usage Example:**
```tsx
import { QuoteBuilderClient } from '@/components/quote-builder-client';

<QuoteBuilderClient
  providerId="provider_123"
  onQuoteGenerated={(quote) => {
    console.log('Quote generated:', quote);
  }}
/>
```

### Smart Rate Client

**File:** `src/components/smart-rate-client.tsx`

**Purpose:** AI-powered rate suggestion interface.

**Features:**
- Service analysis
- Market comparison
- Rate recommendations
- Competitor analysis
- Profitability insights

**Usage Example:**
```tsx
import { SmartRateClient } from '@/components/smart-rate-client';

<SmartRateClient
  servicesOffered="House cleaning, Window cleaning"
  location="Makati City"
  onRateSuggested={(rate) => {
    console.log('Suggested rate:', rate);
  }}
/>
```

---

## Layout Components

### Logo Component

**File:** `src/components/logo.tsx`

**Purpose:** Consistent logo display across the platform.

**Features:**
- Responsive sizing
- Dark/light mode support
- Link integration
- Accessibility support

**Usage Example:**
```tsx
import { Logo } from '@/components/logo';

<Logo />
<Logo size="sm" />
<Logo size="lg" />
```

### Language Switcher

**File:** `src/components/language-switcher.tsx`

**Purpose:** Language selection interface for internationalization.

**Supported Languages:**
- English (en)
- Filipino/Tagalog (tl)

**Usage Example:**
```tsx
import { LanguageSwitcher } from '@/components/language-switcher';

<LanguageSwitcher />
```

### Notification Bell

**File:** `src/components/notification-bell.tsx`

**Purpose:** Notification center with real-time updates.

**Features:**
- Real-time notifications
- Unread count display
- Notification history
- Mark as read functionality

**Usage Example:**
```tsx
import { NotificationBell } from '@/components/notification-bell';

<NotificationBell userId="user_123" />
```

---

## Form Components

### Add/Edit Service Dialog

**File:** `src/components/add-edit-service-dialog.tsx`

**Purpose:** Modal for creating and editing service listings.

**Form Fields:**
- Service name and description
- Category selection
- Pricing information
- Availability settings
- Service photos

**Usage Example:**
```tsx
import { AddEditServiceDialog } from '@/components/add-edit-service-dialog';

<AddEditServiceDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  serviceId={editingServiceId}
  onServiceSaved={(service) => {
    console.log('Service saved:', service);
  }}
/>
```

### Add/Edit Invoice Dialog

**File:** `src/components/add-edit-invoice-dialog.tsx`

**Purpose:** Invoice creation and management interface.

**Features:**
- Client selection
- Service item management
- Tax calculation
- Payment terms
- Export options

**Usage Example:**
```tsx
import { AddEditInvoiceDialog } from '@/components/add-edit-invoice-dialog';

<AddEditInvoiceDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  bookingId="booking_123"
  onInvoiceCreated={(invoice) => {
    console.log('Invoice created:', invoice);
  }}
/>
```

---

## Navigation Components

### Role Guard

**File:** `src/components/role-guard.tsx`

**Purpose:** Protects routes and components based on user roles.

**Props:**
```typescript
interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
```

**Usage Example:**
```tsx
import { RoleGuard } from '@/components/role-guard';

<RoleGuard allowedRoles={['admin', 'provider']}>
  <AdminPanel />
</RoleGuard>

<RoleGuard 
  allowedRoles={['admin']} 
  fallback={<div>Access denied</div>}
>
  <SuperAdminPanel />
</RoleGuard>
```

---

## Component Best Practices

### Component Design

1. **Single Responsibility**: Each component should have one clear purpose
2. **Reusability**: Design components to be reusable across the platform
3. **Composition**: Use composition over inheritance
4. **Props Interface**: Define clear TypeScript interfaces for props
5. **Default Props**: Provide sensible defaults where appropriate

### Accessibility

1. **ARIA Labels**: Use proper ARIA labels and roles
2. **Keyboard Navigation**: Ensure keyboard accessibility
3. **Screen Readers**: Test with screen readers
4. **Color Contrast**: Maintain proper color contrast ratios
5. **Focus Management**: Manage focus states properly

### Performance

1. **Memoization**: Use React.memo for expensive components
2. **Lazy Loading**: Implement lazy loading for large components
3. **Code Splitting**: Split components into separate bundles
4. **Optimization**: Optimize re-renders and state updates
5. **Bundle Size**: Keep component bundle sizes minimal

### Testing

1. **Unit Tests**: Write unit tests for component logic
2. **Integration Tests**: Test component interactions
3. **Visual Tests**: Use visual regression testing
4. **Accessibility Tests**: Test accessibility compliance
5. **User Testing**: Conduct user testing for UX validation

### Documentation

1. **Props Documentation**: Document all props and their types
2. **Usage Examples**: Provide clear usage examples
3. **Storybook**: Use Storybook for component documentation
4. **Code Comments**: Add meaningful code comments
5. **Changelog**: Maintain component changelog

---

## Component Library Structure

```
src/components/
├── ui/                          # Base UI components
│   ├── button.tsx              # Button component
│   ├── card.tsx                # Card components
│   ├── input.tsx               # Input component
│   ├── badge.tsx               # Badge component
│   ├── avatar.tsx              # Avatar component
│   ├── table.tsx               # Table components
│   ├── dialog.tsx              # Dialog component
│   ├── dropdown-menu.tsx       # Dropdown menu
│   ├── select.tsx              # Select component
│   ├── textarea.tsx            # Textarea component
│   ├── checkbox.tsx            # Checkbox component
│   ├── radio-group.tsx         # Radio group component
│   ├── switch.tsx              # Switch component
│   ├── slider.tsx              # Slider component
│   ├── progress.tsx            # Progress component
│   ├── skeleton.tsx            # Skeleton component
│   ├── toast.tsx               # Toast component
│   ├── alert.tsx               # Alert component
│   ├── tabs.tsx                # Tabs component
│   ├── accordion.tsx           # Accordion component
│   ├── sheet.tsx               # Sheet component
│   ├── popover.tsx             # Popover component
│   ├── tooltip.tsx             # Tooltip component
│   ├── loading-states.tsx      # Loading state components
│   └── index.ts                # Component exports
├── payment-method-selector.tsx # Payment method selection
├── maya-checkout-button.tsx    # Maya payment integration
├── paypal-checkout-button.tsx  # PayPal payment integration
├── booking-dialog.tsx          # Booking creation dialog
├── booking-details-dialog.tsx  # Booking details dialog
├── complete-booking-dialog.tsx # Booking completion dialog
├── leave-review-dialog.tsx     # Review submission dialog
├── quote-builder-client.tsx    # Quote builder interface
├── quote-preview.tsx           # Quote preview component
├── stored-quotes-list.tsx      # Stored quotes list
├── smart-rate-client.tsx       # Smart rate suggestions
├── smart-rate-actions.ts       # Smart rate actions
├── add-edit-service-dialog.tsx # Service management dialog
├── add-edit-invoice-dialog.tsx # Invoice management dialog
├── invoice-preview.tsx         # Invoice preview component
├── logo.tsx                    # Logo component
├── language-switcher.tsx       # Language selection
├── notification-bell.tsx       # Notification center
├── role-guard.tsx              # Role-based access control
├── identity-verification.tsx   # Identity verification
├── analytics.tsx               # Analytics component
├── performance-dashboard.tsx   # Performance dashboard
├── error-monitoring-dashboard.tsx # Error monitoring
├── error-boundary.tsx          # Error boundary component
├── script-error-boundary.tsx   # Script error boundary
├── provider-engagement-card.tsx # Provider engagement
├── client-onboarding-banner.tsx # Client onboarding
├── provider-onboarding-banner.tsx # Provider onboarding
├── agency-onboarding-banner.tsx # Agency onboarding
├── partner-onboarding-banner.tsx # Partner onboarding
├── broadcast-banner.tsx        # Broadcast banner
└── ad-carousel.tsx             # Advertisement carousel
```

---

This component documentation provides comprehensive information about all React components in the LocalPro platform. For implementation details and examples, refer to the individual component files and the Radix UI documentation.
