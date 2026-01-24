/**
 * URL Canonicalization Module
 *
 * Generates a stable url_key for deduplication by:
 * - Removing tracking parameters (utm_*, fbclid, etc.)
 * - Normalizing protocol to https
 * - Removing trailing slashes
 * - Lowercasing hostname
 * - Sorting query parameters
 *
 * Spec ref: clean_code_guidelines.md#4, tech_stack.md#5
 */

// Common tracking parameters to remove
const TRACKING_PARAMS = new Set([
  // UTM parameters
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_source_platform',
  'utm_creative_format',
  'utm_marketing_tactic',
  // Facebook
  'fbclid',
  'fb_action_ids',
  'fb_action_types',
  'fb_source',
  'fb_ref',
  // Google
  'gclid',
  'gclsrc',
  'dclid',
  // Microsoft/Bing
  'msclkid',
  // Twitter
  'twclid',
  // TikTok
  'ttclid',
  // Other common trackers
  'mc_cid',
  'mc_eid',
  'ref',
  '_ga',
  '_gl',
  'yclid',
  'wickedid',
  'igshid',
  // Email/Newsletter
  'email_source',
  'email_medium',
  'email_campaign',
  // Affiliate
  'affiliate_id',
  'aff_id',
  // Session/Analytics
  'session_id',
  'sid',
  '_hsenc',
  '_hsmi',
  'mkt_tok',
  'trk',
]);

export interface CanonicalizeResult {
  urlKey: string;
  originalUrl: string;
  domain: string;
  protocol: string;
  pathname: string;
}

/**
 * Canonicalize a URL to generate a stable key for deduplication
 */
export function canonicalizeUrl(rawUrl: string): CanonicalizeResult {
  // Trim whitespace
  const trimmedUrl = rawUrl.trim();

  // Parse URL (add protocol if missing)
  let urlToParse = trimmedUrl;
  if (!urlToParse.match(/^https?:\/\//i)) {
    urlToParse = 'https://' + urlToParse;
  }

  const url = new URL(urlToParse);

  // Normalize protocol to https (most sites support it)
  const protocol = 'https';

  // Lowercase hostname
  const hostname = url.hostname.toLowerCase();

  // Remove www. prefix for consistency (optional, but helps deduplication)
  const domain = hostname.replace(/^www\./, '');

  // Normalize pathname - remove trailing slash except for root
  let pathname = url.pathname;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // Filter and sort query parameters
  const params = new URLSearchParams();
  const sortedKeys = Array.from(url.searchParams.keys()).sort();

  for (const key of sortedKeys) {
    const lowerKey = key.toLowerCase();
    // Skip tracking parameters
    if (TRACKING_PARAMS.has(lowerKey)) {
      continue;
    }
    // Skip empty values
    const value = url.searchParams.get(key);
    if (value !== null && value !== '') {
      params.set(key, value);
    }
  }

  // Build canonical URL key
  const queryString = params.toString();
  const urlKey = `${protocol}://${domain}${pathname}${queryString ? '?' + queryString : ''}`;

  return {
    urlKey,
    originalUrl: trimmedUrl,
    domain,
    protocol,
    pathname,
  };
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const { domain } = canonicalizeUrl(url);
    return domain;
  } catch {
    return '';
  }
}

/**
 * Check if two URLs are canonically equivalent
 */
export function urlsAreEquivalent(url1: string, url2: string): boolean {
  try {
    const result1 = canonicalizeUrl(url1);
    const result2 = canonicalizeUrl(url2);
    return result1.urlKey === result2.urlKey;
  } catch {
    return false;
  }
}
