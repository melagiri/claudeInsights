import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === '/login';
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  const isPublicAsset = req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/favicon');

  // Allow API routes and public assets
  if (isApiRoute || isPublicAsset) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from login page
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Redirect unauthenticated users to login
  if (!isLoginPage && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    // Preserve the original URL to redirect back after login
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
