'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from '@/components/LanguageProvider';

interface BillingClientProps {
  currentPlan: string;
  status: string;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
}

export function BillingClient({
  currentPlan,
  status,
  currentPeriodEnd,
  hasStripeCustomer,
}: BillingClientProps) {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const success = searchParams.get('success') === 'true';
  const canceled = searchParams.get('canceled') === 'true';

  const plans = [
    {
      id: 'free',
      name: t('plan.free'),
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        t('billing.free.feature1'),
        t('billing.free.feature2'),
        t('billing.free.feature3'),
        t('billing.free.feature4'),
        t('billing.free.feature5'),
      ],
      limitations: [
        t('billing.free.missing1'),
        t('billing.free.missing2'),
        t('billing.free.missing3'),
      ],
    },
    {
      id: 'pro',
      name: t('plan.pro'),
      monthlyPrice: 1.9,
      yearlyPrice: 19, // ~17% off
      features: [
        t('billing.pro.feature1'),
        t('billing.pro.feature2'),
        t('billing.pro.feature3'),
        t('billing.pro.feature4'),
        t('billing.pro.feature5'),
      ],
      popular: true,
    },
  ];

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: billingInterval }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/billing/portal', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Success/Cancel messages */}
      {success && (
        <div
          className="rounded-xl border p-5"
          style={{
            borderColor: 'var(--status-success-border)',
            backgroundColor: 'var(--status-success-bg)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--status-success-bg)' }}
            >
              <svg
                className="h-5 w-5"
                style={{ color: 'var(--status-success-text)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <span className="font-medium" style={{ color: 'var(--status-success-text)' }}>
                {t('billing.upgradeSuccess')}
              </span>
              <p className="mt-0.5 text-sm text-foreground-muted">
                {t('billing.upgradeSuccessDesc')}
              </p>
            </div>
          </div>
        </div>
      )}

      {canceled && (
        <div
          className="rounded-xl border p-5"
          style={{
            borderColor: 'var(--status-warning-border)',
            backgroundColor: 'var(--status-warning-bg)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--status-warning-bg)' }}
            >
              <svg
                className="h-5 w-5"
                style={{ color: 'var(--status-warning-text)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <span className="font-medium" style={{ color: 'var(--status-warning-text)' }}>
                {t('billing.checkoutCanceled')}
              </span>
              <p className="mt-0.5 text-sm text-foreground-muted">
                {t('billing.checkoutCanceledDesc')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current plan status */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('billing.currentPlan')}</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-foreground capitalize">{currentPlan}</span>
            {currentPlan !== 'free' && (
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor:
                    status === 'active' ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
                  color:
                    status === 'active'
                      ? 'var(--status-success-text)'
                      : 'var(--status-warning-text)',
                }}
              >
                {status}
              </span>
            )}
          </div>
          {currentPlan !== 'free' && currentPeriodEnd && (
            <span className="text-sm text-foreground-muted">
              Renews on {new Date(currentPeriodEnd).toLocaleDateString()}
            </span>
          )}
        </div>

        {hasStripeCustomer && currentPlan !== 'free' && (
          <button
            onClick={handleManageBilling}
            disabled={isLoading}
            className="mt-4 text-sm text-primary-light hover:text-primary-dark disabled:opacity-50 transition-colors"
          >
            {t('billing.manageBilling')}
          </button>
        )}
      </div>

      {/* Billing interval toggle */}
      {currentPlan === 'free' && (
        <div className="flex items-center justify-center">
          <div className="relative inline-flex items-center p-1 rounded-lg bg-surface border border-border">
            {/* Sliding background */}
            <div
              className={`
                absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-primary
                transition-transform duration-200 ease-out
                ${billingInterval === 'yearly' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}
              `}
            />
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`
                relative z-10 px-5 py-2 text-sm font-medium rounded-md
                transition-colors duration-200 cursor-pointer
                ${billingInterval === 'monthly' ? 'text-white' : 'text-foreground-muted hover:text-foreground'}
              `}
            >
              {t('billing.monthly')}
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`
                relative z-10 px-5 py-2 text-sm font-medium rounded-md
                transition-colors duration-200 cursor-pointer
                ${billingInterval === 'yearly' ? 'text-white' : 'text-foreground-muted hover:text-foreground'}
              `}
            >
              {t('billing.yearly')}
            </button>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => {
          const price = billingInterval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
          const period =
            plan.id === 'free'
              ? t('billing.forever')
              : billingInterval === 'yearly'
                ? t('billing.perYear')
                : t('billing.perMonth');

          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border-2 p-6 flex flex-col transition-all ${
                plan.popular ? 'border-primary bg-primary/5' : 'border-border bg-surface'
              } ${currentPlan === plan.id ? 'ring-2 ring-primary/20' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-6 inline-block rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
                  {t('billing.mostPopular')}
                </span>
              )}
              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">${price}</span>
                <span className="text-foreground-muted">{period}</span>
                {plan.id === 'pro' && billingInterval === 'yearly' && (
                  <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary-light">
                    {t('billing.save17')}
                  </span>
                )}
              </div>

              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-primary-light"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-foreground-secondary">{feature}</span>
                  </li>
                ))}
                {plan.limitations?.map((limitation) => (
                  <li key={limitation} className="flex items-start gap-3 text-sm">
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-foreground-faint"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span className="text-foreground-faint">{limitation}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {currentPlan === plan.id ? (
                  <button
                    disabled
                    className="w-full rounded-lg bg-surface-hover py-3 text-sm font-medium text-foreground-muted cursor-not-allowed"
                  >
                    {t('billing.currentPlanBadge')}
                  </button>
                ) : plan.id === 'pro' ? (
                  <button
                    onClick={handleUpgrade}
                    disabled={isLoading}
                    className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isLoading ? t('common.loading') : t('billing.upgradeToPro')}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full rounded-lg bg-surface-hover py-3 text-sm font-medium text-foreground-muted cursor-not-allowed"
                  >
                    {t('billing.currentPlanBadge')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
