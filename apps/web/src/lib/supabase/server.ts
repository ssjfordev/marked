import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import type { Database } from '@/types/database';
import type { User } from '@supabase/supabase-js';

/**
 * Check if running in local development mode.
 * Local dev mode uses mock user (dev@localhost) for authentication.
 * ENV values:
 * - 'local': Local development with mock auth (dev@localhost)
 * - 'development': Dev server deployment with real auth
 * - 'production': Production with real auth
 */
export function isLocalDev(): boolean {
  return process.env.ENV === 'local';
}

// Local dev mock user - uses a real user ID from auth.users
// to satisfy foreign key constraints. Only used when ENV=local.
const LOCAL_DEV_MOCK_USER: User = {
  id: 'c7e18ec7-c994-4ae0-b3b4-7bb5a6318685',
  email: 'dev@localhost',
  app_metadata: {},
  user_metadata: { full_name: 'Local Dev User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

export async function createServerClient() {
  const cookieStore = await cookies();

  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

// Alias for backwards compatibility
export const createClient = createServerClient;

/**
 * Create a Supabase client with service role (admin) privileges.
 * Use only in trusted server-side contexts.
 */
export function createServiceClient() {
  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}

/**
 * Get the current authenticated user.
 * In local dev mode (ENV=local), returns a mock user (dev@localhost).
 * In other environments, uses real Supabase authentication.
 * Supports both cookie-based auth (web app) and Bearer token auth (extension).
 */
export async function getCurrentUser(): Promise<User | null> {
  // Local dev mode - use mock user
  if (isLocalDev()) {
    return LOCAL_DEV_MOCK_USER;
  }

  // Check for Bearer token (used by Chrome extension)
  const headerStore = await headers();
  const authHeader = headerStore.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const supabase = createServiceClient();
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    return user;
  }

  // Fall back to cookie-based auth (web app)
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Create a Supabase client for API routes.
 * Uses service client for Bearer token auth (extension), cookie client otherwise.
 * Call this AFTER requireAuth() to ensure the user is authenticated.
 */
export async function createApiClient() {
  const headerStore = await headers();
  const authHeader = headerStore.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return createServiceClient();
  }
  return createServerClient();
}

/**
 * Get current user ID, throws if not authenticated.
 */
export async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user.id;
}
