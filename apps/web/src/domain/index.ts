// URL canonicalization
export { canonicalizeUrl, extractDomain, urlsAreEquivalent } from './url';
export type { CanonicalizeResult } from './url';

// Description fallback
export {
  trimAtSentenceBoundary,
  isValidDescription,
  getDescriptionFallback,
  extractTextFromHtml,
} from './description';
export type { DescriptionFallbackOptions } from './description';

// Entitlement checking
export {
  canAccessAssetPage,
  canAccessMemo,
  canAccessNLSearch,
  canCreateMarks,
  canUseTags,
  isActiveSubscription,
  getAvailableFeatures,
} from './entitlement';
export type { UserEntitlement, SubscriptionPlan, SubscriptionStatus } from './entitlement';
