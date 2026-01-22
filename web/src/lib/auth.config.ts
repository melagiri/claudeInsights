import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';

/**
 * Edge-compatible auth configuration.
 * This file excludes the Prisma adapter to keep the middleware bundle small.
 * The full auth config with database adapter is in auth.ts
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === '/login';
      const isApiRoute = nextUrl.pathname.startsWith('/api');
      const isPublicAsset =
        nextUrl.pathname.startsWith('/_next') ||
        nextUrl.pathname.startsWith('/favicon');

      // Allow API routes and public assets
      if (isApiRoute || isPublicAsset) {
        return true;
      }

      // Redirect logged-in users away from login page
      if (isLoginPage && isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl));
      }

      // Redirect unauthenticated users to login
      if (!isLoginPage && !isLoggedIn) {
        const loginUrl = new URL('/login', nextUrl);
        loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
        return Response.redirect(loginUrl);
      }

      return true;
    },
    session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};
