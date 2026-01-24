'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback${redirectTo ? `?next=${redirectTo}` : ''}`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function getUser() {
  // Uses getCurrentUser which respects DEV_AUTH_BYPASS
  return getCurrentUser();
}

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}
