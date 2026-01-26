/**
 * Public Shared Folder API
 *
 * GET /api/v1/shared/[shareId] - Get shared folder data (no auth required)
 */

import { createServiceClient } from '@/lib/supabase/server';
import { success, handleError, NotFoundError } from '@/lib/api';

interface RouteParams {
  params: Promise<{ shareId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { shareId } = await params;
    const supabase = createServiceClient();

    // Get folder by share_id (no user check - public)
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('id, name, icon, user_id')
      .eq('share_id', shareId)
      .single();

    if (folderError || !folder) {
      throw new NotFoundError('Shared folder not found');
    }

    // Get link instances in this folder
    const { data: instances } = await supabase
      .from('link_instances')
      .select('id, user_title, user_description, position, created_at, link_canonical_id')
      .eq('folder_id', folder.id)
      .order('position');

    if (!instances || instances.length === 0) {
      return success({
        folder: {
          name: folder.name,
          icon: folder.icon,
        },
        links: [],
      });
    }

    // Get canonicals for all instances
    const canonicalIds = instances.map((i) => i.link_canonical_id);
    const { data: canonicals } = await supabase
      .from('link_canonicals')
      .select('id, original_url, domain, title, description, og_image, favicon')
      .in('id', canonicalIds);

    const canonicalMap = new Map(canonicals?.map((c) => [c.id, c]) ?? []);

    // Transform data
    const links = instances
      .map((instance) => {
        const canonical = canonicalMap.get(instance.link_canonical_id);
        if (!canonical) return null;

        return {
          id: instance.id,
          url: canonical.original_url,
          domain: canonical.domain,
          title: instance.user_title || canonical.title || canonical.original_url,
          description: instance.user_description || canonical.description,
          ogImage: canonical.og_image,
          favicon: canonical.favicon,
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    return success({
      folder: {
        name: folder.name,
        icon: folder.icon,
      },
      links,
    });
  } catch (err) {
    return handleError(err);
  }
}
