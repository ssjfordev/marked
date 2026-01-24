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
        favicon: getFaviconUrl(url),
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

  // Extract og:image
  const ogImageMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  let ogImage = ogImageMatch ? ogImageMatch[1]!.trim() : null;

  // Make og:image absolute
  if (ogImage && !ogImage.startsWith('http')) {
    try {
      ogImage = new URL(ogImage, baseUrl).href;
    } catch {
      ogImage = null;
    }
  }

  // Extract favicon
  const faviconMatch =
    html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i) ||
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i);
  let favicon = faviconMatch ? faviconMatch[1]!.trim() : getFaviconUrl(baseUrl);

  // Make favicon absolute
  if (favicon && !favicon.startsWith('http')) {
    try {
      favicon = new URL(favicon, baseUrl).href;
    } catch {
      favicon = getFaviconUrl(baseUrl);
    }
  }

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
 * Get default favicon URL for a domain
 */
function getFaviconUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}/favicon.ico`;
  } catch {
    return null;
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
