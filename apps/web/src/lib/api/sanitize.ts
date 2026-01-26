/**
 * Text Sanitization Utilities
 *
 * Security: Strip HTML/scripts, normalize whitespace
 * All user text input should be sanitized before storage.
 *
 * ============================================
 * TEXT INPUT RULES (적용 기준)
 * ============================================
 *
 * | Field Type       | Max Length | Notes                    |
 * |------------------|------------|--------------------------|
 * | name (short)     | 100        | 폴더명, 태그명 등         |
 * | title            | 200        | 링크 제목 등              |
 * | description      | 500        | 폴더/링크 설명            |
 * | long text        | 2000       | 메모, 노트 등             |
 * | url              | 2048       | URL 표준 길이             |
 * | icon/emoji       | 32         | 이모지 (서로게이트 페어)   |
 *
 * 모든 텍스트 입력은:
 * 1. sanitizeText() 적용 (HTML strip, trim)
 * 2. 위 기준에 맞는 max length 적용
 * 3. Zod schema에서 검증
 */

/**
 * Strip HTML tags and normalize whitespace
 */
export function sanitizeText(input: string): string {
  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove potential script injections
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    // Normalize whitespace (collapse multiple spaces, trim)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitize and truncate text
 */
export function sanitizeAndTruncate(input: string, maxLength: number): string {
  const sanitized = sanitizeText(input);
  return sanitized.slice(0, maxLength);
}

/**
 * Zod transformer for sanitized strings
 */
export function sanitizedString() {
  return {
    transform: (val: string) => sanitizeText(val),
  };
}

// Standard max lengths (re-exported for consistency)
export const TEXT_LIMITS = {
  NAME: 100,        // 폴더명, 태그명
  TITLE: 200,       // 링크 제목
  DESCRIPTION: 500, // 설명
  LONG_TEXT: 2000,  // 메모, 노트
  URL: 2048,        // URL
  ICON: 32,         // 이모지
} as const;
