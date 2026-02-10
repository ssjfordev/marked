/**
 * Links By URL API
 *
 * GET /api/v1/links/by-url?url=... - Check if link exists for current user
 */

import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError } from '@/lib/api';
import { canonicalizeUrl } from '@/domain/url';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return success(null);
    }

    const supabase = await createServerClient();

    // Canonicalize the URL to find the matching canonical
    const { urlKey } = canonicalizeUrl(url);

    // Find the canonical by url_key
    const { data: canonical } = await supabase
      .from('link_canonicals')
      .select('id, short_id, title, description')
      .eq('url_key', urlKey)
      .maybeSingle();

    if (!canonical) {
      return success(null);
    }

    // Find user's link instance for this canonical
    const { data: instance } = await supabase
      .from('link_instances')
      .select('id, folder_id, user_title, user_description')
      .eq('link_canonical_id', canonical.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!instance) {
      return success(null);
    }

    // Get folder short_id if exists
    let folderShortId: string | null = null;
    if (instance.folder_id) {
      const { data: folder } = await supabase
        .from('folders')
        .select('short_id')
        .eq('id', instance.folder_id)
        .single();
      folderShortId = folder?.short_id ?? null;
    }

    return success({
      id: instance.id,
      folder_id: folderShortId,
      user_title: instance.user_title,
      user_description: instance.user_description,
      link_canonical_id: canonical.id,
      canonical: {
        id: canonical.short_id,
        title: canonical.title,
        description: canonical.description,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
