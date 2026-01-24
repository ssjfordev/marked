import { describe, it, expect } from 'vitest';
import { canonicalizeUrl, extractDomain, urlsAreEquivalent } from './canonicalize';

describe('canonicalizeUrl', () => {
  describe('tracking parameter removal', () => {
    it('removes utm parameters', () => {
      const result = canonicalizeUrl(
        'https://example.com/page?utm_source=google&utm_medium=cpc&id=123'
      );
      expect(result.urlKey).toBe('https://example.com/page?id=123');
    });

    it('removes fbclid', () => {
      const result = canonicalizeUrl('https://example.com/page?fbclid=abc123&foo=bar');
      expect(result.urlKey).toBe('https://example.com/page?foo=bar');
    });

    it('removes gclid', () => {
      const result = canonicalizeUrl('https://example.com?gclid=xyz&product=test');
      expect(result.urlKey).toBe('https://example.com/?product=test');
    });

    it('removes multiple tracking params at once', () => {
      const result = canonicalizeUrl(
        'https://example.com?utm_source=x&fbclid=y&gclid=z&real=value'
      );
      expect(result.urlKey).toBe('https://example.com/?real=value');
    });
  });

  describe('protocol normalization', () => {
    it('converts http to https', () => {
      const result = canonicalizeUrl('http://example.com/page');
      expect(result.urlKey).toBe('https://example.com/page');
    });

    it('keeps https as is', () => {
      const result = canonicalizeUrl('https://example.com/page');
      expect(result.urlKey).toBe('https://example.com/page');
    });

    it('adds https if protocol is missing', () => {
      const result = canonicalizeUrl('example.com/page');
      expect(result.urlKey).toBe('https://example.com/page');
    });
  });

  describe('trailing slash normalization', () => {
    it('removes trailing slash from paths', () => {
      const result = canonicalizeUrl('https://example.com/page/');
      expect(result.urlKey).toBe('https://example.com/page');
    });

    it('keeps root path as is', () => {
      const result = canonicalizeUrl('https://example.com/');
      expect(result.urlKey).toBe('https://example.com/');
    });

    it('removes trailing slash from nested paths', () => {
      const result = canonicalizeUrl('https://example.com/a/b/c/');
      expect(result.urlKey).toBe('https://example.com/a/b/c');
    });
  });

  describe('hostname normalization', () => {
    it('lowercases hostname', () => {
      const result = canonicalizeUrl('https://EXAMPLE.COM/Page');
      expect(result.urlKey).toBe('https://example.com/Page');
    });

    it('removes www prefix', () => {
      const result = canonicalizeUrl('https://www.example.com/page');
      expect(result.urlKey).toBe('https://example.com/page');
    });

    it('handles WWW in uppercase', () => {
      const result = canonicalizeUrl('https://WWW.EXAMPLE.COM/page');
      expect(result.urlKey).toBe('https://example.com/page');
    });
  });

  describe('query parameter sorting', () => {
    it('sorts query parameters alphabetically', () => {
      const result = canonicalizeUrl('https://example.com?z=1&a=2&m=3');
      expect(result.urlKey).toBe('https://example.com/?a=2&m=3&z=1');
    });

    it('removes empty query parameters', () => {
      const result = canonicalizeUrl('https://example.com?a=1&b=&c=3');
      expect(result.urlKey).toBe('https://example.com/?a=1&c=3');
    });
  });

  describe('domain extraction', () => {
    it('extracts domain correctly', () => {
      const result = canonicalizeUrl('https://www.example.com/page?query=1');
      expect(result.domain).toBe('example.com');
    });

    it('handles subdomains', () => {
      const result = canonicalizeUrl('https://blog.example.com/post');
      expect(result.domain).toBe('blog.example.com');
    });
  });

  describe('url equivalence', () => {
    it('same URL with different tracking params are equivalent', () => {
      const url1 = 'https://example.com/page?id=1&utm_source=google';
      const url2 = 'https://example.com/page?id=1&fbclid=abc';
      expect(urlsAreEquivalent(url1, url2)).toBe(true);
    });

    it('same URL with different protocols are equivalent', () => {
      const url1 = 'http://example.com/page';
      const url2 = 'https://example.com/page';
      expect(urlsAreEquivalent(url1, url2)).toBe(true);
    });

    it('same URL with/without www are equivalent', () => {
      const url1 = 'https://www.example.com/page';
      const url2 = 'https://example.com/page';
      expect(urlsAreEquivalent(url1, url2)).toBe(true);
    });

    it('different URLs are not equivalent', () => {
      const url1 = 'https://example.com/page1';
      const url2 = 'https://example.com/page2';
      expect(urlsAreEquivalent(url1, url2)).toBe(false);
    });
  });
});

describe('extractDomain', () => {
  it('extracts domain from full URL', () => {
    expect(extractDomain('https://www.example.com/page')).toBe('example.com');
  });

  it('handles invalid URLs gracefully', () => {
    expect(extractDomain('')).toBe('');
  });
});
