import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './card';
import { Button } from './button';

// Standardized empty state component
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  variant?: 'default' | 'card' | 'minimal';
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className,
  variant = 'default'
}: EmptyStateProps) {
  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      variant === 'minimal' ? 'py-8' : 'py-12 px-4',
      className
    )}>
      {icon && (
        <div className={cn(
          'text-muted-foreground mb-4',
          variant === 'minimal' ? 'text-4xl' : 'text-6xl'
        )}>
          {icon}
        </div>
      )}
      <h3 className={cn(
        'font-semibold text-foreground mb-2',
        variant === 'minimal' ? 'text-lg' : 'text-xl'
      )}>
        {title}
      </h3>
      {description && (
        <p className={cn(
          'text-muted-foreground mb-6 max-w-sm',
          variant === 'minimal' ? 'text-sm' : 'text-base'
        )}>
          {description}
        </p>
      )}
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}

// Common empty state variants
interface NoDataEmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  variant?: 'default' | 'card' | 'minimal';
}

export function NoDataEmptyState({ 
  title = 'No data available',
  description = 'There is no data to display at the moment.',
  action,
  className,
  variant = 'card'
}: NoDataEmptyStateProps) {
  return (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      title={title}
      description={description}
      action={action}
      className={className}
      variant={variant}
    />
  );
}

interface NoResultsEmptyStateProps {
  title?: string;
  description?: string;
  onClearFilters?: () => void;
  className?: string;
  variant?: 'default' | 'card' | 'minimal';
}

export function NoResultsEmptyState({ 
  title = 'No results found',
  description = 'Try adjusting your search or filters to find what you\'re looking for.',
  onClearFilters,
  className,
  variant = 'card'
}: NoResultsEmptyStateProps) {
  const action = onClearFilters ? (
    <Button variant="outline" onClick={onClearFilters}>
      Clear Filters
    </Button>
  ) : undefined;

  return (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title={title}
      description={description}
      action={action}
      className={className}
      variant={variant}
    />
  );
}

interface ErrorEmptyStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'card' | 'minimal';
}

export function ErrorEmptyState({ 
  title = 'Something went wrong',
  description = 'We encountered an error while loading the data. Please try again.',
  onRetry,
  className,
  variant = 'card'
}: ErrorEmptyStateProps) {
  const action = onRetry ? (
    <Button onClick={onRetry}>
      Try Again
    </Button>
  ) : undefined;

  return (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      }
      title={title}
      description={description}
      action={action}
      className={className}
      variant={variant}
    />
  );
}

// Specialized empty states for common use cases
interface BookingsEmptyStateProps {
  status?: string;
  userRole?: string;
  className?: string;
}

export function BookingsEmptyState({ 
  status = 'all',
  userRole: _userRole,
  className 
}: BookingsEmptyStateProps) {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: ReactNode; title: string; description: string }> = {
      'Pending Payment': {
        icon: <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>,
        title: 'No bookings awaiting payment',
        description: 'All your bookings are up to date with payments.'
      },
      'Upcoming': {
        icon: <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>,
        title: 'No upcoming bookings',
        description: 'You don\'t have any upcoming service appointments.'
      },
      'Completed': {
        icon: <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>,
        title: 'No completed bookings',
        description: 'Your completed service history will appear here.'
      }
    };
    return configs[status] || configs['Upcoming'];
  };

  const config = getStatusConfig(status);
  
  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
      className={className}
      variant="card"
    />
  );
}

interface JobsEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
  className?: string;
}

export function JobsEmptyState({ 
  hasFilters = false,
  onClearFilters,
  className 
}: JobsEmptyStateProps) {
  const action = hasFilters && onClearFilters ? (
    <Button variant="outline" onClick={onClearFilters}>
      Clear Filters
    </Button>
  ) : undefined;

  return (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
        </svg>
      }
      title={hasFilters ? 'No jobs match your criteria' : 'No open jobs available'}
      description={hasFilters ? 'Try adjusting your search or filters to find more opportunities.' : 'Check back later for new job opportunities.'}
      action={action}
      className={className}
      variant="card"
    />
  );
}
