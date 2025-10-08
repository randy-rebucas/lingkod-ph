import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Skeleton } from './skeleton';

// Standardized loading spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  centered?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

export function LoadingSpinner({ 
  size = 'md', 
  text, 
  className,
  centered = false 
}: LoadingSpinnerProps) {
  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && (
        <span className="text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  );

  if (centered) {
    return (
      <div className="flex items-center justify-center py-8">
        {content}
      </div>
    );
  }

  return content;
}

// Full page loading state
interface PageLoadingProps {
  text?: string;
  className?: string;
}

export function PageLoading({ 
  text = 'Loading...', 
  className 
}: PageLoadingProps) {
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center bg-background',
      className
    )}>
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

// Card loading state
interface CardLoadingProps {
  className?: string;
}

export function CardLoading({ className }: CardLoadingProps) {
  return (
    <div className={cn('p-6', className)}>
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

// Skeleton grid for lists
interface SkeletonGridProps {
  count?: number;
  className?: string;
  itemClassName?: string;
}

export function SkeletonGrid({ 
  count = 6, 
  className,
  itemClassName 
}: SkeletonGridProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn('h-16 w-full', itemClassName)} />
      ))}
    </div>
  );
}

// Skeleton cards for grid layouts
interface SkeletonCardsProps {
  count?: number;
  className?: string;
  cardClassName?: string;
}

export function SkeletonCards({ 
  count = 6, 
  className,
  cardClassName 
}: SkeletonCardsProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn('space-y-4 p-4', cardClassName)}>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-8 w-1/3" />
        </div>
      ))}
    </div>
  );
}

// Table skeleton
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  className 
}: TableSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                'h-4 flex-1',
                colIndex === 0 && 'w-8', // First column (avatar/icon)
                colIndex === columns - 1 && 'w-16' // Last column (actions)
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Inline loading state
interface InlineLoadingProps {
  text?: string;
  className?: string;
}

export function InlineLoading({ 
  text = 'Loading...', 
  className 
}: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {text}
    </div>
  );
}
