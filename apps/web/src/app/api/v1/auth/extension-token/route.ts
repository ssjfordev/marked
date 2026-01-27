import { NextResponse } from 'next/server';
import { isLocalDev } from '@/lib/supabase/server';

// Mock token for local development
const LOCAL_DEV_MOCK_TOKEN = 'local-dev-mock-token-c7e18ec7-c994-4ae0-b3b4-7bb5a6318685';

/**
 * GET /api/v1/auth/extension-token
 * Returns a mock token for extension authentication in local dev mode.
 * Only works when ENV=local.
 */
export async function GET() {
  if (!isLocalDev()) {
    return NextResponse.json(
      { error: 'This endpoint is only available in local development mode' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    token: LOCAL_DEV_MOCK_TOKEN,
    user: {
      id: 'c7e18ec7-c994-4ae0-b3b4-7bb5a6318685',
      email: 'dev@localhost',
    },
  });
}
