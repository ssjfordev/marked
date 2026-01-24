# Tech Stack (Locked)

## 0) MVP Scope (Locked)
- MVP: **Web + Chrome Extension**
- Mobile app: Phase 1 이후

## 1) Deployment (Locked)
- Web/Backend: **Vercel (Next.js Fullstack)**
- Background Worker: **Fly.io** (separate service; Docker deploy)
  - 이유:
    - 장시간 작업(Import/Enrichment/스크린샷) 안정적으로 수행
    - Playwright 기반 headless browser 실행에 유리(Docker/리눅스 의존성)
    - 필요 시 수평 확장/리소스 조정 용이
  - 운영 원칙:
    - Worker는 Vercel과 완전히 분리
    - Supabase DB(Job table)를 source of truth로 사용

## 2) Stack (Locked)
- Web/Backend: **Next.js (Fullstack)**
  - App Router 권장
  - Route Handlers 사용
- DB: **Supabase Postgres**
- Auth: **Supabase Auth + Google OAuth**
- Billing: **Stripe Subscription**
- Analytics: **GA4 (필수)**
- Error Reporting: **Sentry (MVP 포함)**

## 3) Background Jobs (Locked: Option 1)
### 3.1 Job Table + Worker Model
- Supabase DB에 Job 테이블(ImportJob/EnrichmentJob)을 저장하고,
- 별도 Worker가 polling/locking 하여 처리한다.
- 필수 기능:
  - 상태(state) 전이
  - 실패 기록
  - 재시도 정책(Enrichment 일부만; 스크린샷은 재시도 없음)
  - dead-letter(최소 실패 사유 보관)

## 4) Search Implementation (Recommended & Locked for MVP)
> 목표: **Exact Search(Free)** 를 “한국어에서도 무난하게” 빠르고 단순하게 제공한다.

### 4.1 추천안: Postgres `pg_trgm` 기반 (MVP)
- 이유:
  - 한국어 FTS는 토큰화 품질/세팅 비용이 큼
  - Exact Search는 “키워드/부분 문자열” 탐색이 핵심
- 방식:
  - `title`, `url`, `domain`, `tags_text`, `description_fallback` 컬럼에 대해
  - `ILIKE` + `pg_trgm` 인덱스(GIN)로 성능 확보
  - 결과 정렬은 `similarity()` + 최신 저장일 가중치

### 4.2 NL Search(Paid)
- NL 파서(시간 표현/의도 추출)가 만든 조건을
  - 날짜/폴더/태그 필터
  - 키워드(Exact) 검색으로 변환하여 실행

## 5) Thumbnail & Description Storage (Locked)
### 5.1 Thumbnail
- Primary: `og:image` URL 저장
- Fallback: **Marked 기본 썸네일 세트(예쁜 이미지 몇 개) 랜덤 적용**
- Screenshot 캡쳐는 **MVP에서 제외(Won’t)** (Phase 1 feature-flag 후보)

### 5.2 Description fallback
- 메타 description이 없거나 부적절할 때:
  - 페이지 초반부 텍스트 **약 300자**
  - 문장 단위로 정제(가능하면 문장 경계 기준으로 컷)

## 6) Security / Privacy (Locked)
- 본문全文 저장/인덱싱 금지
- 유료 기능 접근은 서버에서 최종 검증
- extension에 장기 토큰 보관 최소화(짧은 토큰 선호)
