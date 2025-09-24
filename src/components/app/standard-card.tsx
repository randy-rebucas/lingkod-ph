import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { designTokens, StandardCardProps } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

export const StandardCard = ({ 
  title, 
  description, 
  children, 
  footer, 
  className,
  variant = 'standard'
}: StandardCardProps) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'elevated':
        return designTokens.effects.cardElevated;
      case 'glass':
        return designTokens.effects.cardGlass;
      default:
        return designTokens.effects.cardStandard;
    }
  };

  return (
    <Card className={cn(getVariantClass(), className)}>
      <CardHeader className={designTokens.spacing.cardHeader}>
        <CardTitle className={designTokens.typography.cardTitle}>
          {title}
        </CardTitle>
        {description && (
          <CardDescription className={designTokens.typography.cardDescription}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={designTokens.spacing.cardContent}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className={designTokens.spacing.cardFooter}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};
