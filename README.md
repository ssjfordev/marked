# Marked — Product Specification (Final)

## Product Identity
- One-liner: **링크를 저장하는 게 아니라, 지식으로 정리합니다.**
- Sub: 웹에서 찾은 정보를 **‘내 자산 페이지’**로 전환하는 링크 워크스페이스
- Terminology:
  - Highlight → **Mark**
  - Detail page → **Asset Page**

## Target User (Locked)
- 직군 기준 분류 ❌
- Primary:
  - 링크를 많이 저장하고
  - 나중에 다시 찾고, 설명하고, 재사용해야 하는 사람

\1
## Tech Stack (Locked)
- Next.js (Fullstack)
- Supabase Postgres (DB)
- Supabase Auth + Google OAuth (Auth)
- Stripe Subscription (Billing)
- GA4 (Analytics)
- MVP: Web + Chrome Extension only

## Pricing Summary (Locked)
- Free:
  - 링크 / 폴더 / Mark / Import 무제한
  - Exact Search
  - Asset Page ❌
  - Memo ❌
  - NL Search ❌
- Pro ($4 target):
  - Asset Page
  - Memo
  - Natural Language Search (Korean)
- AI Pro:
  - AI 분석 + 크레딧

\1- [Task Breakdown](./docs/task_breakdown.md)
- [Claude Dev Agent Prompt](./docs/agent_prompt_claude.md)
- [Clean Code Standards](./docs/clean_code_guidelines.md)
- [Tech Stack](./docs/tech_stack.md)
- [Search Conversion UX](./docs/search_conversion_ux.md)
- [Asset Page UX](./docs/asset_page_conversion_ux.md)
- [Tag Policy](./docs/tag_policy.md)
- [Migration UX](./docs/migration_ux.md)
- [Backend Resilience](./docs/backend_resilience.md)
- [Analytics](./docs/analytics.md)
- [Import & Enrichment](./docs/import_enrichment.md)
- [Chrome Extension](./docs/chrome_extension.md)
- [Worker Job Processing](./docs/worker_job_processing.md)
- [Data Model](./docs/data_model.md)
