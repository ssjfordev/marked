# Clean Code & Engineering Standards (Project-wide)

## 0) 목적
- “빠르게 만들되, 버리지 않아도 되는 코드”를 목표로 한다.
- 유료/무료 경계가 있는 서비스 특성상, 추후 변경에 강한 구조가 필요하다.

## 1) Architecture Principles
### 1.1 Separation of Concerns
- UI는 상태/렌더링에 집중
- 도메인 규칙(플랜 게이팅, url canonicalization, description fallback, mark rules)은 별도 모듈로 분리

### 1.2 Explicit Contracts
- API request/response 타입을 단일 소스에서 관리
- DB schema 변경은 migration으로만
- “암묵적 필드” 금지

### 1.3 Deterministic UX
- Description 우선순위 등은 코드로 고정(테스트 포함)
- Free/Paid 화면 분기 또한 명확한 가드로 표현

## 2) Naming & Modules
- product terms를 코드에도 그대로 반영:
  - Mark, AssetPage, LightViewer, LinkCanonical, LinkInstance, Entitlement
- 파일/폴더:
  - `domain/` (규칙/유스케이스)
  - `services/` (외부 연동: auth, billing, analytics)
  - `ui/` (components/pages)
  - `infra/` (db, queue, workers)

## 3) Error Handling Standards
- 모든 비동기 작업(Import/Enrichment/AI)은:
  - 상태(state) + 재시도(retry) + 사용자 메시지(UX)로 표현
- “조용히 실패” 금지
- 에러 메시지는 사용자 탓이 아니라 시스템 상태를 설명

## 4) Testing Minimum
- url_key canonicalization 유닛 테스트 (tracking params, trailing slash 등)
- import parser 테스트(폴더/링크/중복)
- entitlement gate 테스트 (Free/Paid 접근)
- NL parsing(시간 표현) 테스트 (지난주/어제/지난달/작년)

## 5) Performance & Observability
- 리스트/검색은 캐시를 고려 (pagination/virtualization은 필요시)
- 로깅:
  - 개인 정보/링크 내용 본문 로깅 금지
  - job failure/latency/queue depth는 메트릭화

## 6) Security / Privacy
- Asset Page/Memo/NL Search는 서버에서 최종 검증
- metadata-only 저장 정책을 문서·코드에서 일관되게 유지


## 7) Worker Boundary
- Worker는 Next.js 웹/API와 독립적으로 배포되며, 동일한 도메인 규칙을 공유해야 한다.
- 공유 규칙 모듈(예: url_key canonicalization, description fallback)은 패키지/라이브러리로 분리한다.

## 8) Search Index Discipline
- 검색 인덱스(tsvector/pg_trgm)는 마이그레이션으로 관리하고, 쿼리 규칙은 테스트로 고정한다.

## 9) Thumbnail Fallback Determinism
- og:image → default thumbnail(random from set) 규칙을 코드 상수로 고정한다.
- Screenshot은 MVP에서 제외한다.


## 11) Job Processing Rules Are Spec
- Worker 락킹/재시도/TTL 회수는 docs/worker_job_processing.md를 '단일 진실'로 삼고, 코드/테스트에서 강제한다.
