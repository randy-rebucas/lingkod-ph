import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

export const Logo = ({ className }: { className?: string }) => {
  const t = useTranslations('Logo');
  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold font-headline leading-none bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t('Local')}{t('Pro')}
        </h1>
        <p className="text-xs font-medium text-muted-foreground tracking-wide">
          {t('YourTrustedLocalPros')}
        </p>
      </div>
    </div>
  );
};
