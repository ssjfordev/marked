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
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-foreground-muted border-t-transparent rounded-full animate-spin" />
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
