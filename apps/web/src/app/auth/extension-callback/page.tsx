'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ExtensionCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'sending' | 'success' | 'error'>('sending');

  useEffect(() => {
    const token = searchParams.get('token');
    const expires = searchParams.get('expires');

    if (!token) {
      setStatus('error');
      return;
    }

    // Send token to extension via postMessage
    // The content script will receive this and store it
    window.postMessage(
      {
        type: 'MARKED_AUTH_TOKEN',
        token,
        expiresAt: expires ? parseInt(expires, 10) : null,
      },
      window.location.origin
    );

    // Give the extension time to receive the message
    setTimeout(() => {
      setStatus('success');
    }, 500);
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto">
          {status === 'sending' && (
            <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {status === 'success' && (
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === 'error' && (
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {status === 'sending' && 'Signing in to Extension...'}
            {status === 'success' && 'Signed in!'}
            {status === 'error' && 'Sign in failed'}
          </h1>
          <p className="mt-2 text-foreground-muted">
            {status === 'sending' && 'Transferring your session to the Marked extension.'}
            {status === 'success' && 'You can now close this tab and use the extension.'}
            {status === 'error' && 'Something went wrong. Please try signing in again.'}
          </p>
        </div>

        {status === 'success' && (
          <button
            onClick={() => window.close()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-white font-medium hover:bg-primary-dark transition-colors"
          >
            Close this tab
          </button>
        )}

        {status === 'error' && (
          <a
            href="/login?extension=true"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-white font-medium hover:bg-primary-dark transition-colors"
          >
            Try again
          </a>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Loading...</h1>
      </div>
    </div>
  );
}

export default function ExtensionCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ExtensionCallbackContent />
    </Suspense>
  );
}
