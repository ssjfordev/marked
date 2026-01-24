/**
 * API Auth Utilities
 *
 * Authentication helpers for API routes.
 */

import { getCurrentUser } from '@/lib/supabase/server';
import { UnauthorizedError } from './errors';
import type { User } from '@supabase/supabase-js';

/**
 * Get the current authenticated user from the request.
 * Throws UnauthorizedError if not authenticated.
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

/**
 * Get the current user if authenticated, or null.
 */
export async function getOptionalAuth(): Promise<User | null> {
  return getCurrentUser();
}
