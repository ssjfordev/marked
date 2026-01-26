-- ============================================
-- Semantic Search (자연어 검색)
-- pgvector 확장을 사용한 시맨틱 검색 기능 추가
-- ============================================

-- 1. pgvector 확장 활성화
create extension if not exists vector with schema extensions;

-- 2. link_canonicals 테이블에 embedding 컬럼 추가
-- OpenAI text-embedding-3-large: 2000차원
alter table public.link_canonicals
add column if not exists embedding extensions.vector(2000);

comment on column public.link_canonicals.embedding is 'OpenAI text-embedding-3-large로 생성된 시맨틱 검색용 벡터 (2000차원)';

-- 3. 벡터 검색을 위한 인덱스 생성
-- ivfflat: 대용량 데이터에 적합한 근사 최근접 이웃 인덱스
create index if not exists link_canonicals_embedding_idx
on public.link_canonicals
using ivfflat (embedding extensions.vector_cosine_ops)
with (lists = 100);

-- 4. 쿼리 임베딩 캐시 테이블
-- 자주 사용되는 검색어의 임베딩을 캐싱하여 API 비용 절감
create table if not exists public.query_embeddings_cache (
    id uuid primary key default uuid_generate_v4(),
    query text not null unique,
    embedding extensions.vector(2000) not null,
    hit_count integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists query_embeddings_cache_query_idx on public.query_embeddings_cache(query);

-- 5. 하이브리드 검색 함수 (시맨틱 + 키워드)
-- link_canonicals + link_instances 분리 스키마에 맞게 수정
create or replace function public.search_links_hybrid(
  query_embedding extensions.vector(2000),
  query_text text,
  user_id_input uuid,
  match_threshold float default 0.3,
  match_count int default 20
)
returns table (
  instance_id uuid,
  canonical_id uuid,
  original_url text,
  domain varchar(255),
  title text,
  description text,
  og_image text,
  favicon text,
  user_title text,
  user_description text,
  folder_id uuid,
  created_at timestamptz,
  is_favorite boolean,
  similarity float,
  keyword_match boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  with results as (
    select
      li.id as instance_id,
      lc.id as canonical_id,
      lc.original_url,
      lc.domain,
      lc.title,
      lc.description,
      lc.og_image,
      lc.favicon,
      li.user_title,
      li.user_description,
      li.folder_id,
      li.created_at,
      li.is_favorite,
      case
        when lc.embedding is not null then 1 - (lc.embedding <=> query_embedding)
        else 0
      end as similarity,
      (
        coalesce(li.user_title, lc.title) ilike '%' || query_text || '%'
        or coalesce(li.user_description, lc.description) ilike '%' || query_text || '%'
        or lc.original_url ilike '%' || query_text || '%'
        or lc.domain ilike '%' || query_text || '%'
      ) as keyword_match,
      -- URL 매칭 점수 (가장 높은 우선순위)
      case when lc.original_url ilike '%' || query_text || '%' then 3 else 0 end as url_match_score,
      -- 제목 매칭 점수
      case when coalesce(li.user_title, lc.title) ilike '%' || query_text || '%' then 2 else 0 end as title_match_score,
      -- 설명 매칭 점수
      case when coalesce(li.user_description, lc.description) ilike '%' || query_text || '%' then 1 else 0 end as desc_match_score
    from public.link_instances li
    inner join public.link_canonicals lc on li.link_canonical_id = lc.id
    where
      li.user_id = user_id_input
      and (
        -- 시맨틱 매칭 (embedding이 있는 경우)
        (lc.embedding is not null and 1 - (lc.embedding <=> query_embedding) > match_threshold)
        -- 또는 키워드 매칭
        or coalesce(li.user_title, lc.title) ilike '%' || query_text || '%'
        or coalesce(li.user_description, lc.description) ilike '%' || query_text || '%'
        or lc.original_url ilike '%' || query_text || '%'
        or lc.domain ilike '%' || query_text || '%'
      )
  )
  select
    r.instance_id,
    r.canonical_id,
    r.original_url,
    r.domain,
    r.title,
    r.description,
    r.og_image,
    r.favicon,
    r.user_title,
    r.user_description,
    r.folder_id,
    r.created_at,
    r.is_favorite,
    r.similarity,
    r.keyword_match
  from results r
  order by
    -- 1. 키워드 매칭 우선 (URL > 제목 > 설명)
    (r.url_match_score + r.title_match_score + r.desc_match_score) desc,
    -- 2. 키워드 매칭 중에서도 URL 매칭 최우선
    r.url_match_score desc,
    -- 3. 그 다음 시맨틱 유사도
    r.similarity desc
  limit match_count;
end;
$$;

-- 6. 시맨틱 전용 검색 함수
create or replace function public.search_links_semantic(
  query_embedding extensions.vector(2000),
  user_id_input uuid,
  match_threshold float default 0.5,
  match_count int default 20
)
returns table (
  instance_id uuid,
  canonical_id uuid,
  original_url text,
  domain text,
  title text,
  description text,
  og_image text,
  favicon text,
  user_title text,
  user_description text,
  folder_id uuid,
  created_at timestamptz,
  similarity float
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select
    li.id as instance_id,
    lc.id as canonical_id,
    lc.original_url,
    lc.domain,
    lc.title,
    lc.description,
    lc.og_image,
    lc.favicon,
    li.user_title,
    li.user_description,
    li.folder_id,
    li.created_at,
    1 - (lc.embedding <=> query_embedding) as similarity
  from public.link_instances li
  inner join public.link_canonicals lc on li.link_canonical_id = lc.id
  where
    li.user_id = user_id_input
    and lc.embedding is not null
    and 1 - (lc.embedding <=> query_embedding) > match_threshold
  order by lc.embedding <=> query_embedding
  limit match_count;
end;
$$;
