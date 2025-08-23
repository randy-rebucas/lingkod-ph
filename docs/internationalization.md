# Internationalization (i18n) Implementation

This document describes the internationalization setup for the LocalPro application using `next-intl`.

## Overview

The application supports multiple languages with a focus on English and Filipino (Tagalog). The internationalization is implemented using the `next-intl` library following the [official guide](https://next-intl.dev/docs/getting-started/app-router).

## Architecture

### File Structure

```
├── messages/
│   ├── en.json          # English translations
│   └── tl.json          # Filipino (Tagalog) translations
├── src/
│   ├── i18n/
│   │   └── request.ts   # i18n configuration
│   ├── components/
│   │   └── language-switcher.tsx  # Language switcher component
│   └── app/
│       ├── layout.tsx   # Root layout with NextIntlClientProvider
│       ├── page.tsx     # Home page with translations
│       └── test-i18n/
│           └── page.tsx # Test page for i18n
├── next.config.ts       # Next.js config with next-intl plugin
└── package.json         # Dependencies
```

## Implementation Details

### 1. Installation

The `next-intl` package was installed:

```bash
npm install next-intl
```

### 2. Configuration Files

#### `src/i18n/request.ts`

This file handles locale detection and message loading:

```typescript
import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';

export default getRequestConfig(async () => {
  // Get locale from cookies, defaulting to 'en'
  const store = await cookies();
  const locale = store.get('locale')?.value || 'en';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

#### `next.config.ts`

Updated to include the next-intl plugin:

```typescript
import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // ... existing config
};

export default withNextIntl(nextConfig);
```

#### `src/app/layout.tsx`

Updated to wrap the application with `NextIntlClientProvider`:

```typescript
import {NextIntlClientProvider} from 'next-intl';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          {/* ... existing providers */}
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 3. Translation Files

#### `messages/en.json`

Contains English translations organized by feature:

```json
{
  "HomePage": {
    "title": "LocalPro | Find Trusted Local Service Providers in the Philippines",
    "hero": {
      "title": "Find Trusted Local Service Providers",
      "subtitle": "Connect with verified professionals for all your home and business needs",
      "cta": "Get Started"
    }
  },
  "Navigation": {
    "home": "Home",
    "services": "Services",
    "providers": "Providers",
    "login": "Login",
    "signup": "Sign Up"
  },
  "Common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Success",
    "cancel": "Cancel",
    "save": "Save"
  }
}
```

#### `messages/tl.json`

Contains Filipino translations with the same structure:

```json
{
  "HomePage": {
    "title": "LocalPro | Maghanap ng Mapagkakatiwalaang Local Service Providers sa Pilipinas",
    "hero": {
      "title": "Maghanap ng Mapagkakatiwalaang Local Service Providers",
      "subtitle": "Kumonekta sa mga verified na professionals para sa lahat ng iyong pangangailangan sa bahay at negosyo",
      "cta": "Magsimula"
    }
  },
  "Navigation": {
    "home": "Home",
    "services": "Mga Serbisyo",
    "providers": "Mga Provider",
    "login": "Mag-login",
    "signup": "Mag-sign Up"
  },
  "Common": {
    "loading": "Naglo-load...",
    "error": "May naganap na error",
    "success": "Tagumpay",
    "cancel": "Kanselahin",
    "save": "I-save"
  }
}
```

### 4. Language Switcher Component

#### `src/components/language-switcher.tsx`

A dropdown component that allows users to switch between languages:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
];

export function LanguageSwitcher() {
  const handleLanguageChange = async (locale: string) => {
    // Set cookie for the selected language
    document.cookie = `locale=${locale}; path=/; max-age=31536000`; // 1 year
    
    // Reload the page to apply the new language
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Globe className="h-4 w-4" />
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
```

### 5. Usage in Components

#### Client Components

For client components, use the `useTranslations` hook:

```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('HomePage');
  
  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      <button>{t('hero.cta')}</button>
    </div>
  );
}
```

#### Server Components

For server components, use the `getTranslations` function:

```typescript
import { getTranslations } from 'next-intl/server';

export default async function MyServerComponent() {
  const t = await getTranslations('HomePage');
  
  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
    </div>
  );
}
```

## Features

### 1. Language Persistence

- Language preference is stored in a cookie (`locale`)
- Cookie expires after 1 year
- Default language is English (`en`)

### 2. Supported Languages

- **English** (`en`) - Primary language
- **Filipino/Tagalog** (`tl`) - Secondary language

### 3. Translation Organization

Translations are organized by feature/section:

- `HomePage` - Home page content
- `Navigation` - Navigation menu items
- `Common` - Common UI elements (buttons, labels, etc.)
- `Auth` - Authentication-related text
- `Dashboard` - Dashboard content
- `Jobs` - Job-related content
- `Services` - Service-related content
- `Profile` - Profile page content
- `Settings` - Settings page content
- `Footer` - Footer content

### 4. Language Switcher

- Globe icon in the navigation header
- Dropdown with language options
- Flag emojis for visual identification
- Immediate language change with page reload

## Testing

### Test Page

A test page is available at `/test-i18n` to verify translations:

- Displays translations from different sections
- Includes the language switcher
- Shows instructions for testing

### Manual Testing

1. Visit the home page
2. Click the globe icon in the navigation
3. Select a different language
4. Verify that the page content changes
5. Refresh the page to ensure persistence

## Adding New Languages

To add a new language:

1. Create a new translation file in `messages/` (e.g., `es.json` for Spanish)
2. Add the language to the `languages` array in `language-switcher.tsx`
3. Translate all the keys from `en.json` to the new language
4. Test the implementation

## Adding New Translations

To add new translations:

1. Add the new keys to `messages/en.json`
2. Add corresponding translations to `messages/tl.json`
3. Use the translations in your components with `useTranslations` or `getTranslations`

## Best Practices

1. **Organize translations by feature** - Keep related translations together
2. **Use descriptive keys** - Make keys self-documenting
3. **Maintain consistency** - Use the same key structure across languages
4. **Test thoroughly** - Verify translations in all supported languages
5. **Consider context** - Some words may have different meanings in different contexts

## Troubleshooting

### Common Issues

1. **Translations not loading** - Check that the locale cookie is set correctly
2. **Missing translations** - Ensure all keys exist in all language files
3. **Build errors** - Verify that all translation files are valid JSON
4. **Client/Server mismatch** - Use appropriate hook/function for component type

### Debugging

1. Check browser cookies for the `locale` value
2. Verify translation files are being loaded correctly
3. Use the test page to isolate issues
4. Check browser console for any errors

## Future Enhancements

1. **Locale-based routing** - Add URL-based locale switching (e.g., `/en/about`, `/tl/about`)
2. **Automatic language detection** - Detect user's preferred language from browser settings
3. **More languages** - Add support for additional languages
4. **Translation management** - Integrate with a translation management system
5. **Dynamic loading** - Load translations on-demand for better performance
