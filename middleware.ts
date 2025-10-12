import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'tl'],
  defaultLocale: 'en',
  localePrefix: 'as-needed'
});

export async function middleware(request: NextRequest) {
  // Skip middleware for server actions to prevent interference
  if (request.nextUrl.pathname.startsWith('/_next/static/') || 
      request.nextUrl.pathname.includes('server-actions') ||
      request.headers.get('next-action')) {
    return NextResponse.next();
  }

  // Security: Rate limiting headers
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'http://localhost:9006');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }

  // Basic route protection - redirect to login for protected routes
  // Detailed authentication and role-based access control is handled client-side
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/bookings',
    '/admin',
    '/agency',
    '/partner',
    '/provider'
  ];

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // For protected routes, we'll let the client-side auth context handle the authentication
  // The middleware will only handle basic security headers and internationalization
  if (isProtectedRoute) {
    // Check if there's an auth token in the request headers (from client-side)
    const authHeader = request.headers.get('authorization');
    const hasAuthToken = authHeader && authHeader.startsWith('Bearer ');
    
    // If no auth token is present, redirect to login
    // Note: This is a basic check - detailed auth validation happens client-side
    if (!hasAuthToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Apply internationalization middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};