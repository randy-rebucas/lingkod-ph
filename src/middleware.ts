import createMiddleware from 'next-intl/middleware';
import {locales, localePrefix, pathnames} from './navigation';

export default createMiddleware({
  defaultLocale: 'en',
  locales,
  localePrefix,
  pathnames
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `.` (e.g. `/_next/static`)
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|.*\\..*).*)',
    // Match all pathnames within `/` (e.g. `/en`, `/en/about`)
    '/(tl|en)/:path*'
  ]
};
