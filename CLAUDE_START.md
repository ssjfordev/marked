# CLAUDE_START — Marked MVP

This repository contains the finalized specification for Marked MVP.
Your role is to implement the product exactly as specified.

## Anchor (must read first)
- README.md
- docs/tech_stack.md

## Locked (no reinterpretation, no alternatives)
- docs/worker_job_processing.md
- docs/search_conversion_ux.md
- docs/asset_page_conversion_ux.md
- docs/tag_policy.md
- docs/clean_code_guidelines.md

## Reference-only
- docs/import_enrichment.md
- docs/backend_resilience.md
- docs/analytics.md
- docs/migration_ux.md
- docs/data_model.md
- docs/task_breakdown.md

## Explicit Prohibitions
- No folder automation or AI folder suggestions
- No screenshot capture (MVP)
- No full content storage or indexing
- No auto-apply tags without user confirmation
- No mobile app

## MVP Scope
- Web + Chrome Extension only
- Next.js on Vercel
- Supabase Postgres/Auth (Google only)
- Stripe subscriptions
- Worker on Fly.io with DB job table + SKIP LOCKED model
- Search: Exact free (pg_trgm) + NL paid conversion UX
- Thumbnail: og:image OR default random thumbnails
- Description fallback: first ~300 chars, sentence-like trimming

## Output Expectations
- Work in PR-sized increments
- Every PR must reference spec documents
- If ambiguity exists, list under Open Questions (do not guess)
