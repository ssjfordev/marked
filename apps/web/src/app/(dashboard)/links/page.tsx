import { requireUser } from '@/lib/auth/actions';
import { createServiceClient } from '@/lib/supabase/server';
import { AllLinks } from './AllLinks';

export default async function AllLinksPage() {
  const user = await requireUser();
  const supabase = createServiceClient();

  // Fetch all link instances
  const { data: instances } = await supabase
    .from('link_instances')
    .select('id, user_title, user_description, position, is_favorite, created_at, link_canonical_id, folder_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!instances || instances.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">All Links</h1>
              <p className="text-sm text-foreground-muted">0 links</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-primary-light/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-foreground mb-2">No links yet</h2>
          <p className="text-foreground-muted max-w-sm mx-auto">
            Import bookmarks or add links to get started.
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
        is_favorite: instance.is_favorite ?? false,
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
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">All Links</h1>
            <p className="text-sm text-foreground-muted">
              {linksData.length} {linksData.length === 1 ? 'link' : 'links'}
            </p>
          </div>
        </div>
      </div>
      <AllLinks links={linksData} />
    </div>
  );
}
