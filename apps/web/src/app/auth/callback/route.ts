import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const extension = searchParams.get('extension') === 'true';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // If login is from extension, redirect to token transfer page
      if (extension) {
        const tokenParams = new URLSearchParams({
          token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires: data.session.expires_at?.toString() ?? '',
        });
        return NextResponse.redirect(`${origin}/auth/extension-callback?${tokenParams}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`);
}
