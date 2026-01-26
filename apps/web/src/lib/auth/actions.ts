'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signInWithGoogle(redirectTo?: string, fromExtension?: boolean) {
  const supabase = await createClient();

  const callbackParams = new URLSearchParams();
  if (redirectTo) {
    callbackParams.set('next', redirectTo);
  }
  if (fromExtension) {
    callbackParams.set('extension', 'true');
  }
  const callbackQuery = callbackParams.toString() ? `?${callbackParams.toString()}` : '';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback${callbackQuery}`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut(fromExtension?: boolean) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // If logging out from extension context, redirect to special page
  if (fromExtension) {
    redirect('/auth/extension-logout');
  }

  redirect('/login');
}

export async function getUser() {
  // Uses getCurrentUser which respects ENV=local for mock auth
  return getCurrentUser();
}

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}
