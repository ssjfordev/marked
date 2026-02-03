/**
 * Metadata Fetcher
 *
 * Fetches page metadata (title, description, og:image, favicon)
 * with timeout and error handling.
 */

export interface PageMetadata {
  title: string | null;
  description: string | null;
  ogImage: string | null;
  favicon: string | null;
  pageText: string | null; // First ~500 chars of visible text
}

const FETCH_TIMEOUT = 10000; // 10 seconds
const MAX_PAGE_TEXT_LENGTH = 500;

// Common user agent to avoid blocks
const USER_AGENT = 'Mozilla/5.0 (compatible; Marked/1.0; +https://marked.app)';

/**
 * Fetch metadata from a URL
 */
export async function fetchMetadata(url: string): Promise<PageMetadata> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      // Not an HTML page, return minimal metadata
      return {
        title: null,
        description: null,
        ogImage: null,
        favicon: getGoogleFaviconUrl(url),
        pageText: null,
      };
    }

    const html = await response.text();
    return parseHtmlMetadata(html, url);
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw err;
  }
}

/**
 * Parse metadata from HTML string
 */
function parseHtmlMetadata(html: string, baseUrl: string): PageMetadata {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1]!.trim()) : null;

  // Extract meta description
  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const metaDescription = descMatch ? decodeHtmlEntities(descMatch[1]!.trim()) : null;

  // Extract og:image (with fallbacks)
  const ogImage = extractBestImage(html, baseUrl);

  // Extract favicon (try multiple strategies)
  const favicon = extractBestFavicon(html, baseUrl);

  // Extract page text for description fallback
  const pageText = extractVisibleText(html);

  return {
    title,
    description: metaDescription,
    ogImage,
    favicon,
    pageText,
  };
}

/**
 * Extract visible text from HTML for description fallback
 */
function extractVisibleText(html: string): string | null {
  // Remove script, style, and other non-visible content
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

  // Try to find main content area
  const mainMatch =
    text.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
    text.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
    text.match(/<div[^>]+class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

  if (mainMatch) {
    text = mainMatch[1]!;
  }

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode entities
  text = decodeHtmlEntities(text);

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  if (text.length === 0) {
    return null;
  }

  // Limit length
  if (text.length > MAX_PAGE_TEXT_LENGTH) {
    // Try to cut at sentence boundary
    const truncated = text.slice(0, MAX_PAGE_TEXT_LENGTH);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?'),
      truncated.lastIndexOf('。')
    );

    if (lastSentenceEnd > MAX_PAGE_TEXT_LENGTH * 0.5) {
      return text.slice(0, lastSentenceEnd + 1).trim();
    }

    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > MAX_PAGE_TEXT_LENGTH * 0.7) {
      return truncated.slice(0, lastSpace).trim() + '...';
    }

    return truncated.trim() + '...';
  }

  return text;
}

/**
 * Extract the best representative image from HTML
 * Priority: og:image > twitter:image > article image > first content image
 */
function extractBestImage(html: string, baseUrl: string): string | null {
  // 1. Try og:image
  const ogImageMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogImageMatch) {
    const resolved = resolveUrl(ogImageMatch[1]!.trim(), baseUrl);
    if (resolved) return resolved;
  }

  // 2. Try twitter:image
  const twitterImageMatch =
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  if (twitterImageMatch) {
    const resolved = resolveUrl(twitterImageMatch[1]!.trim(), baseUrl);
    if (resolved) return resolved;
  }

  // 3. Try to find hero/featured image in main content
  // Look for images in article, main, or with common hero class names
  const heroPatterns = [
    /<article[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i,
    /<main[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i,
    /<div[^>]+class=["'][^"']*(?:hero|featured|cover|thumbnail|post-image)[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i,
    /<img[^>]+class=["'][^"']*(?:hero|featured|cover|thumbnail|post-image)[^"']*["'][^>]+src=["']([^"']+)["']/i,
    /<figure[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i,
  ];

  for (const pattern of heroPatterns) {
    const match = html.match(pattern);
    if (match) {
      const resolved = resolveUrl(match[1]!.trim(), baseUrl);
      if (resolved && isValidImageUrl(resolved)) return resolved;
    }
  }

  // 4. Fallback: first reasonable image in the page
  // Skip tiny images (icons, tracking pixels, avatars)
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  for (const match of imgMatches) {
    const src = match[1]!.trim();

    // Skip common non-content images
    if (isLikelyNonContentImage(src)) continue;

    const resolved = resolveUrl(src, baseUrl);
    if (resolved && isValidImageUrl(resolved)) return resolved;
  }

  return null;
}

/**
 * Check if URL is likely a non-content image (icon, avatar, tracking pixel, etc.)
 */
function isLikelyNonContentImage(src: string): boolean {
  const lowerSrc = src.toLowerCase();
  const skipPatterns = [
    /avatar/i,
    /icon/i,
    /logo/i,
    /badge/i,
    /button/i,
    /sprite/i,
    /tracking/i,
    /pixel/i,
    /spacer/i,
    /1x1/i,
    /blank\./i,
    /\.gif$/i, // Often tracking pixels or simple animations
    /gravatar/i,
    /emoji/i,
    /data:image/i, // Base64 inline images (often small)
  ];

  return skipPatterns.some((pattern) => pattern.test(lowerSrc));
}

/**
 * Check if image URL looks valid for a content image
 */
function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Must be http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    // Should have image-like extension or be from known CDNs
    const path = parsed.pathname.toLowerCase();
    const hasImageExt = /\.(jpg|jpeg|png|webp|avif)$/i.test(path);
    const isFromCdn = /unsplash|imgur|cloudinary|cdn|media|images?|static|assets/i.test(url);
    return hasImageExt || isFromCdn || !path.includes('.'); // Allow extensionless CDN URLs
  } catch {
    return false;
  }
}

/**
 * Resolve relative URL to absolute
 */
function resolveUrl(url: string, baseUrl: string): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return null;
  }
}

/**
 * Extract the best favicon from HTML with multiple fallback strategies
 *
 * Priority:
 * 1. <link rel="icon"> with largest size (SVG > PNG > ICO)
 * 2. <link rel="apple-touch-icon"> (usually 180x180 high quality)
 * 3. <link rel="shortcut icon">
 * 4. /favicon.ico (HEAD check)
 * 5. Google Favicon API (final fallback, always works)
 */
function extractBestFavicon(html: string, baseUrl: string): string {
  const candidates: { href: string; priority: number }[] = [];

  // Match all <link> tags with icon-related rel values
  const linkTagRegex = /<link\s[^>]*>/gi;
  let linkMatch;

  while ((linkMatch = linkTagRegex.exec(html)) !== null) {
    const tag = linkMatch[0];

    const relMatch = tag.match(/rel=["']([^"']+)["']/i);
    if (!relMatch) continue;
    const rel = relMatch[1]!.toLowerCase();

    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const href = hrefMatch[1]!.trim();
    if (!href || href === '#') continue;

    const sizesMatch = tag.match(/sizes=["']([^"']+)["']/i);
    const typeMatch = tag.match(/type=["']([^"']+)["']/i);

    if (rel.includes('apple-touch-icon')) {
      // apple-touch-icon: high quality, usually 180x180
      candidates.push({ href, priority: 80 });
    } else if (rel.includes('icon')) {
      let priority = 50;

      // Prefer SVG
      if (typeMatch && typeMatch[1]!.includes('svg')) {
        priority = 90;
      } else if (href.endsWith('.svg')) {
        priority = 90;
      }

      // Prefer larger sizes
      if (sizesMatch) {
        const size = parseInt(sizesMatch[1]!.split('x')[0]!, 10);
        if (!isNaN(size)) {
          if (size >= 128) priority = Math.max(priority, 70);
          else if (size >= 32) priority = Math.max(priority, 60);
        }
      }

      candidates.push({ href, priority });
    }
  }

  // Sort by priority descending, pick best
  candidates.sort((a, b) => b.priority - a.priority);

  if (candidates.length > 0) {
    const best = candidates[0]!.href;
    // Make absolute
    if (best.startsWith('http')) return best;
    try {
      return new URL(best, baseUrl).href;
    } catch {
      // fall through to fallbacks
    }
  }

  // Fallback: Google Favicon API (reliable, always returns something)
  return getGoogleFaviconUrl(baseUrl);
}

/**
 * Google Favicon API - reliable fallback that works for most domains
 */
function getGoogleFaviconUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=${url}&sz=32`;
  }
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}
