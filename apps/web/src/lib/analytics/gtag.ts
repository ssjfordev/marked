/**
 * Google Analytics 4 (GA4) integration
 *
 * Core events per analytics.md:
 * - search_exact
 * - search_nl_attempt
 * - search_nl_blocked
 * - asset_page_open_paid
 * - asset_page_blocked_free
 * - upgrade_clicked
 * - subscription_started
 * - subscription_canceled
 */

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Initialize GA
export const pageview = (url: string) => {
  if (!GA_TRACKING_ID || typeof window === 'undefined') return;
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

// Track custom events
export const event = (
  action: string,
  params?: Record<string, string | number | boolean>
) => {
  if (!GA_TRACKING_ID || typeof window === 'undefined') return;
  window.gtag('event', action, params);
};

// Core events
export const trackSearchExact = (query: string, resultCount: number) => {
  event('search_exact', {
    query_length: query.length,
    result_count: resultCount,
  });
};

export const trackSearchNLAttempt = (query: string) => {
  event('search_nl_attempt', {
    query_length: query.length,
  });
};

export const trackSearchNLBlocked = () => {
  event('search_nl_blocked');
};

export const trackAssetPageOpenPaid = (canonicalId: string) => {
  event('asset_page_open_paid', {
    canonical_id: canonicalId,
  });
};

export const trackAssetPageBlockedFree = (canonicalId: string) => {
  event('asset_page_blocked_free', {
    canonical_id: canonicalId,
  });
};

export const trackUpgradeClicked = (source: string) => {
  event('upgrade_clicked', {
    source,
  });
};

export const trackSubscriptionStarted = (plan: string) => {
  event('subscription_started', {
    plan,
  });
};

export const trackSubscriptionCanceled = () => {
  event('subscription_canceled');
};

// Onboarding events
export const trackOnboardingStep = (step: string) => {
  event('onboarding_step', {
    step,
  });
};

export const trackImportCompleted = (linkCount: number, folderCount: number) => {
  event('import_completed', {
    link_count: linkCount,
    folder_count: folderCount,
  });
};
