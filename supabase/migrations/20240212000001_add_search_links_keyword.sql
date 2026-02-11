-- Efficient keyword search function that runs ILIKE matching in PostgreSQL
-- instead of fetching all data to the application layer.
-- Searches across: user_title, user_description, canonical title, description, domain, URL

CREATE OR REPLACE FUNCTION search_links_keyword(
  user_id_input UUID,
  query_text TEXT,
  folder_ids UUID[] DEFAULT NULL,
  favorite_only BOOLEAN DEFAULT FALSE,
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL,
  sort_by TEXT DEFAULT 'newest',
  match_count INT DEFAULT 50
)
RETURNS TABLE (
  instance_id UUID,
  user_title TEXT,
  user_description TEXT,
  "position" INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_favorite BOOLEAN,
  folder_id UUID,
  canonical_id UUID,
  short_id TEXT,
  url_key TEXT,
  original_url TEXT,
  domain TEXT,
  title TEXT,
  description TEXT,
  og_image TEXT,
  favicon TEXT
)
LANGUAGE sql STABLE
AS $fn$
  SELECT
    li.id as instance_id,
    li.user_title,
    li.user_description,
    li.position,
    li.created_at,
    li.updated_at,
    li.is_favorite,
    li.folder_id,
    lc.id as canonical_id,
    lc.short_id,
    lc.url_key,
    lc.original_url,
    lc.domain,
    lc.title,
    lc.description,
    lc.og_image,
    lc.favicon
  FROM link_instances li
  JOIN link_canonicals lc ON li.link_canonical_id = lc.id
  WHERE li.user_id = user_id_input
    AND (
      query_text IS NULL OR query_text = '' OR (
        li.user_title ILIKE '%' || query_text || '%'
        OR li.user_description ILIKE '%' || query_text || '%'
        OR lc.title ILIKE '%' || query_text || '%'
        OR lc.description ILIKE '%' || query_text || '%'
        OR lc.domain ILIKE '%' || query_text || '%'
        OR lc.original_url ILIKE '%' || query_text || '%'
      )
    )
    AND (folder_ids IS NULL OR li.folder_id = ANY(folder_ids))
    AND (NOT favorite_only OR li.is_favorite = TRUE)
    AND (date_from IS NULL OR li.created_at >= date_from)
    AND (date_to IS NULL OR li.created_at <= date_to)
  ORDER BY
    CASE WHEN sort_by = 'oldest' THEN extract(epoch from li.created_at) END ASC,
    CASE WHEN sort_by = 'domain' THEN lc.domain END ASC,
    CASE WHEN sort_by NOT IN ('oldest', 'domain') THEN extract(epoch from li.created_at) END DESC NULLS LAST
  LIMIT match_count;
$fn$;
