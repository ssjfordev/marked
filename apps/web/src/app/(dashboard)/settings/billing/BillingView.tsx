'use client';

import { useState, useEffect } from 'react';
import { BillingClient } from './BillingClient';

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
}

export function BillingView() {
  const [data, setData] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/v1/subscription')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json?.data) {
          setData(json.data);
        }
      })
      .catch((err) => console.error('Failed to fetch subscription:', err));

    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="rounded-xl border border-border p-6">
          <div className="h-5 w-32 bg-muted rounded mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <BillingClient
      currentPlan={data.plan}
      status={data.status}
      currentPeriodEnd={data.currentPeriodEnd}
      hasStripeCustomer={data.hasStripeCustomer}
    />
  );
}
