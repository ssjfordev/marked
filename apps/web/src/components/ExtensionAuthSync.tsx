'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Invisible component that syncs the web auth session to the Chrome extension.
 * Posts a message to the content script on every page load so the extension
 * stays authenticated whenever the user visits the web app.
 */
export function ExtensionAuthSync() {
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;

      window.postMessage(
        {
          type: 'MARKED_AUTH_TOKEN',
          token: session.access_token,
          refreshToken: session.refresh_token,
        },
        window.location.origin
      );
    });
  }, []);

  return null;
}
