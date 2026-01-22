import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import { authConfig } from './auth.config';

/**
 * Full auth configuration with Prisma adapter.
 * Used for server-side auth operations (API routes, server components).
 * Middleware uses auth.config.ts directly to avoid bundling Prisma.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
});
