import { requireUser } from '@/lib/auth/actions';
import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { FolderLinks } from './FolderLinks';
import { FolderHeader } from './FolderHeader';
import { FolderDescription } from './FolderDescription';
import { ShareButton } from './ShareButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FolderPage({ params }: PageProps) {
  const user = await requireUser();
  const { id: shortId } = await params;
  const supabase = createServiceClient();

  // Fetch folder by short_id
  const { data: folder } = await supabase
    .from('folders')
    .select('id, short_id, name, icon, description, share_id')
    .eq('short_id', shortId)
    .eq('user_id', user.id)
    .single();

  if (!folder) {
    notFound();
  }

  // Fetch link instances in this folder (use folder UUID)
  const { data: instances } = await supabase
    .from('link_instances')
    .select('id, user_title, user_description, position, is_favorite, created_at, link_canonical_id')
    .eq('folder_id', folder.id)
    .eq('user_id', user.id)
    .order('position');

  if (!instances) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">{folder.name}</h1>
        </div>
        <FolderLinks links={[]} folderId={folder.short_id} />
      </div>
    );
  }

  // Fetch canonicals for all instances (include short_id)
  const canonicalIds = instances.map((i) => i.link_canonical_id);
  const { data: canonicals } = await supabase
    .from('link_canonicals')
    .select('id, short_id, url_key, original_url, domain, title, description, og_image, favicon')
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

  // Transform data for the component (use short_id for canonical)
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
          id: (canonical as { short_id: string }).short_id, // Use short_id as public id
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
        <div className="flex items-center justify-between mb-3">
          <FolderHeader
            folderId={folder.short_id}
            name={folder.name}
            icon={folder.icon}
            linkCount={linksData.length}
          />
          <ShareButton folderId={folder.short_id} initialShareId={folder.share_id} />
        </div>
        <FolderDescription folderId={folder.short_id} description={folder.description} />
      </div>
      <FolderLinks links={linksData} folderId={folder.short_id} />
    </div>
  );
}
