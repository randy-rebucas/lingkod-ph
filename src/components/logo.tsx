import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';
import { memo } from 'react';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
}

function LogoComponent({ className, showTagline = true }: LogoProps) {
  const t = useTranslations('Logo');
  
  // Safely get translation values
  const localText = t('Local') || 'Local';
  const proText = t('Pro') || 'Pro';
  const taglineText = t('YourTrustedLocalPros') || 'Your Trusted Local Pros';
  
  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex flex-col">
        <h1 
          className="text-3xl font-bold font-headline leading-none"
          suppressHydrationWarning
        >
          <span className="text-primary">{localText}</span>
          <span className="text-accent">{proText}</span>
        </h1>
        {showTagline && (
          <p className="text-xs font-medium text-muted-foreground tracking-wide">
            {taglineText}
          </p>
        )}
      </div>
    </div>
  );
}

export const Logo = memo(LogoComponent);
