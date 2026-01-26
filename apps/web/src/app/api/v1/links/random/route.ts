/**
 * Random Links API
 *
 * GET /api/v1/links/random?count=5 - Get random links for current user
 */

import { createServiceClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const count = Math.min(parseInt(searchParams.get('count') ?? '5', 10), 20);

    const supabase = createServiceClient();

    // Get total count of user's links
    const { count: totalCount } = await supabase
      .from('link_instances')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (!totalCount || totalCount === 0) {
      return success({ links: [], total: 0 });
    }

    // Generate random offsets
    const offsets = new Set<number>();
    const maxOffset = totalCount - 1;
    const numToFetch = Math.min(count, totalCount);

    while (offsets.size < numToFetch) {
      offsets.add(Math.floor(Math.random() * (maxOffset + 1)));
    }

    // Fetch random instances using offsets
    const instances: Array<{
      id: string;
      user_title: string | null;
      user_description: string | null;
      position: number;
      is_favorite: boolean | null;
      created_at: string;
      link_canonical_id: string;
      folder_id: string | null;
    }> = [];

    for (const offset of offsets) {
      const { data } = await supabase
        .from('link_instances')
        .select('id, user_title, user_description, position, is_favorite, created_at, link_canonical_id, folder_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset)
        .single();

      if (data) {
        instances.push(data);
      }
    }

    if (instances.length === 0) {
      return success({ links: [], total: totalCount });
    }

    // Fetch canonicals
    const canonicalIds = instances.map((i) => i.link_canonical_id);
    const { data: canonicals } = await supabase
      .from('link_canonicals')
      .select('id, short_id, url_key, original_url, domain, title, description, og_image, favicon')
      .in('id', canonicalIds);

    const canonicalMap = new Map(canonicals?.map((c) => [c.id, c]) ?? []);

    // Fetch folder info
    const folderIds = instances.map((i) => i.folder_id).filter((id): id is string => id !== null);
    let folderMap = new Map<string, { id: string; short_id: string; name: string }>();
    if (folderIds.length > 0) {
      const { data: folders } = await supabase
        .from('folders')
        .select('id, short_id, name')
        .in('id', folderIds);
      folderMap = new Map(folders?.map((f) => [f.id, f]) ?? []);
    }

    // Fetch tags
    const instanceIds = instances.map((i) => i.id);
    const { data: linkTags } = await supabase
      .from('link_tags')
      .select('link_instance_id, tag_id')
      .in('link_instance_id', instanceIds);

    const tagIds = [...new Set(linkTags?.map((lt) => lt.tag_id) ?? [])];
    let tagMap = new Map<string, { id: string; name: string }>();
    if (tagIds.length > 0) {
      const { data: tags } = await supabase.from('tags').select('id, name').in('id', tagIds);
      tagMap = new Map(tags?.map((t) => [t.id, t]) ?? []);
    }

    const instanceTagsMap = new Map<string, { id: string; name: string }[]>();
    for (const lt of linkTags ?? []) {
      const tag = tagMap.get(lt.tag_id);
      if (tag) {
        const existing = instanceTagsMap.get(lt.link_instance_id) ?? [];
        existing.push(tag);
        instanceTagsMap.set(lt.link_instance_id, existing);
      }
    }

    // Build response
    const links = instances
      .map((instance) => {
        const canonical = canonicalMap.get(instance.link_canonical_id);
        if (!canonical) return null;

        const folder = instance.folder_id ? folderMap.get(instance.folder_id) : null;

        return {
          id: instance.id,
          user_title: instance.user_title,
          user_description: instance.user_description,
          is_favorite: instance.is_favorite ?? false,
          created_at: instance.created_at,
          folder: folder ? { id: folder.short_id, name: folder.name } : null,
          canonical: {
            id: canonical.short_id,
            url_key: canonical.url_key,
            original_url: canonical.original_url,
            domain: canonical.domain,
            title: canonical.title,
            description: canonical.description,
            og_image: canonical.og_image,
            favicon: canonical.favicon,
          },
          tags: instanceTagsMap.get(instance.id) ?? [],
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    return success({ links, total: totalCount });
  } catch (err) {
    return handleError(err);
  }
}
