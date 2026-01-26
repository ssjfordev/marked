import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import type { User } from '@supabase/supabase-js';

/**
 * Check if running in local development mode.
 * Local dev mode uses mock user (dev@localhost) for authentication.
 */
function isLocalDev(): boolean {
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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Local dev mode - use mock user instead of real auth
  if (isLocalDev()) {
    return { supabaseResponse, user: LOCAL_DEV_MOCK_USER };
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
