import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/v1/auth/me
 * Returns the current authenticated user from Bearer token.
 * Used by the Chrome extension to verify authentication.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const supabase = createServiceClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email,
    });
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
