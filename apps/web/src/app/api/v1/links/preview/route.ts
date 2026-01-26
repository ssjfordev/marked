/**
 * Link Preview API - Analyze URL and return metadata
 *
 * POST /api/v1/links/preview
 *
 * Fetches metadata from a URL for preview before saving.
 */

import { requireAuth, success, handleError, ValidationError } from '@/lib/api';
import { canonicalizeUrl } from '@/domain/url';
import { fetchMetadata } from '@/lib/enrichment/metadata-fetcher';

const URL_PATTERN = /^https?:\/\//i;

export async function POST(request: Request) {
  try {
    await requireAuth();

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      throw new ValidationError('URL is required');
    }

    // Basic URL validation
    const trimmedUrl = url.trim();
    if (!URL_PATTERN.test(trimmedUrl)) {
      throw new ValidationError('Invalid URL format. URL must start with http:// or https://');
    }

    // Validate URL can be parsed
    try {
      new URL(trimmedUrl);
    } catch {
      throw new ValidationError('Invalid URL format');
    }

    // Canonicalize URL
    const { urlKey, domain } = canonicalizeUrl(trimmedUrl);

    // Fetch metadata
    let metadata: {
      title: string | null;
      description: string | null;
      ogImage: string | null;
      favicon: string | null;
    } | null = null;

    try {
      const fetched = await fetchMetadata(trimmedUrl);
      metadata = {
        title: fetched.title,
        description: fetched.description,
        ogImage: fetched.ogImage,
        favicon: fetched.favicon,
      };
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      // Continue without metadata - user can still add the link
    }

    return success({
      url: trimmedUrl,
      urlKey,
      domain,
      title: metadata?.title || null,
      description: metadata?.description || null,
      ogImage: metadata?.ogImage || null,
      favicon: metadata?.favicon || null,
    });
  } catch (err) {
    return handleError(err);
  }
}
