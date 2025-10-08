# Loading States Consistency Guide

This document outlines the standardized loading states, empty states, and skeleton loading patterns implemented across the application to ensure consistency and better user experience.

## Overview

The application now uses standardized components for all loading states, empty states, and skeleton loading to ensure:
- Consistent visual design
- Better accessibility
- Improved user experience
- Easier maintenance

## Components

### Loading States (`/src/components/ui/loading-states.tsx`)

#### 1. LoadingSpinner
A standardized spinner component with different sizes and optional text.

```tsx
import { LoadingSpinner } from '@/components/ui/loading-states';

// Basic usage
<LoadingSpinner />

// With text
<LoadingSpinner text="Loading data..." />

// Different sizes
<LoadingSpinner size="sm" />
<LoadingSpinner size="md" />
<LoadingSpinner size="lg" />
<LoadingSpinner size="xl" />

// Centered
<LoadingSpinner centered text="Loading..." />
```

#### 2. PageLoading
Full-page loading state for initial page loads.

```tsx
import { PageLoading } from '@/components/ui/loading-states';

<PageLoading text="Loading your dashboard..." />
<PageLoading text="Setting up..." className="bg-secondary" />
```

#### 3. SkeletonGrid
For loading lists of items.

```tsx
import { SkeletonGrid } from '@/components/ui/loading-states';

<SkeletonGrid count={6} />
<SkeletonGrid count={4} className="space-y-2" />
```

#### 4. SkeletonCards
For loading card-based layouts.

```tsx
import { SkeletonCards } from '@/components/ui/loading-states';

<SkeletonCards count={6} />
<SkeletonCards count={4} cardClassName="h-72" />
```

#### 5. TableSkeleton
For loading table data.

```tsx
import { TableSkeleton } from '@/components/ui/loading-states';

<TableSkeleton rows={5} columns={4} />
```

#### 6. InlineLoading
For inline loading states.

```tsx
import { InlineLoading } from '@/components/ui/loading-states';

<InlineLoading text="Saving..." />
```

### Empty States (`/src/components/ui/empty-states.tsx`)

#### 1. EmptyState
The base empty state component.

```tsx
import { EmptyState } from '@/components/ui/empty-states';

<EmptyState
  icon={<SomeIcon />}
  title="No data available"
  description="There is no data to display at the moment."
  action={<Button>Add Item</Button>}
  variant="card" // 'default' | 'card' | 'minimal'
/>
```

#### 2. NoDataEmptyState
Standard no data state.

```tsx
import { NoDataEmptyState } from '@/components/ui/empty-states';

<NoDataEmptyState
  title="No items found"
  description="Start by adding your first item."
  action={<Button>Add Item</Button>}
/>
```

#### 3. NoResultsEmptyState
For search/filter results.

```tsx
import { NoResultsEmptyState } from '@/components/ui/empty-states';

<NoResultsEmptyState
  title="No results found"
  description="Try adjusting your search criteria."
  onClearFilters={() => clearFilters()}
/>
```

#### 4. ErrorEmptyState
For error states.

```tsx
import { ErrorEmptyState } from '@/components/ui/empty-states';

<ErrorEmptyState
  title="Something went wrong"
  description="We encountered an error while loading data."
  onRetry={() => retry()}
/>
```

#### 5. Specialized Empty States

##### BookingsEmptyState
For booking-related empty states.

```tsx
import { BookingsEmptyState } from '@/components/ui/empty-states';

<BookingsEmptyState
  status="Upcoming" // 'Pending Payment' | 'Upcoming' | 'Completed'
  userRole="client"
/>
```

##### JobsEmptyState
For job-related empty states.

```tsx
import { JobsEmptyState } from '@/components/ui/empty-states';

<JobsEmptyState
  hasFilters={hasActiveFilters}
  onClearFilters={() => clearFilters()}
/>
```

## Implementation Patterns

### 1. Loading State Pattern

```tsx
// Before (inconsistent)
if (loading) {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span>Loading...</span>
    </div>
  );
}

// After (standardized)
if (loading) {
  return <LoadingSpinner text="Loading data..." centered />;
}
```

### 2. Skeleton Loading Pattern

```tsx
// Before (inconsistent)
if (loading) {
  return (
    <div className="grid gap-4">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-64 w-full" />
      ))}
    </div>
  );
}

// After (standardized)
if (loading) {
  return <SkeletonCards count={6} />;
}
```

### 3. Empty State Pattern

```tsx
// Before (inconsistent)
if (items.length === 0) {
  return (
    <Card>
      <CardContent className="flex items-center justify-center p-12">
        <div className="text-center">
          <SomeIcon className="h-12 w-12 mb-4" />
          <h3>No items found</h3>
          <p>Try adding some items.</p>
        </div>
      </CardContent>
    </Card>
  );
}

// After (standardized)
if (items.length === 0) {
  return (
    <NoDataEmptyState
      title="No items found"
      description="Try adding some items."
      action={<Button>Add Item</Button>}
    />
  );
}
```

## Updated Files

The following files have been updated to use the standardized components:

1. **`/src/app/(app)/my-favorites/page.tsx`**
   - Replaced custom skeleton loading with `SkeletonCards`
   - Replaced custom empty state with `EmptyState` component

2. **`/src/app/(app)/jobs/page.tsx`**
   - Replaced custom skeleton loading with `SkeletonCards`
   - Replaced custom empty state with `JobsEmptyState`

3. **`/src/app/(app)/dashboard/page.tsx`**
   - Replaced custom loading spinner with `LoadingSpinner`
   - Replaced custom skeleton loading with `SkeletonCards`

4. **`/src/app/home-client.tsx`**
   - Replaced custom loading state with `PageLoading`

5. **`/src/app/setup/page.tsx`**
   - Replaced custom loading state with `PageLoading`

## Benefits

1. **Consistency**: All loading states now follow the same design patterns
2. **Accessibility**: Proper ARIA labels and semantic HTML
3. **Maintainability**: Centralized components make updates easier
4. **User Experience**: Consistent loading states provide better UX
5. **Performance**: Optimized skeleton loading reduces perceived loading time

## Best Practices

1. **Use appropriate loading states**:
   - `PageLoading` for full-page loads
   - `LoadingSpinner` for inline loading
   - `SkeletonCards` for card layouts
   - `SkeletonGrid` for list layouts
   - `TableSkeleton` for table data

2. **Choose the right empty state**:
   - `NoDataEmptyState` for general no-data scenarios
   - `NoResultsEmptyState` for search/filter results
   - `ErrorEmptyState` for error scenarios
   - Specialized components for specific use cases

3. **Provide meaningful text**:
   - Use descriptive loading messages
   - Include helpful empty state descriptions
   - Add action buttons where appropriate

4. **Consider accessibility**:
   - All components include proper ARIA labels
   - Loading states are announced to screen readers
   - Empty states provide clear context

## Future Improvements

1. **Animation consistency**: Ensure all loading animations follow the same timing
2. **Theme integration**: Make sure loading states work with all theme variants
3. **Internationalization**: Add proper i18n support for all text content
4. **Performance**: Consider lazy loading for skeleton components
5. **Testing**: Add comprehensive tests for all loading state components

## Migration Guide

To migrate existing components to use the standardized loading states:

1. **Identify loading patterns** in your component
2. **Replace custom loading states** with appropriate standardized components
3. **Update empty states** to use the new empty state components
4. **Test the changes** to ensure proper functionality
5. **Update any related tests** to match the new components

This standardization ensures a consistent and professional user experience across the entire application.
