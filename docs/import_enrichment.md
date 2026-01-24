# Import & Enrichment (Locked)

## 1) Import
- Chrome bookmarks HTML (MVP)
- Async processing (Job table + Worker)

## 2) Enrichment Scope (Locked)
- Metadata only:
  - title
  - description (meta/og)
  - og:image
  - favicon
  - canonical URL (if discovered)
- 본문全文 저장 금지

## 3) Description Fallback (Locked)
- 메타 description이 없거나 너무 빈약하면:
  - 페이지 초반부 텍스트 **약 300자**
  - 가능하면 문장 단위로 정제하여 저장
- 저장 대상은 “요약이 아니라 원문 일부(발췌)”이며, AI 요약과 분리

## 4) Thumbnail Strategy (Locked)
- Primary: og:image URL 저장
- Fallback:
  - Marked 기본 썸네일 세트(랜덤) 적용
- Screenshot 캡쳐는 MVP에서 제외 (Phase 1 feature-flag 후보)

## 5) Retry Policy (Locked)
- Enrichment(메타/텍스트)는 제한적 재시도 가능(예: 1~2회, backoff)
- 스크린샷은 MVP에서 제외

## 6) Domain Throttling & Blocking
- robots/captcha/403 반복 도메인은 block list에 등록
- 도메인별 rate limit 적용
