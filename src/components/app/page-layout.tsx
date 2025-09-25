import { designTokens, PageLayoutProps } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

export const PageLayout = ({ 
  title, 
  description, 
  children, 
  className,
  action
}: PageLayoutProps) => {
  return (
    <div className={cn(designTokens.layout.pageContainer, className)}>
      <div className="flex items-start justify-between gap-4">
        <div className={designTokens.layout.pageHeader}>
          <h1 className={designTokens.typography.pageTitle}>{title}</h1>
          {description && (
            <p className={designTokens.typography.pageSubtitle}>{description}</p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};
