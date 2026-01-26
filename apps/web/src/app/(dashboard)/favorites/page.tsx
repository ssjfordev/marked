import { requireUser } from '@/lib/auth/actions';
import { createServiceClient } from '@/lib/supabase/server';
import { FavoriteLinks } from './FavoriteLinks';

export default async function FavoritesPage() {
  const user = await requireUser();
  const supabase = createServiceClient();

  // Fetch favorite link instances
  const { data: instances } = await supabase
    .from('link_instances')
    .select('id, user_title, user_description, position, is_favorite, created_at, link_canonical_id, folder_id')
    .eq('user_id', user.id)
    .eq('is_favorite', true)
    .order('updated_at', { ascending: false });

  if (!instances || instances.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Favorites</h1>
              <p className="text-sm text-foreground-muted">0 links</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-yellow-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-foreground mb-2">No favorites yet</h2>
          <p className="text-foreground-muted max-w-sm mx-auto">
            Click the star icon on any link to add it to your favorites for quick access.
          </p>
        </div>
      </div>
    );
  }

  // Fetch canonicals for all instances
  const canonicalIds = instances.map((i) => i.link_canonical_id);
  const { data: canonicals } = await supabase
    .from('link_canonicals')
    .select('id, url_key, original_url, domain, title, description, og_image, favicon')
    .in('id', canonicalIds);

  const canonicalMap = new Map(canonicals?.map((c) => [c.id, c]) ?? []);

  // Fetch tags for all instances
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

  // Build link tags map
  const instanceTagsMap = new Map<string, { id: string; name: string }[]>();
  for (const lt of linkTags ?? []) {
    const tag = tagMap.get(lt.tag_id);
    if (tag) {
      const existing = instanceTagsMap.get(lt.link_instance_id) ?? [];
      existing.push(tag);
      instanceTagsMap.set(lt.link_instance_id, existing);
    }
  }

  // Transform data for the component
  const linksData = instances
    .map((instance) => {
      const canonical = canonicalMap.get(instance.link_canonical_id);
      if (!canonical) return null;

      return {
        id: instance.id,
        user_title: instance.user_title,
        user_description: instance.user_description,
        position: instance.position,
        is_favorite: instance.is_favorite ?? true,
        created_at: instance.created_at,
        canonical: {
          id: canonical.id,
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

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Favorites</h1>
            <p className="text-sm text-foreground-muted">
              {linksData.length} {linksData.length === 1 ? 'link' : 'links'}
            </p>
          </div>
        </div>
      </div>
      <FavoriteLinks links={linksData} />
    </div>
  );
}
