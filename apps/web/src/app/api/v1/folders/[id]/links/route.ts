/**
 * Folder Links API - List links in a folder
 *
 * GET /api/v1/folders/[id]/links - Get all links in a folder (id = short_id)
 */

import { createApiClient } from '@/lib/supabase/server';
import { requireAuth, cachedSuccess, handleError, NotFoundError } from '@/lib/api';
import type { Tag } from '@/types/api';
import type { Database } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

type LinkCanonicalRow = Database['public']['Tables']['link_canonicals']['Row'] & {
  short_id: string;
};
type TagRow = Database['public']['Tables']['tags']['Row'];

interface LinkInstanceWithCanonical {
  id: string;
  user_id: string;
  link_canonical_id: string;
  folder_id: string;
  user_title: string | null;
  user_description: string | null;
  position: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  link_canonicals: LinkCanonicalRow;
  link_tags: Array<{
    tags: TagRow;
  }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: shortId } = await params;

    const supabase = await createApiClient();

    // Verify folder exists and belongs to user (by short_id)
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('id')
      .eq('short_id', shortId)
      .eq('user_id', user.id)
      .single();

    if (folderError || !folder) {
      throw new NotFoundError('Folder not found');
    }

    // Get links with canonical data and tags
    const { data: links, error } = await supabase
      .from('link_instances')
      .select(
        `
        *,
        link_canonicals (id, short_id, url_key, original_url, domain, title, description, og_image, favicon, created_at, updated_at),
        link_tags (
          tags (*)
        )
      `
      )
      .eq('folder_id', folder.id)
      .eq('user_id', user.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to API response format with short_id
    const result = ((links ?? []) as unknown as LinkInstanceWithCanonical[]).map((link) => ({
      id: link.id,
      user_title: link.user_title,
      user_description: link.user_description,
      position: link.position,
      is_favorite: link.is_favorite,
      created_at: link.created_at,
      updated_at: link.updated_at,
      canonical: {
        id: link.link_canonicals.short_id, // Use short_id
        url_key: link.link_canonicals.url_key,
        original_url: link.link_canonicals.original_url,
        domain: link.link_canonicals.domain,
        title: link.link_canonicals.title,
        description: link.link_canonicals.description,
        og_image: link.link_canonicals.og_image,
        favicon: link.link_canonicals.favicon,
      },
      tags: link.link_tags.map((lt) => lt.tags).filter((t): t is Tag => t !== null),
    }));

    return cachedSuccess(result);
  } catch (err) {
    return handleError(err);
  }
}
