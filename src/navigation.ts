import {createLocalizedPathnamesNavigation} from 'next-intl/navigation';

export const locales = ['en', 'tl'] as const;
export const localePrefix = 'always'; // Default

export const pathnames = {
  // If all locales use the same pathname, a single
  // external path can be used for all locales.
  '/': '/',
  '/about': '/about',
  '/careers': '/careers',
  '/contact-us': '/contact-us',
  '/help-center': '/help-center',
  '/partners': '/partners',
  '/terms-of-service': '/terms-of-service',
  '/login': '/login',
  '/signup': '/signup',
  '/forgot-password': '/forgot-password',
  '/setup': '/setup',
} satisfies Record<string, string>;


export const {Link, redirect, usePathname, useRouter, getPathname} =
  createLocalizedPathnamesNavigation({locales, localePrefix, pathnames});
