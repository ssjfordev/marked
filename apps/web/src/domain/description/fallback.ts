/**
 * Description Fallback Module
 *
 * Priority (per asset_page_conversion_ux.md):
 * 1. User-written description
 * 2. Meta description
 * 3. Page intro text (first 300~500 chars, sentence boundary)
 *
 * Spec ref: asset_page_conversion_ux.md, tech_stack.md#5.2
 */

const DEFAULT_MAX_LENGTH = 300;
const ABSOLUTE_MAX_LENGTH = 500;

// Sentence-ending punctuation marks (including Korean)
const SENTENCE_ENDINGS = /[.!?。！？\n]/;

/**
 * Trim text at a sentence boundary, respecting max length
 */
export function trimAtSentenceBoundary(
  text: string,
  maxLength: number = DEFAULT_MAX_LENGTH
): string {
  if (!text) return '';

  // Clean up the text first
  const cleaned = text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Find the last sentence boundary before maxLength
  let lastBoundary = -1;
  for (let i = 0; i < maxLength; i++) {
    if (SENTENCE_ENDINGS.test(cleaned[i]!)) {
      lastBoundary = i + 1;
    }
  }

  // If we found a sentence boundary after at least 30% of maxLength, use it (no ellipsis needed)
  if (lastBoundary > Math.max(20, maxLength * 0.3)) {
    return cleaned.slice(0, lastBoundary).trim();
  }

  // Otherwise, try to break at a word boundary and add ellipsis
  const sliced = cleaned.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.5) {
    return sliced.slice(0, lastSpace).trim() + '...';
  }

  // Fallback: just cut at maxLength
  return sliced.trim() + '...';
}

/**
 * Check if a description is valid (not empty, not too short, not placeholder text)
 */
export function isValidDescription(description: string | null | undefined): boolean {
  if (!description) return false;

  const trimmed = description.trim();

  // Too short
  if (trimmed.length < 10) return false;

  // Common placeholder patterns
  const placeholderPatterns = [
    /^(no description|description not available|n\/a)$/i,
    /^(untitled|undefined|null)$/i,
    /^(test|sample|example)$/i,
    /^\.+$/, // Just dots
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(trimmed)) return false;
  }

  return true;
}

export interface DescriptionFallbackOptions {
  userDescription?: string | null;
  metaDescription?: string | null;
  pageText?: string | null;
  maxLength?: number;
}

/**
 * Get the best description following the priority order:
 * 1. User-written description (always preferred)
 * 2. Meta description (if valid)
 * 3. Page intro text (trimmed at sentence boundary)
 */
export function getDescriptionFallback(options: DescriptionFallbackOptions): string {
  const { userDescription, metaDescription, pageText, maxLength = DEFAULT_MAX_LENGTH } = options;

  // 1. User description always wins
  if (isValidDescription(userDescription)) {
    return userDescription!.trim();
  }

  // 2. Meta description
  if (isValidDescription(metaDescription)) {
    const trimmed = metaDescription!.trim();
    // Meta descriptions are usually already well-formed
    if (trimmed.length <= ABSOLUTE_MAX_LENGTH) {
      return trimmed;
    }
    return trimAtSentenceBoundary(trimmed, maxLength);
  }

  // 3. Page text fallback
  if (pageText && pageText.trim().length > 0) {
    return trimAtSentenceBoundary(pageText, maxLength);
  }

  return '';
}

/**
 * Extract clean text from HTML for description fallback
 * Note: This is a simple implementation. For production, use a proper HTML parser.
 */
export function extractTextFromHtml(html: string): string {
  // Remove script and style tags with their content
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'");

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}
