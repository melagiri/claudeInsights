import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

/**
 * Edge-compatible middleware using auth config without Prisma.
 * Auth logic is handled in authConfig.callbacks.authorized
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
