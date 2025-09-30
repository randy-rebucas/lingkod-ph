# LocalPro - Component Documentation

## Overview

This document provides comprehensive documentation for the key React components in the LocalPro application. These components handle core functionality including AI-powered features, booking management, payment processing, and user interactions.

## Table of Contents

1. [AI-Powered Components](#ai-powered-components)
2. [Booking Management Components](#booking-management-components)
3. [Payment Components](#payment-components)
4. [UI Components](#ui-components)
5. [Utility Components](#utility-components)
6. [Component Architecture](#component-architecture)

---

## AI-Powered Components

### SmartRateClient Component

**File**: `src/components/smart-rate-client.tsx`

**Purpose**: Provides AI-powered pricing suggestions for service providers based on market analysis and competitive intelligence.

#### Features
- **Market Analysis**: Analyzes competitor pricing in the same location and service category
- **Smart Suggestions**: Uses AI to suggest optimal pricing based on market conditions
- **Visual Analytics**: Displays pricing trends, market positioning, and competitive analysis
- **Real-time Updates**: Provides live pricing recommendations with reasoning

#### Props
```typescript
// No external props - uses internal state and server actions
```

#### Usage
```tsx
import SmartRateClient from '@/components/smart-rate-client';

// Used in provider dashboard for pricing optimization
<SmartRateClient />
```

#### Key Features
- **Form Validation**: Comprehensive input validation for service details
- **AI Integration**: Connects to Google AI (Genkit) for smart rate suggestions
- **Internationalization**: Supports English and Filipino languages
- **Responsive Design**: Mobile-optimized interface with card-based layout

#### State Management
- Uses `useActionState` for server action integration
- Local state for form data and display results
- Real-time updates with `useEffect` hooks

---

### QuoteBuilderClient Component

**File**: `src/components/quote-builder-client.tsx`

**Purpose**: Enables providers and agencies to create professional quotes with AI assistance for service descriptions.

#### Features
- **Dynamic Line Items**: Add/remove service line items with quantity and pricing
- **AI Description Generation**: Automatically generates service descriptions using AI
- **Professional Templates**: Pre-built quote templates with customizable fields
- **PDF Export**: Generate and download professional PDF quotes
- **Client Management**: Store and manage client information for quotes

#### Props
```typescript
// No external props - self-contained component
```

#### Usage
```tsx
import QuoteBuilderClient from '@/components/quote-builder-client';

// Used in provider/agency dashboard for quote creation
<QuoteBuilderClient />
```

#### Key Features
- **Form Management**: Uses React Hook Form with Zod validation
- **AI Integration**: Generates service descriptions using AI flows
- **Quote Preview**: Real-time preview of quote formatting
- **Data Persistence**: Saves quotes to Firestore database
- **Multi-language Support**: Internationalized interface

#### Schema Validation
```typescript
const createLineItemSchema = (t: any) => z.object({
  description: z.string().min(1, t('descriptionRequired')),
  quantity: z.coerce.number().min(0.1, t('quantityMin')),
  price: z.coerce.number().min(0, t('priceCannotBeNegative')),
});

const createQuoteSchema = (t: any, lineItemSchema: any) => z.object({
  clientName: z.string().min(1, t('clientNameRequired')),
  clientEmail: z.string().email(t('invalidEmail')),
  // ... additional fields
});
```

---

## Booking Management Components

### BookingDialog Component

**File**: `src/components/booking-dialog.tsx`

**Purpose**: Handles the booking creation process for clients to schedule services with providers.

#### Features
- **Date/Time Selection**: Calendar picker with time slot selection
- **Service Details**: Displays service information and pricing
- **Provider Information**: Shows provider details and ratings
- **Booking Notes**: Optional notes field for special requirements
- **Form Validation**: Comprehensive validation for booking data

#### Props
```typescript
type BookingDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  service: Service;
  provider: Provider;
  onBookingConfirmed: () => void;
};
```

#### Usage
```tsx
import BookingDialog from '@/components/booking-dialog';

<BookingDialog
  isOpen={isDialogOpen}
  setIsOpen={setIsDialogOpen}
  service={selectedService}
  provider={selectedProvider}
  onBookingConfirmed={handleBookingConfirmed}
/>
```

#### Key Features
- **Calendar Integration**: Uses shadcn/ui Calendar component
- **Time Slot Management**: Predefined time slots with availability checking
- **Form Validation**: Zod schema validation for booking data
- **Error Handling**: Comprehensive error handling with user feedback
- **Internationalization**: Multi-language support

#### Schema
```typescript
const bookingSchema = z.object({
  date: z.date({ required_error: "Please select a date." }),
  time: z.string({ required_error: "Please select a time." }),
  notes: z.string().optional(),
});
```

---

## Payment Components

### GCashPaymentButton Component

**File**: `src/components/gcash-payment-button.tsx`

**Purpose**: Handles GCash payment processing through Adyen integration.

#### Features
- **Adyen Integration**: Direct integration with Adyen payment gateway
- **Real-time Processing**: Live payment status updates
- **Error Handling**: Comprehensive error handling and user feedback
- **Security**: Secure payment processing with tokenization

#### Props
```typescript
interface GCashPaymentButtonProps {
  amount: number;
  bookingId: string;
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
}
```

#### Usage
```tsx
import GCashPaymentButton from '@/components/gcash-payment-button';

<GCashPaymentButton
  amount={bookingAmount}
  bookingId={booking.id}
  onSuccess={handlePaymentSuccess}
  onError={handlePaymentError}
/>
```

---

## UI Components

### RoleGuard Component

**File**: `src/components/role-guard.tsx`

**Purpose**: Provides role-based access control for UI components and routes.

#### Features
- **Role Validation**: Checks user roles against required permissions
- **Conditional Rendering**: Shows/hides content based on user role
- **Fallback UI**: Displays appropriate fallback for unauthorized users
- **Authentication Check**: Ensures user is authenticated before role checking

#### Props
```typescript
interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}
```

#### Usage
```tsx
import RoleGuard from '@/components/role-guard';

<RoleGuard allowedRoles={['provider', 'agency']}>
  <ProviderOnlyContent />
</RoleGuard>
```

---

## Utility Components

### LanguageSwitcher Component

**File**: `src/components/language-switcher.tsx`

**Purpose**: Allows users to switch between supported languages (English and Filipino).

#### Features
- **Language Persistence**: Stores language preference in cookies
- **Immediate Updates**: Reloads page to apply language changes
- **Visual Indicators**: Flag emojis for easy language identification
- **Dropdown Interface**: Clean dropdown menu for language selection

#### Usage
```tsx
import { LanguageSwitcher } from '@/components/language-switcher';

// Typically used in navigation header
<LanguageSwitcher />
```

---

## Component Architecture

### State Management Patterns

#### Server Actions Integration
Many components use Next.js server actions for data operations:

```typescript
// Example from SmartRateClient
const [state, formAction, isPending] = useActionState(handleSuggestSmartRate, initialState);
```

#### Form Management
Components use React Hook Form with Zod validation:

```typescript
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: initialValues,
});
```

#### Error Handling
Consistent error handling using custom hooks:

```typescript
const { handleError } = useErrorHandler({
  showToast: true,
  logError: true,
});
```

### Styling and Design

#### Design System
- **Primary Color**: Soft sky blue (#87CEEB)
- **Background**: Very light blue (#F0F8FF)
- **Accent Color**: Muted violet (#B087EB)
- **Typography**: PT Sans font family

#### Component Styling
- Uses Tailwind CSS for styling
- shadcn/ui components for consistent UI
- Card-based layouts for content organization
- Responsive design with mobile-first approach

### Performance Considerations

#### Code Splitting
- Components are lazy-loaded where appropriate
- Server actions reduce client-side JavaScript
- Image optimization with Next.js Image component

#### Caching
- Server actions use appropriate caching strategies
- Form state is managed efficiently
- API responses are cached when appropriate

### Accessibility

#### ARIA Support
- Proper ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility

#### Internationalization
- All user-facing text is internationalized
- RTL support considerations
- Cultural adaptations for Filipino users

---

## Development Guidelines

### Component Creation
1. **TypeScript**: All components must be fully typed
2. **Validation**: Use Zod schemas for form validation
3. **Error Handling**: Implement comprehensive error handling
4. **Testing**: Write unit tests for complex logic
5. **Documentation**: Document props, usage, and examples

### Code Organization
1. **File Structure**: Follow established naming conventions
2. **Imports**: Use absolute imports with `@/` prefix
3. **Exports**: Use named exports for components
4. **Constants**: Define constants at the top of files

### Performance
1. **Memoization**: Use React.memo for expensive components
2. **Lazy Loading**: Implement lazy loading for large components
3. **Bundle Size**: Monitor and optimize bundle size
4. **Rendering**: Minimize unnecessary re-renders

---

## Testing

### Unit Testing
Components should include unit tests covering:
- Rendering with different props
- User interactions
- Error states
- Edge cases

### Integration Testing
Test component integration with:
- Server actions
- API endpoints
- Database operations
- Authentication flows

### E2E Testing
End-to-end tests should cover:
- Complete user workflows
- Cross-browser compatibility
- Mobile responsiveness
- Performance benchmarks

---

This documentation provides a comprehensive overview of the key components in the LocalPro application. For specific implementation details, refer to the source code and related documentation files.
