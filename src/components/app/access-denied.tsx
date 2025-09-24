import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { designTokens } from '@/lib/design-tokens';

interface AccessDeniedProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
  backHref?: string;
}

export const AccessDenied = ({ 
  title = "Access Denied",
  description = "You don't have permission to access this page.",
  showBackButton = true,
  backHref = "/dashboard"
}: AccessDeniedProps) => {
  return (
    <div className={designTokens.layout.pageContainer}>
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className={designTokens.typography.cardTitle}>
            {title}
          </CardTitle>
          <CardDescription className={designTokens.typography.cardDescription}>
            {description}
          </CardDescription>
        </CardHeader>
        {showBackButton && (
          <CardContent className="text-center">
            <Button asChild variant="outline">
              <Link href={backHref} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
