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

interface RpcFolderData {
  folder: {
    id: string;
    short_id: string;
    name: string;
    icon: string | null;
    description: string | null;
    share_id: string | null;
  };
  instances: Array<{
    id: string;
    user_title: string | null;
    user_description: string | null;
    position: number;
    is_favorite: boolean | null;
    created_at: string;
    link_canonical_id: string;
  }>;
  canonicals: Array<{
    id: string;
    short_id: string;
    url_key: string;
    original_url: string;
    domain: string;
    title: string | null;
    description: string | null;
    og_image: string | null;
    favicon: string | null;
  }>;
  tags: Array<{
    link_instance_id: string;
    tag_id: string;
    tag_name: string;
  }>;
}

export default async function FolderPage({ params }: PageProps) {
  const user = await requireUser();
  const { id: shortId } = await params;
  const supabase = createServiceClient();

  // Single RPC call instead of 3-4 sequential queries
  const { data, error } = await supabase.rpc('get_folder_data', {
    p_short_id: shortId,
    p_user_id: user.id,
  });

  if (error || !data) {
    notFound();
  }

  const { folder, instances, canonicals, tags } = data as unknown as RpcFolderData;

  if (!folder) {
    notFound();
  }

  const canonicalMap = new Map(canonicals.map((c) => [c.id, c]));

  // Build link tags map
  const instanceTagsMap = new Map<string, { id: string; name: string }[]>();
  for (const t of tags) {
    const existing = instanceTagsMap.get(t.link_instance_id) ?? [];
    existing.push({ id: t.tag_id, name: t.tag_name });
    instanceTagsMap.set(t.link_instance_id, existing);
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
