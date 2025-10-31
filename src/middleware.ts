import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Public routes that don't require auth (will be used for auth)
  // const publicRoutes = ['/', '/tours', '/how-it-works', '/login', '/signup'];
  // const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Auth routes - redirect if already logged in
  const authRoutes = ['/login', '/signup', '/change-password'];
  if (authRoutes.includes(pathname) && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Protected client routes
  const clientProtectedRoutes = ['/bookings', '/profile'];
  const isClientProtected = clientProtectedRoutes.some(route => pathname.startsWith(route));
  
  if (isClientProtected && !session) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
  }

  // Admin-only routes
  const adminRoutes = ['/dashboard'];
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  
  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and api routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

