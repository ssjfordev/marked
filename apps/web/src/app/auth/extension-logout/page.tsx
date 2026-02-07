'use client';

import Image from 'next/image';
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
        <Image
          src="/logos/marked-app-icon.png"
          alt="Marked"
          width={56}
          height={56}
          unoptimized
          className="rounded-2xl mx-auto"
          style={{ width: '56px', height: '56px' }}
        />

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
