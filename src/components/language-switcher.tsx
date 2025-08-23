'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
];

export function LanguageSwitcher() {
  const t = useTranslations('Common');
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('en');

  useEffect(() => {
    // Get current locale from cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    
    const locale = getCookie('locale') || 'en';
    setCurrentLocale(locale);
  }, []);

  const handleLanguageChange = async (locale: string) => {
    // Set cookie for the selected language
    document.cookie = `locale=${locale}; path=/; max-age=31536000`; // 1 year
    
    // Reload the page to apply the new language
    window.location.reload();
  };

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">{currentLanguage.flag}</span>
          <ChevronDown className="h-3 w-3" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="cursor-pointer"
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
