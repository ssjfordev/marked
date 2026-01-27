import { NextResponse } from 'next/server';

// Temporary debug endpoint — DELETE after verifying
export async function GET() {
  return NextResponse.json({
    ENV: process.env.ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MAX_TOKENS: process.env.AI_MAX_TOKENS,
    NEXT_PUBLIC_MAINTENANCE_MODE: process.env.NEXT_PUBLIC_MAINTENANCE_MODE,
    NODE_ENV: process.env.NODE_ENV,
    // secrets are intentionally excluded
  });
}
