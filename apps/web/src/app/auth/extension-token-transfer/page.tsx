'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID;

declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (
          extensionId: string,
          message: unknown,
          callback?: (response: unknown) => void
        ) => void;
      };
    };
  }
}

export default function ExtensionTokenTransferPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    async function transferToken() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setStatus('error');
          return;
        }

        const token = session.access_token;
        const refreshToken = session.refresh_token;

        // Get theme
        const stored = localStorage.getItem('theme');
        const theme =
          stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

        let sent = false;

        // Try externally_connectable first
        if (EXTENSION_ID && window.chrome?.runtime?.sendMessage) {
          try {
            sent = await new Promise<boolean>((resolve) => {
              window.chrome!.runtime!.sendMessage(
                EXTENSION_ID!,
                { type: 'MARKED_AUTH_TOKEN', token, refreshToken, theme },
                (response: unknown) => {
                  const res = response as { success?: boolean } | undefined;
                  resolve(!!res?.success);
                }
              );
              setTimeout(() => resolve(false), 2000);
            });
          } catch {
            sent = false;
          }
        }

        // Fallback: postMessage for content script
        if (!sent) {
          window.postMessage(
            { type: 'MARKED_AUTH_TOKEN', token, refreshToken, theme },
            window.location.origin
          );
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        setStatus('success');
      } catch {
        setStatus('error');
      }
    }

    transferToken();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          {status === 'loading' && 'Connecting to extension...'}
          {status === 'success' && 'Successfully connected!'}
          {status === 'error' && 'Connection failed'}
        </h1>
        <p className="text-foreground-muted">
          {status === 'loading' && 'Transferring your session to the extension...'}
          {status === 'success' && 'You can now close this tab and use the extension.'}
          {status === 'error' && 'Could not connect. Please try again.'}
        </p>
        {status === 'success' && (
          <button onClick={() => window.close()} className="text-primary-light hover:underline">
            Close this tab
          </button>
        )}
      </div>
    </div>
  );
}
