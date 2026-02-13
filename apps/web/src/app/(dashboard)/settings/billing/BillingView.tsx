'use client';

import { useState, useEffect, useCallback } from 'react';
import { BillingClient } from './BillingClient';

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
}

export function BillingView() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState(false);

  const fetchSubscription = useCallback(() => {
    setError(false);
    setData(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    fetch('/api/v1/subscription', { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) setData(json.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => clearTimeout(timer));

    return controller;
  }, []);

  useEffect(() => {
    const controller = fetchSubscription();
    return () => controller.abort();
  }, [fetchSubscription]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-foreground-muted text-sm">Failed to load data</p>
        <button
          onClick={fetchSubscription}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

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
