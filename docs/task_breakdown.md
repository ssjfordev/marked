# Task Breakdown (MVP → Launch)
> 목적: 이 문서만으로 개발 작업을 이슈/스프린트 단위로 쪼개고, 순서·의존성을 고정한다.

## 0) 원칙 (Locked)
- Stack: Next.js(fullstack, Vercel) + Supabase(Postgres/Auth) + Stripe + GA4 + Sentry + Worker(Option1)
- MVP scope: Web + Chrome Extension only

- 폴더 구조는 사용자 수동 100% (AI 개입 금지)
- Free: 링크/폴더/Mark/Import 무제한 + Exact Search
- Paid: NL Search + Asset Page + Memo (+ AI Pro는 별도)
- Enrichment: 메타 + description fallback(페이지 초반 텍스트), 본문全文 저장 금지
- Inbox 강제 금지 (Extension 기본: last used folder)

## 1) Milestone 정의
- M0: Skeleton + Auth + DB + 기본 CRUD
- M1: Import(Chrome) + Enrichment + Link List
- M2: Mark(Extension) + Light Viewer(Free) + Asset Page(Paid) + Memo
- M3: Search(Exact Free) + NL Search(Paid 전환 UX)
- M4: Billing(Stripe) + Entitlement + Upgrade UX
- M5: Migration/Onboarding + Analytics(GA4) + Ops/Backup
- M6: QA/Hardening + Store submission + Launch

---

## 2) Epics & Tasks

### Epic A — Project Setup & Foundations (M0)
**A1. Repo/Tooling**
- [ ] Monorepo 여부 결정 (단일 repo 권장)
- [ ] Formatting: Prettier
- [ ] Lint: ESLint + TypeScript strict
- [ ] Git hooks: lint-staged + commitlint(optional)
- [ ] CI: test/lint/build

**A2. Backend Skeleton**
- [ ] API framework 선정 (TBD)
- [ ] DB schema 마이그레이션 시스템 설정
- [ ] Auth middleware(세션/쿠키)
- [ ] Rate limit / basic security headers

**A3. Frontend Skeleton**
- [ ] Web routing + layout shell
- [ ] Design system 최소(버튼/모달/토스트/폼)

**A4. Core Entities (DB + API)**
- [ ] User
- [ ] Folder(tree)
- [ ] LinkCanonical(url_key unique)
- [ ] LinkInstance(folder placement)
- [ ] Tag
- [ ] Mark
- [ ] Memo(Paid)
- [ ] Enrichment
- [ ] ImportJob
- [ ] Subscription/Entitlement

**Acceptance**
- 로그인 후 폴더 CRUD, 링크 인스턴스 CRUD가 최소 동작

---

### Epic B — Import & Enrichment (M1)
**B1. Import UI**
- [ ] Chrome bookmarks HTML 업로드
- [ ] Import job 생성/상태 조회
- [ ] 진행률 UI (total/processed/failed)

**B2. Import Processor**
- [ ] HTML 파서
- [ ] 폴더 구조 보존
- [ ] 중복 허용 (LinkInstance 분리)
- [ ] url_key canonicalization 적용

**B3. Enrichment Worker**
- [ ] 메타(title/description/og:image/favicon) 수집
- [ ] description fallback: 페이지 초반 텍스트 300~500자 추출(Readable text best-effort)
- [ ] 도메인 throttling + retry + dead letter
- [ ] 실패 기록/재시도

**Acceptance**
- 1,000개 규모 import에서 UI가 멈추지 않고, enrichment가 비동기로 진행됨

---

### Epic C — Web List & Navigation (M1~M2)
**C1. Folder Tree UI**
- [ ] 트리 렌더 + CRUD
- [ ] drag & drop reorder/move

**C2. Link List UI**
- [ ] 카드/리스트 전환
- [ ] 썸네일, URL, 제목, 설명 규칙 적용
- [ ] 외부 이동 아이콘 vs 내부 클릭(뷰어/asset page)
- [ ] 태그 chips + quick edit

**Acceptance**
- 폴더 선택→링크 목록이 1초 내 로드(캐시 포함)

---

### Epic D — Mark Capture (Extension) (M2)
**D1. Extension Auth**
- [ ] Web 로그인 세션 기반으로 extension token handoff
- [ ] 로그인/로그아웃 상태 UX

**D2. Save Link (Extension)**
- [ ] 현재 URL 저장/수정/삭제
- [ ] 폴더 선택 정책: last used folder + 사용자 수동 선택 UX
- [ ] 태그 입력/수정/삭제
- [ ] (Paid) 태그 추천 표시(적용은 사용자 확인)

**D3. Mark Capture**
- [ ] 이미 저장된 링크에만 활성화
- [ ] 텍스트 선택 → 우클릭 메뉴 “Save Mark”
- [ ] 색상 + optional note
- [ ] 저장 후 토스트 + “Open in Marked”

**Acceptance**
- 일반 사이트 10곳에서 Mark 저장이 안정적으로 동작

---

### Epic E — Light Viewer(Free) & Asset Page(Paid) (M2)
**E1. Light Viewer (Free)**
- [ ] Header 축소(Title/URL/Description)
- [ ] Marks read-only list
- [ ] Upgrade CTA (Asset Page 열기)

**E2. Asset Page (Paid)**
- [ ] Header/Meta + description
- [ ] Memo 멀티라인 입력 + autosave
- [ ] Marks section (맥락화된 레이아웃)
- [ ] (AI Pro) AI 분석 블록(요약/포인트/태그 제안 optional)

**E3. Entitlement Gate**
- [ ] 서버 기준 접근 제어
- [ ] 프론트는 UX만 (보안은 서버)

**Acceptance**
- Free는 절대 Memo/Asset Page에 접근 불가
- Paid는 동일 URL에서 즉시 Asset Page 접근 가능

---

### Epic F — Search (Exact Free + NL Paid) (M3)
**F1. Search Index**
- [ ] Lexical search: title/url/tag (+ description optional)
- [ ] 필터: folder, tag, date range

**F2. Exact Search UX (Free)**
- [ ] 검색 결과 리스트 렌더
- [ ] 필터 UI

**F3. NL Search (Paid)**
- [ ] NL detection 트리거
- [ ] Intent preview + CTA
- [ ] Korean time parsing (지난주/어제/지난달/작년)
- [ ] 파싱 실패: Exact로 fallback + suggestion chips

**Acceptance**
- “지난주 추가한 리액트 링크” → 7일 필터 + react 키워드 부스트

---

### Epic G — Billing & Plans (M4)
**G1. Stripe Subscription**
- [ ] Pro 결제 플로우
- [ ] (Optional) AI Pro 티어 + 크레딧

**G2. Entitlement Service**
- [ ] plan + feature flags
- [ ] 웹/익스텐션 공통 적용

**G3. Upgrade UX**
- [ ] NL blocked 화면
- [ ] Asset Page blocked 화면

**Acceptance**
- 결제 후 새로고침 없이 즉시 유료 기능 활성화(최대 수 초 지연 허용)

---

### Epic H — Migration/Onboarding & Analytics (M5)
**H1. Onboarding**
- [ ] 체크리스트: extension 설치 → import → 첫 mark → 첫 검색
- [ ] Import 완료 후 next step 유도(정리 강요 금지)

**H2. Analytics**
- [ ] GA4 연결
- [ ] core events 전송(문서 참조)

**H3. Ops**
- [ ] Admin 최소(유저/플랜/ImportJob/재시도)
- [ ] 백업 자동화 + 복구 리허설(최소 1회)

---

### Epic I — QA/Hardening & Launch (M6)
- [ ] E2E smoke (로그인/저장/마크/검색/결제)
- [ ] Extension 스토어 정책 점검
- [ ] 데이터 export 최소 구현(HTML/JSON)
- [ ] 성능(리스트/검색) 최적화

- [ ] Worker 동시성 N 병렬 처리(초기값 N=10 권장, 환경에 따라 조정) + job locking


## Worker Implementation Notes (Locked reference)
- See: docs/worker_job_processing.md
- Claim query must use: SELECT ... FOR UPDATE SKIP LOCKED
- TTL reclaim: locked_at older than 10 minutes is eligible
- Domain throttling: k=2 (in-memory semaphore for MVP)
- Backoff: 5 minutes, max_attempts=2
