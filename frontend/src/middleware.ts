import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve cookies to check auth status
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const isAuthenticated = !!(accessToken || refreshToken);

  // Define route categories
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isProtectedRoute = pathname.startsWith('/profile') || pathname.startsWith('/admin') || pathname.startsWith('/downloads');

  // If user is authenticated and tries to access login/register, redirect to profile
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  // NOTE:
  // Remove server-side redirects for protected routes so the App Router
  // client can perform auth checks using backend cookies (cross-origin).
  // Server-side middleware cannot see cookies set on the backend origin,
  // which can cause false-positives in production when frontend and
  // backend are on different domains. Let client-side code handle
  // redirecting unauthenticated users to `/login` instead.

  return NextResponse.next();
}

export const config = {
  // Apply middleware to these routes
  matcher: [
    '/login',
    '/register',
    '/profile/:path*',
    '/admin/:path*',
    '/downloads/:path*'
  ],
};
