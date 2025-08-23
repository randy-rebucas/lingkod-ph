import createMiddleware from 'next-intl/middleware';
import {locales, localePrefix, pathnames} from './src/navigation';

export default createMiddleware({
  defaultLocale: 'en',
  locales,
  localePrefix,
  pathnames
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(tl|en)/:path*']
};
