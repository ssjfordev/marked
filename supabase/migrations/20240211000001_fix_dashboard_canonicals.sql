-- Fix: get_dashboard_data canonicals query was fetching by UUID order (LIMIT 12)
-- instead of fetching canonicals for the actual recent + favorite instances.
-- This caused recent links to appear empty when total links > 12.

CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'recent_instances', COALESCE((
      SELECT json_agg(row_to_json(i))
      FROM (
        SELECT li.id, li.user_title, li.user_description, li.position,
               li.is_favorite, li.created_at, li.link_canonical_id, li.folder_id
        FROM link_instances li
        WHERE li.user_id = p_user_id
        ORDER BY li.created_at DESC
        LIMIT 6
      ) i
    ), '[]'::json),
    'favorite_instances', COALESCE((
      SELECT json_agg(row_to_json(i))
      FROM (
        SELECT li.id, li.user_title, li.user_description, li.position,
               li.is_favorite, li.created_at, li.link_canonical_id, li.folder_id,
               li.updated_at
        FROM link_instances li
        WHERE li.user_id = p_user_id AND li.is_favorite = true
        ORDER BY li.updated_at DESC
        LIMIT 6
      ) i
    ), '[]'::json),
    'total_links', (SELECT count(*)::int FROM link_instances WHERE user_id = p_user_id),
    'total_folders', (SELECT count(*)::int FROM folders WHERE user_id = p_user_id),
    'total_favorites', (SELECT count(*)::int FROM link_instances WHERE user_id = p_user_id AND is_favorite = true),
    'canonicals', COALESCE((
      SELECT json_agg(row_to_json(c))
      FROM (
        SELECT lc.id, lc.url_key, lc.original_url, lc.domain,
               lc.title, lc.description, lc.og_image, lc.favicon
        FROM link_canonicals lc
        WHERE lc.id IN (
          SELECT li.link_canonical_id
          FROM link_instances li
          WHERE li.user_id = p_user_id
          ORDER BY li.created_at DESC
          LIMIT 6
        )
        OR lc.id IN (
          SELECT li.link_canonical_id
          FROM link_instances li
          WHERE li.user_id = p_user_id AND li.is_favorite = true
          ORDER BY li.updated_at DESC
          LIMIT 6
        )
      ) c
    ), '[]'::json),
    'tags', COALESCE((
      SELECT json_agg(json_build_object(
        'link_instance_id', lt.link_instance_id,
        'tag_id', t.id,
        'tag_name', t.name
      ))
      FROM link_tags lt
      INNER JOIN tags t ON t.id = lt.tag_id
      WHERE lt.link_instance_id IN (
        SELECT li.id FROM link_instances li
        WHERE li.user_id = p_user_id
        ORDER BY li.created_at DESC
        LIMIT 12
      )
    ), '[]'::json)
  ) INTO v_result;
  RETURN v_result;
END;
$$;
