import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

// Define protected routes and their required roles
const protectedRoutes = {
  '/admin': ['admin'],
  '/earnings': ['provider', 'agency'],
  '/smart-rate': ['provider', 'agency'],
  '/quote-builder': ['provider', 'agency'],
  '/analytics': ['provider', 'agency'],
  '/invoices': ['provider', 'agency'],
  '/manage-providers': ['agency'],
  '/reports': ['agency'],
  '/post-a-job': ['client', 'agency'],
  '/my-job-posts': ['client', 'agency'],
  '/my-favorites': ['client', 'agency'],
  '/applied-jobs': ['provider'],
  '/services': ['provider'],
  '/jobs': ['provider'],
  '/partners': ['partner'],
  '/dashboard': ['client', 'provider', 'agency', 'admin', 'partner'],
  '/bookings': ['client', 'provider', 'agency'],
  '/profile': ['client', 'provider', 'agency', 'admin', 'partner'],
  '/messages': ['client', 'provider', 'agency'],
  '/notifications': ['client', 'provider', 'agency', 'admin', 'partner'],
  '/settings': ['client', 'provider', 'agency', 'admin', 'partner'],
  '/billing': ['client', 'provider', 'agency'],
} as const;

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/setup',
  '/about',
  '/careers',
  '/contact-us',
  '/help-center',
  '/terms-of-service',
  '/partners',
  '/',
];

// Helper function to verify JWT token and get user role
async function verifyTokenAndGetRole(token: string): Promise<{ uid: string; role: string } | null> {
  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user role from Firestore
    const { db } = await import('@/lib/firebase');
    const { doc, getDoc } = await import('firebase/firestore');
    
    const userDoc = await getDoc(doc(db, 'users', decodedToken.uid));
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    return {
      uid: decodedToken.uid,
      role: userData.role || 'client'
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Helper function to log security events
function logSecurityEvent(event: string, details: any, request: NextRequest) {
  console.log(`[SECURITY] ${event}:`, {
    timestamp: new Date().toISOString(),
    path: request.nextUrl.pathname,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'unknown',
    ...details
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }
  
  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const requiresAuth = Object.keys(protectedRoutes).some(route => 
    pathname.startsWith(route)
  );

  if (requiresAuth) {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', { reason: 'No token provided' }, request);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify token and get user role
    const userInfo = await verifyTokenAndGetRole(token);
    if (!userInfo) {
      logSecurityEvent('INVALID_TOKEN_ATTEMPT', { token: token.substring(0, 20) + '...' }, request);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user role is allowed for this route
    const allowedRoles = Object.entries(protectedRoutes)
      .find(([route]) => pathname.startsWith(route))?.[1] as string[] | undefined;

    if (allowedRoles && !allowedRoles.includes(userInfo.role)) {
      logSecurityEvent('UNAUTHORIZED_ROLE_ACCESS', { 
        userRole: userInfo.role, 
        requiredRoles: allowedRoles,
        userId: userInfo.uid 
      }, request);
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Log successful authentication
    logSecurityEvent('AUTHENTICATED_ACCESS', { 
      userId: userInfo.uid, 
      role: userInfo.role 
    }, request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
