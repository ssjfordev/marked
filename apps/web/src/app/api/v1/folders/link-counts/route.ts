/**
 * Folders Link Counts API
 *
 * GET /api/v1/folders/link-counts - Get link counts per folder
 */

import { createServiceClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError } from '@/lib/api';

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = createServiceClient();

    // Fetch folders to get UUID -> short_id mapping
    const { data: folders, error: foldersError } = await supabase
      .from('folders')
      .select('id, short_id')
      .eq('user_id', user.id);

    if (foldersError) throw foldersError;

    const uuidToShortId = new Map<string, string>();
    for (const folder of folders || []) {
      uuidToShortId.set(folder.id, folder.short_id);
    }

    // Count links per folder using group by
    const { data: counts, error } = await supabase
      .from('link_instances')
      .select('folder_id')
      .eq('user_id', user.id);

    if (error) throw error;

    // Build count map with short_id as key
    const countMap: Record<string, number> = {};
    for (const item of counts || []) {
      if (item.folder_id) {
        const shortId = uuidToShortId.get(item.folder_id);
        if (shortId) {
          countMap[shortId] = (countMap[shortId] || 0) + 1;
        }
      }
    }

    return success(countMap);
  } catch (err) {
    return handleError(err);
  }
}
