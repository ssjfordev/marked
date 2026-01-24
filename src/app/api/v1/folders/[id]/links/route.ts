/**
 * Folder Links API - List links in a folder
 *
 * GET /api/v1/folders/[id]/links - Get all links in a folder
 */

import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError, validateUuid, NotFoundError } from '@/lib/api';
import type { LinkWithDetails, Tag } from '@/types/api';
import type { Database } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

type LinkInstanceRow = Database['public']['Tables']['link_instances']['Row'];
type LinkCanonicalRow = Database['public']['Tables']['link_canonicals']['Row'];
type TagRow = Database['public']['Tables']['tags']['Row'];

interface LinkInstanceWithCanonical extends LinkInstanceRow {
  link_canonicals: LinkCanonicalRow;
  link_tags: Array<{
    tags: TagRow;
  }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: folderId } = await params;
    validateUuid(folderId, 'folder id');

    const supabase = await createServerClient();

    // Verify folder exists and belongs to user
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('id')
      .eq('id', folderId)
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
        link_canonicals (*),
        link_tags (
          tags (*)
        )
      `
      )
      .eq('folder_id', folderId)
      .eq('user_id', user.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to API response format
    const result: LinkWithDetails[] = ((links ?? []) as unknown as LinkInstanceWithCanonical[]).map(
      (link) => ({
        ...link,
        canonical: link.link_canonicals,
        tags: link.link_tags.map((lt) => lt.tags).filter((t): t is Tag => t !== null),
        // Remove internal join fields
        link_canonicals: undefined as unknown as LinkCanonicalRow,
        link_tags: undefined as unknown as Array<{ tags: TagRow }>,
      })
    );

    return success(result);
  } catch (err) {
    return handleError(err);
  }
}
