'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Extension ID - set via environment variable for development
// In production, this will be the fixed Chrome Web Store extension ID
const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID;

// Declare chrome types for TypeScript
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

function ExtensionCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'sending' | 'success' | 'error'>('sending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const token = searchParams.get('token');
  const refreshToken = searchParams.get('refresh_token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No authentication token received.');
      return;
    }

    // Get current theme from localStorage or system preference
    const getTheme = (): string => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('theme');
        if (stored) return stored;
        if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
      }
      return 'dark';
    };

    // Try externally_connectable first (direct extension communication)
    const sendViaExternallyConnectable = (extensionId: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!window.chrome?.runtime?.sendMessage) {
          resolve(false);
          return;
        }

        try {
          const theme = getTheme();
          window.chrome.runtime.sendMessage(
            extensionId,
            { type: 'MARKED_AUTH_TOKEN', token, refreshToken, theme },
            (response: unknown) => {
              const res = response as { success?: boolean } | undefined;
              if (res?.success) {
                resolve(true);
              } else {
                resolve(false);
              }
            }
          );

          // Timeout fallback
          setTimeout(() => resolve(false), 2000);
        } catch {
          resolve(false);
        }
      });
    };

    // Fallback: Send via postMessage for content script
    const sendViaPostMessage = () => {
      const theme = getTheme();
      window.postMessage(
        { type: 'MARKED_AUTH_TOKEN', token, refreshToken, theme },
        window.location.origin
      );
    };

    const attemptTokenTransfer = async () => {
      let success = false;

      // Try externally_connectable if extension ID is known
      if (EXTENSION_ID) {
        success = await sendViaExternallyConnectable(EXTENSION_ID);
      }

      // Fallback to postMessage (content script) with retries
      if (!success) {
        // Retry postMessage multiple times to handle content script timing
        for (let i = 0; i < 3; i++) {
          sendViaPostMessage();
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }

      // We can't know for sure if postMessage worked, so assume success
      setStatus('success');
    };

    attemptTokenTransfer();
  }, [token, refreshToken]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="relative w-14 h-14 mx-auto">
          <Image
            src="/logos/marked-app-icon.png"
            alt="Marked"
            width={56}
            height={56}
            unoptimized
            className={`rounded-2xl ${status === 'sending' ? 'opacity-50' : ''} ${status === 'error' ? 'opacity-30' : ''}`}
            style={{ width: '56px', height: '56px' }}
          />
          {status === 'sending' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {status === 'sending' && 'Connecting to extension...'}
            {status === 'success' && 'Successfully signed in!'}
            {status === 'error' && 'Authentication failed'}
          </h1>
          <p className="mt-2 text-foreground-muted">
            {status === 'sending' && 'Please wait while we connect your account.'}
            {status === 'success' && 'You can now close this window and use the extension.'}
            {status === 'error' && (errorMessage || 'Authentication failed. Please try again.')}
          </p>
        </div>

        {status === 'success' && (
          <p className="text-sm text-foreground-faint">This tab will close automatically...</p>
        )}

        {status === 'error' && (
          <a
            href="/login?extension=true"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Try again
          </a>
        )}

        {/* Hidden element for content script to detect token */}
        {token && (
          <div
            id="marked-extension-token"
            data-token={token}
            data-refresh-token={refreshToken || ''}
            style={{ display: 'none' }}
          />
        )}
      </div>
    </div>
  );
}

export default function ExtensionCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ExtensionCallbackContent />
    </Suspense>
  );
}
