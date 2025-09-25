import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';
import { designTokens } from '@/lib/design-tokens';

export const Logo = ({ className }: { className?: string }) => {
  const t = useTranslations('Logo');
  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex flex-col">
        <h1 className={`text-3xl font-bold font-headline leading-none bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent ${designTokens.typography.pageTitle}`}>
          {t('Local')}{t('Pro')}
        </h1>
        <p className={`text-xs font-medium text-muted-foreground tracking-wide ${designTokens.typography.cardDescription}`}>
          {t('YourTrustedLocalPros')}
        </p>
      </div>
    </div>
  );
};
