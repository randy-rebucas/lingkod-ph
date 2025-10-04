'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import Link from 'next/link';

export default function TestI18nPage() {
  const t = useTranslations('HomePage');
  const navT = useTranslations('Navigation');
  const commonT = useTranslations('Common');

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Internationalization Test</h1>
        <LanguageSwitcher />
      </div>

      <div className="grid gap-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">HomePage Translations</h2>
          <div className="space-y-2">
            <p><strong>Title:</strong> {t('title')}</p>
            <p><strong>Description:</strong> {t('description')}</p>
            <p><strong>Hero Title:</strong> {t('hero.title')}</p>
            <p><strong>Hero Subtitle:</strong> {t('hero.subtitle')}</p>
            <p><strong>Hero CTA:</strong> {t('hero.cta')}</p>
          </div>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Navigation Translations</h2>
          <div className="space-y-2">
            <p><strong>Home:</strong> {navT('home')}</p>
            <p><strong>Services:</strong> {navT('services')}</p>
            <p><strong>Providers:</strong> {navT('providers')}</p>
            <p><strong>Login:</strong> {navT('login')}</p>
            <p><strong>Sign Up:</strong> {navT('signup')}</p>
          </div>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Common Translations</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {commonT('loading')}</p>
            <p><strong>Error:</strong> {commonT('error')}</p>
            <p><strong>Success:</strong> {commonT('success')}</p>
            <p><strong>Cancel:</strong> {commonT('cancel')}</p>
            <p><strong>Save:</strong> {commonT('save')}</p>
          </div>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="space-y-2">
            <p>1. Use the language switcher (globe icon) in the top right to change languages</p>
            <p>2. The page will reload and show translations in the selected language</p>
            <p>3. The language preference is stored in a cookie and will persist across sessions</p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
