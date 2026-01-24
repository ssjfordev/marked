# Backend Resilience & Retention (Updated)

## 0) Context (Locked)
- Web/Backend: Vercel(Next.js)
- Background Jobs: 별도 Worker(Option 1, Fly.io)
- Screenshot: MVP 제외(OG + 기본 썸네일 랜덤)
- Error reporting: Sentry (MVP)

## 1) Backup
- Daily full backup
- 7–14 days retention
- 복구 리허설 최소 1회

## 2) Job Reliability (Import/Enrichment)
- Job table 기반 상태 관리
- 실패 원인 기록 + 관리자 재실행
- 도메인 throttling + block list

## 3) Failure Handling UX
- Import/Enrichment/AI 실패는 사용자에게 상태로 노출
- “조용히 실패” 금지
- 썸네일은 OG 우선, 실패 시 기본 썸네일로 graceful degrade

## 4) Churn Protection
- Cancel → read-only 유지
- Re-subscribe → instant restore

## 5) Shutdown Policy
- Full export
- 30-day notice
