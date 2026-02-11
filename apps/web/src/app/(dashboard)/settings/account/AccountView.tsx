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
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-foreground-muted border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AccountClient email={data.email} createdAt={data.created_at} />;
}
