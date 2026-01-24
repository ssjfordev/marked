# Worker Job Processing (Locked)
> 목적: 동시성 N 병렬 처리에서 **중복 처리/락 경합/잡 유실**을 원천 차단하는 운영 가능한 규칙을 고정한다.

## 0) Core Principle
- **DB가 큐다.**
- Vercel(Next.js)은 Job 생성/상태 조회/권한 검증만 수행한다.
- Fly.io Worker는 Supabase Postgres(Job table)를 polling하여 처리한다.
- Source of truth는 **Supabase Postgres** 단 하나다.

---

## 1) Tables (Minimum)
### 1.1 import_jobs
- id (uuid)
- user_id
- source_type: chrome_html
- status: queued | running | succeeded | failed | canceled
- total_items, processed_items, failed_items
- created_at, started_at, finished_at
- last_error (text, optional)

### 1.2 enrichment_jobs (핵심)
- id (uuid)
- link_canonical_id (uuid) **UNIQUE**
- status: queued | running | succeeded | failed | dead
- attempts (int)
- max_attempts (int) **Locked: 2**
- run_after (timestamptz)  // backoff
- locked_at (timestamptz)
- locked_by (text)         // worker instance id
- last_error (text)
- created_at, updated_at

**Locked**
- `link_canonical_id`는 UNIQUE로 둔다.
  - 이미 succeeded/running이면 새 job 생성 금지
  - 중복 폴더 placement(LinkInstance)와 무관하게 enrichment는 1회만 수행

---

## 2) State Machine (Locked)
### Enrichment
- queued → running
- running → succeeded
- running → failed
- failed → queued (run_after로 backoff)
- failed → dead (attempts >= max_attempts)

**금지**
- running이 영구 고착되는 상태
  - `locked_at` TTL로 회수(reclaim)한다.

---

## 3) Claim / Locking (Locked)
### 3.1 방식: `SELECT ... FOR UPDATE SKIP LOCKED`
Worker는 “실행 가능한 job”을 N개 배치로 가져오며, DB 트랜잭션으로 점유(claim)한다.

#### Eligible criteria (Locked)
- status IN ('queued','failed')
- run_after <= now()
- (locked_at IS NULL) OR (locked_at < now() - interval '10 minutes')  // TTL reclaim

#### Claim steps (Locked)
1) BEGIN
2) 위 조건으로 N개 SELECT ... FOR UPDATE SKIP LOCKED
3) 즉시 UPDATE:
   - status = 'running'
   - locked_at = now()
   - locked_by = <worker_id>
   - attempts = attempts + 1
   - updated_at = now()
4) COMMIT
5) commit된 job만 병렬 처리

**효과**
- multi-instance worker에서도 중복 처리 없음
- 한 인스턴스 내부 병렬 처리(N)에서도 안전

---

## 4) Concurrency (Locked)
- Worker는 batch claim size = **N**
- N개를 내부에서 병렬 처리한다 (예: Promise.allSettled)

### 4.1 Default (Locked recommendation)
- 초기 N = 10
- 런칭 후 지표(실패율/지연/리소스) 기반으로 조정

---

## 5) Domain Throttling (Locked)
동시성 N은 “전체 병렬”이고, 도메인별 제한을 반드시 둔다.

### 5.1 Default (Locked)
- 도메인당 동시 처리 k = 2

### 5.2 Implementation (MVP)
- 단일 worker 프로세스 기준: in-memory semaphore로 도메인 제한 적용
- (향후) 다중 worker 간 공유가 필요해지면 domain_locks 테이블 또는 Redis 도입

---

## 6) Retry / Backoff (Locked)
- max_attempts = 2
- backoff:
  - 1회 실패: run_after = now() + 5 minutes
  - 2회 실패: dead 전환

### 6.1 Immediate-dead rules (Recommended)
- 반복 403/robots/captcha 성격은 dead로 빠르게 전환하고 block 후보로 기록

---

## 7) Observability (Locked)
### 7.1 Worker logs
- batch_claimed_count
- job_duration_ms
- success_count / fail_count
- top failure domains

### 7.2 Sentry
- job failure는 Sentry capture (PII/URL query scrub)
- dead 전환 시 breadcrumb 남김

---

## 8) Non-goals (Locked)
- Screenshot 캡쳐는 MVP에서 제외
- 본문全文 저장/인덱싱 금지
