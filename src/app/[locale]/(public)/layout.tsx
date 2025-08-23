
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';


const Header = () => {
  const t = useTranslations('Navigation');

  return (
  <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container flex h-16 items-center justify-between">
      <Link href="/" aria-label="Go to homepage">
        <Logo />
      </Link>
      <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
         <Link href="/about" className="transition-colors hover:text-primary">{t('about')}</Link>
        <Link href="/careers" className="transition-colors hover:text-primary">{t('careers')}</Link>
        <Link href="/contact-us" className="transition-colors hover:text-primary">{t('contact')}</Link>
        <Link href="/help-center" className="transition-colors hover:text-primary">{t('helpCenter')}</Link>
      </nav>
      <div className="flex items-center space-x-2">
        <p>
          {t('language')}
        </p>
        <LanguageSwitcher />
        <Button variant="ghost" asChild>
          <Link href="/login">{t('login')}</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">{t('signup')}</Link>
        </Button>
      </div>
    </div>
  </header>
  )
};

const Footer = () => {
  const t = useTranslations('Footer');
  
  return (
  <footer className="border-t bg-secondary">
    <div className="container grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
        <div>
            <Logo />
        </div>
        <div>
            <h4 className="font-semibold mb-2">{t('company')}</h4>
            <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-muted-foreground hover:text-primary">{t('about')}</Link></li>
                <li><Link href="/careers" className="text-muted-foreground hover:text-primary">{t('careers')}</Link></li>
                <li><Link href="/partners" className="text-muted-foreground hover:text-primary">{t('partners')}</Link></li>
            </ul>
        </div>
        <div>
            <h4 className="font-semibold mb-2">{t('support')}</h4>
            <ul className="space-y-2 text-sm">
                <li><Link href="/help-center" className="text-muted-foreground hover:text-primary">{t('helpCenter')}</Link></li>
                <li><Link href="/contact-us" className="text-muted-foreground hover:text-primary">{t('contact')}</Link></li>
                <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-primary">{t('terms')}</Link></li>
            </ul>
        </div>
        <div>
             <h4 className="font-semibold mb-2">{t('stayConnected')}</h4>
             <div className="flex space-x-4">
                <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} LocalPro. {t('allRightsReserved')}</p>
             </div>
        </div>
    </div>
  </footer>
  );
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
        router.push('/dashboard');
    }
  }, [user, loading, router]);

   if (loading || user) {
      return (
          <div className="flex min-h-screen items-center justify-center bg-secondary">
              <div className="flex flex-col items-center gap-4">
                  <Logo />
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p>Loading your experience...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
