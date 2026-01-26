/**
 * Entitlement Checker Module
 *
 * Determines feature access based on subscription plan.
 * Used for gating premium features like Asset Page, Memos, and NL Search.
 *
 * Spec ref: tech_stack.md#4.1 (Stripe subscription integration)
 */

export type SubscriptionPlan = 'free' | 'pro' | 'lifetime';
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'unpaid';

export interface UserEntitlement {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
}

/**
 * Check if user can access Asset Page (full page view with marks/memos)
 * Available to: pro, lifetime (active subscriptions only)
 */
export function canAccessAssetPage(entitlement: UserEntitlement | null): boolean {
  if (!entitlement) return false;
  if (!isActiveSubscription(entitlement.status)) return false;
  return entitlement.plan === 'pro' || entitlement.plan === 'lifetime';
}

/**
 * Check if user can access Memos feature
 * Available to: pro, lifetime (active subscriptions only)
 */
export function canAccessMemo(entitlement: UserEntitlement | null): boolean {
  if (!entitlement) return false;
  if (!isActiveSubscription(entitlement.status)) return false;
  return entitlement.plan === 'pro' || entitlement.plan === 'lifetime';
}

/**
 * Check if user can access Natural Language Search
 * Available to: pro, lifetime (active subscriptions only)
 */
export function canAccessNLSearch(entitlement: UserEntitlement | null): boolean {
  if (!entitlement) return false;
  if (!isActiveSubscription(entitlement.status)) return false;
  return entitlement.plan === 'pro' || entitlement.plan === 'lifetime';
}

/**
 * Check if user can create marks (highlights)
 * Available to: all plans (free tier feature)
 */
export function canCreateMarks(entitlement: UserEntitlement | null): boolean {
  // Marks are a free tier feature
  if (!entitlement) return true; // Allow for unauthenticated preview scenarios
  return true;
}

/**
 * Check if user can use tag management
 * Available to: all plans (free tier feature)
 */
export function canUseTags(_entitlement: UserEntitlement | null): boolean {
  // Tags are a free tier feature
  return true;
}

/**
 * Check if subscription status is considered active
 */
export function isActiveSubscription(status: SubscriptionStatus): boolean {
  // 'trialing' and 'active' are fully active
  // 'past_due' still grants access (grace period)
  return status === 'active' || status === 'trialing' || status === 'past_due';
}

/**
 * Get all features available for a given entitlement
 */
export function getAvailableFeatures(entitlement: UserEntitlement | null): {
  assetPage: boolean;
  memos: boolean;
  nlSearch: boolean;
  marks: boolean;
  tags: boolean;
} {
  return {
    assetPage: canAccessAssetPage(entitlement),
    memos: canAccessMemo(entitlement),
    nlSearch: canAccessNLSearch(entitlement),
    marks: canCreateMarks(entitlement),
    tags: canUseTags(entitlement),
  };
}
