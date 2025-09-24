import { designTokens, PageLayoutProps } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

export const PageLayout = ({ 
  title, 
  description, 
  children, 
  className 
}: PageLayoutProps) => {
  return (
    <div className={cn(designTokens.layout.pageContainer, className)}>
      <div className={designTokens.layout.pageHeader}>
        <h1 className={designTokens.typography.pageTitle}>{title}</h1>
        {description && (
          <p className={designTokens.typography.pageSubtitle}>{description}</p>
        )}
      </div>
      {children}
    </div>
  );
};
