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

  // If user is NOT authenticated and tries to access protected routes, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Optional: add a redirect_to parameter to send them back after logging in
    // loginUrl.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(loginUrl);
  }

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
