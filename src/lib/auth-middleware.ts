/**
 * Lightweight auth utilities for middleware
 * This avoids importing the full auth module which includes Prisma, bcrypt, etc.
 * and keeps the Edge Function bundle size small.
 */

import { NextRequest } from 'next/server';
import { decode } from 'next-auth/jwt';

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

/**
 * Get session from request cookies (lightweight, no Prisma)
 * This avoids importing the full auth module which includes Prisma, bcrypt, etc.
 */
export async function getSessionFromRequest(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const token = request.cookies.get('authjs.session-token')?.value || 
                  request.cookies.get('__Secure-authjs.session-token')?.value;

    if (!token || !AUTH_SECRET) {
      return null;
    }

    // Decode the JWT token
    // For NextAuth v5, we need to provide salt (can be empty string for JWT)
    const decoded = await decode({
      token,
      secret: AUTH_SECRET,
      salt: '', // JWT doesn't use salt, but NextAuth v5 requires it
    });

    if (!decoded) {
      return null;
    }

    // Return session-like object
    return {
      user: {
        id: decoded.id as string,
        email: decoded.email as string,
        name: decoded.name as string | null,
        role: decoded.role as 'CLIENT' | 'ADMIN',
      },
    };
  } catch (error) {
    // If decoding fails, return null (no session)
    return null;
  }
}
