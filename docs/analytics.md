# Analytics & Observability Plan (MVP)

## 1) Tools (Locked)
- Product analytics: **GA4 (required)**
- Error reporting: **Sentry (required in MVP)**
- Optional later: PostHog (events/funnels)

## 2) Core Events (GA4)
- search_exact
- search_nl_attempt
- search_nl_blocked
- asset_page_open_paid
- asset_page_blocked_free
- upgrade_clicked
- subscription_started
- subscription_canceled

## 3) Privacy
- No full content logging
- Behavior only (counts, ids, timestamps)
- Never log page intro text or marks content as analytics payload

## 4) Sentry Guidelines
- Capture:
  - import/enrichment job failures (server-side)
  - extension API errors
  - search errors/timeouts
- Scrub PII/URL query params as needed
