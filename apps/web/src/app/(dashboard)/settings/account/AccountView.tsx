'use client';

import { useState, useEffect } from 'react';
import { AccountClient } from './AccountClient';

export function AccountView() {
  const [data, setData] = useState<{ email: string; created_at: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/v1/user')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json?.data) {
          setData(json.data);
        }
      })
      .catch((err) => console.error('Failed to fetch user:', err));

    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="rounded-xl border border-border p-6">
          <div className="h-5 w-24 bg-muted rounded mb-4" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return <AccountClient email={data.email} createdAt={data.created_at} />;
}
