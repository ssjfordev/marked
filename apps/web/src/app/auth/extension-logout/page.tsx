'use client';

import { useEffect, useState } from 'react';

export default function ExtensionLogoutPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Send logout message to extension
    window.postMessage({ type: 'MARKED_AUTH_LOGOUT' }, window.location.origin);

    setTimeout(() => {
      setDone(true);
    }, 500);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Signed out</h1>
          <p className="mt-2 text-foreground-muted">
            You have been signed out from Marked extension.
          </p>
        </div>

        {done && (
          <button
            onClick={() => window.close()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-white font-medium hover:bg-primary-dark transition-colors"
          >
            Close this tab
          </button>
        )}
      </div>
    </div>
  );
}
