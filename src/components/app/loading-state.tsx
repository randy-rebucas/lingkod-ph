import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { designTokens, LoadingStateProps } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

export const LoadingState = ({ 
  title = "Loading...", 
  description = "Please wait while we load your data.",
  showSkeleton = true 
}: LoadingStateProps) => {
  return (
    <div className={designTokens.layout.pageContainer}>
      <div className={designTokens.layout.pageHeader}>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      {showSkeleton && (
        <Card>
          <CardContent className={designTokens.spacing.cardContent}>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
