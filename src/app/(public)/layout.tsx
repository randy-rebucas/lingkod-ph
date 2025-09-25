
'use client';

import React from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
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
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281h-1.297v1.297h1.297V7.707zm-3.323 1.297c.718 0 1.297.579 1.297 1.297s-.579 1.297-1.297 1.297-1.297-.579-1.297-1.297.579-1.297 1.297-1.297z"/>
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
              <li><Link href="/contact-us" className="text-muted-foreground hover:text-primary transition-colors">{t('contact')}</Link></li>
              <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">{t('terms')}</Link></li>
              <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t('stayConnected')}</h4>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Follow us for updates and community news.
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">📧 support@localpro.asia</p>
              <p className="text-muted-foreground">📞 +63 2 1234 5678</p>
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
