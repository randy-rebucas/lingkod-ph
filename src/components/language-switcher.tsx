'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
];

export const LanguageSwitcher = memo(function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('en');

  // Memoize cookie getter function
  const getCookie = useCallback((name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  }, []);

  useEffect(() => {
    const locale = getCookie('locale') || 'en';
    setCurrentLocale(locale);
  }, [getCookie]);

  const handleLanguageChange = useCallback(async (locale: string) => {
    // Set cookie for the selected language
    document.cookie = `locale=${locale}; path=/; max-age=31536000`; // 1 year
    
    // Reload the page to apply the new language
    window.location.reload();
  }, []);

  // Memoize current language lookup
  const currentLanguage = useMemo(() => 
    languages.find(lang => lang.code === currentLocale) || languages[0],
    [currentLocale]
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 gap-1" aria-label="Select language">
          <Globe className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">{currentLanguage.flag}</span>
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="cursor-pointer"
            aria-label={`Switch to ${language.name}`}
          >
            <span className="mr-2" aria-hidden="true">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
