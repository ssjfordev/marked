/**
 * Links Export API
 *
 * GET /api/v1/links/export - Export all user links with folder paths
 */

import { createApiClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError } from '@/lib/api';

interface FolderRow {
  id: string;
  name: string;
  parent_id: string | null;
}

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createApiClient();

    // Fetch links and folders in parallel
    const [linksResult, foldersResult] = await Promise.all([
      supabase
        .from('link_instances')
        .select(
          `
          *,
          link_canonicals (original_url, title)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('folders').select('id, name, parent_id').eq('user_id', user.id),
    ]);

    if (linksResult.error) throw linksResult.error;
    if (foldersResult.error) throw foldersResult.error;

    // Build folder path map: folder UUID -> ["parent", "child", "grandchild"]
    const folderMap = new Map<string, FolderRow>();
    for (const f of foldersResult.data ?? []) {
      folderMap.set(f.id, f as FolderRow);
    }

    function getFolderPath(folderId: string | null): string[] {
      if (!folderId) return [];
      const path: string[] = [];
      let currentId: string | null = folderId;
      const visited = new Set<string>();

      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const folder = folderMap.get(currentId);
        if (!folder) break;
        path.unshift(folder.name);
        currentId = folder.parent_id;
      }

      return path;
    }

    // Build export data
    const exportLinks = (linksResult.data ?? [])
      .map((link) => {
        const canonical = link.link_canonicals as unknown as {
          original_url: string;
          title: string | null;
        };

        return {
          url: canonical?.original_url ?? '',
          title: link.user_title || canonical?.title || '',
          folderPath: getFolderPath(link.folder_id),
        };
      })
      .filter((l) => l.url);

    return success({
      links: exportLinks,
      totalCount: exportLinks.length,
    });
  } catch (err) {
    return handleError(err);
  }
}
