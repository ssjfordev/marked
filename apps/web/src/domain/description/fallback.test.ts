import { describe, it, expect } from 'vitest';
import {
  trimAtSentenceBoundary,
  isValidDescription,
  getDescriptionFallback,
  extractTextFromHtml,
} from './fallback';

describe('trimAtSentenceBoundary', () => {
  it('returns text as-is if under max length', () => {
    const text = 'This is a short sentence.';
    expect(trimAtSentenceBoundary(text, 300)).toBe(text);
  });

  it('trims at sentence boundary', () => {
    const text =
      'First sentence. Second sentence. Third sentence that is very long and goes over the limit.';
    const result = trimAtSentenceBoundary(text, 35);
    expect(result).toBe('First sentence. Second sentence.');
  });

  it('handles Korean sentence endings', () => {
    const text = '첫 번째 문장입니다. 두 번째 문장입니다. 세 번째 문장이 매우 길게 이어집니다.';
    // Full text is 45 chars, so use maxLength=30 to trigger trimming at second sentence boundary (23 chars)
    const result = trimAtSentenceBoundary(text, 30);
    expect(result).toBe('첫 번째 문장입니다. 두 번째 문장입니다.');
  });

  it('falls back to word boundary if no sentence ending found', () => {
    const text = 'This is a very long text without any sentence endings that goes on and on';
    const result = trimAtSentenceBoundary(text, 40);
    expect(result).toContain('...');
    expect(result.length).toBeLessThanOrEqual(43); // 40 + '...'
  });

  it('normalizes whitespace', () => {
    const text = 'Text   with    multiple     spaces.';
    expect(trimAtSentenceBoundary(text, 300)).toBe('Text with multiple spaces.');
  });

  it('handles empty string', () => {
    expect(trimAtSentenceBoundary('')).toBe('');
  });
});

describe('isValidDescription', () => {
  it('returns false for null/undefined', () => {
    expect(isValidDescription(null)).toBe(false);
    expect(isValidDescription(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidDescription('')).toBe(false);
    expect(isValidDescription('   ')).toBe(false);
  });

  it('returns false for too short text', () => {
    expect(isValidDescription('Hi')).toBe(false);
    expect(isValidDescription('Short')).toBe(false);
  });

  it('returns false for placeholder text', () => {
    expect(isValidDescription('No description')).toBe(false);
    expect(isValidDescription('N/A')).toBe(false);
    expect(isValidDescription('undefined')).toBe(false);
  });

  it('returns true for valid descriptions', () => {
    expect(isValidDescription('This is a valid description text.')).toBe(true);
    expect(isValidDescription('Learn how to build great products.')).toBe(true);
  });
});

describe('getDescriptionFallback', () => {
  it('returns user description when provided', () => {
    const result = getDescriptionFallback({
      userDescription: 'My custom description',
      metaDescription: 'Meta description',
      pageText: 'Page text content',
    });
    expect(result).toBe('My custom description');
  });

  it('falls back to meta description when no user description', () => {
    const result = getDescriptionFallback({
      userDescription: null,
      metaDescription: 'This is the meta description from the page.',
      pageText: 'Page text content',
    });
    expect(result).toBe('This is the meta description from the page.');
  });

  it('falls back to page text when no meta description', () => {
    const result = getDescriptionFallback({
      userDescription: null,
      metaDescription: null,
      pageText: 'This is the page text that will be used as fallback.',
    });
    expect(result).toBe('This is the page text that will be used as fallback.');
  });

  it('skips invalid meta descriptions', () => {
    const result = getDescriptionFallback({
      userDescription: null,
      metaDescription: 'N/A',
      pageText: 'Valid page text content here.',
    });
    expect(result).toBe('Valid page text content here.');
  });

  it('trims long page text at sentence boundary', () => {
    const longText =
      'First sentence here. Second sentence here. Third sentence that is very long and detailed and continues beyond the limit we have set.';
    const result = getDescriptionFallback({
      pageText: longText,
      maxLength: 45,
    });
    expect(result).toBe('First sentence here. Second sentence here.');
  });

  it('returns empty string when nothing available', () => {
    const result = getDescriptionFallback({});
    expect(result).toBe('');
  });
});

describe('extractTextFromHtml', () => {
  it('removes HTML tags', () => {
    const html = '<p>Hello <strong>World</strong></p>';
    expect(extractTextFromHtml(html)).toBe('Hello World');
  });

  it('removes script tags and content', () => {
    const html = '<p>Text</p><script>alert("hi")</script><p>More</p>';
    expect(extractTextFromHtml(html)).toBe('Text More');
  });

  it('removes style tags and content', () => {
    const html = '<style>.foo{color:red}</style><p>Content</p>';
    expect(extractTextFromHtml(html)).toBe('Content');
  });

  it('decodes HTML entities', () => {
    const html = '&amp; &lt; &gt; &quot; &#39;';
    expect(extractTextFromHtml(html)).toBe('& < > " \'');
  });

  it('normalizes whitespace', () => {
    const html = '<p>Text</p>   <p>More</p>';
    expect(extractTextFromHtml(html)).toBe('Text More');
  });
});
