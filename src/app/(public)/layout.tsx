
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Header = () => {
  const t = useTranslations('Navigation');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="Go to homepage" className="flex items-center">
          <Logo />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-8 text-sm font-medium lg:flex" role="navigation" aria-label="Main navigation">
          <Link 
            href="/our-services" 
            className="transition-colors hover:text-primary relative group"
          >
            {t('services')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </Link>
          <Link 
            href="/about" 
            className="transition-colors hover:text-primary relative group"
          >
            {t('about')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </Link>
          <Link 
            href="/careers" 
            className="transition-colors hover:text-primary relative group"
          >
            {t('careers')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </Link>
          <Link 
            href="/contact-us" 
            className="transition-colors hover:text-primary relative group"
          >
            {t('contact')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </Link>
          <Link 
            href="/help-center" 
            className="transition-colors hover:text-primary relative group"
          >
            {t('helpCenter')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </Link>
          <Link 
            href="/learning-hub" 
            className="transition-colors hover:text-primary relative group"
          >
            Learning Hub
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center space-x-3 lg:flex">
          <LanguageSwitcher />
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/login">{t('login')}</Link>
          </Button>
          <Button asChild className="shadow-sm hover:shadow-md transition-all duration-200">
            <Link href="/signup">{t('signup')}</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center space-x-2 lg:hidden">
          <LanguageSwitcher />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-6 mt-6">
                <nav className="flex flex-col space-y-4" role="navigation" aria-label="Mobile navigation">
                  <Link 
                    href="/our-services" 
                    className="text-lg font-medium transition-colors hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('services')}
                  </Link>
                  <Link 
                    href="/about" 
                    className="text-lg font-medium transition-colors hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('about')}
                  </Link>
                  <Link 
                    href="/careers" 
                    className="text-lg font-medium transition-colors hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('careers')}
                  </Link>
                  <Link 
                    href="/contact-us" 
                    className="text-lg font-medium transition-colors hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('contact')}
                  </Link>
                  <Link 
                    href="/help-center" 
                    className="text-lg font-medium transition-colors hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('helpCenter')}
                  </Link>
                  <Link 
                    href="/learning-hub" 
                    className="text-lg font-medium transition-colors hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Learning Hub
                  </Link>
                </nav>
                <div className="flex flex-col space-y-3 pt-6 border-t">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      {t('login')}
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      {t('signup')}
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

const Footer = () => {
  const t = useTranslations('Footer');
  
  return (
    <footer className="border-t bg-gradient-to-b from-background to-muted/30">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-16">
          <div className="space-y-4">
            <Logo />
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Connecting communities with trusted local service providers across the Philippines.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                <a href="https://www.facebook.com/localproasia/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                <a href="https://www.linkedin.com/company/localproasia/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </Button>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t('company')}</h4>
            <ul className="space-y-3 text-sm" role="list">
              <li><Link href="/our-services" className="text-muted-foreground hover:text-primary transition-colors">{t('services')}</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">{t('about')}</Link></li>
              <li><Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors">{t('careers')}</Link></li>
              <li><Link href="/partners" className="text-muted-foreground hover:text-primary transition-colors">{t('partners')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t('support')}</h4>
            <ul className="space-y-3 text-sm" role="list">
              <li><Link href="/help-center" className="text-muted-foreground hover:text-primary transition-colors">{t('helpCenter')}</Link></li>
              <li><Link href="/learning-hub" className="text-muted-foreground hover:text-primary transition-colors">Learning Hub</Link></li>
              <li><Link href="/contact-us" className="text-muted-foreground hover:text-primary transition-colors">{t('contact')}</Link></li>
              <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">{t('terms')}</Link></li>
              <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Contact Information</h4>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Get in touch with us for support and inquiries.
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">📧 admin@localpro.asia</p>
              <p className="text-muted-foreground">📞 +639179157515</p>
            </div>
          </div>
        </div>
        <div className="border-t pt-8 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} LocalPro. {t('allRightsReserved')}
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">Cookie Policy</Link>
            </div>
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
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Conditionally render header/footer based on route in a client component if needed */}
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
