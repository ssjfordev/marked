import { requireUser } from '@/lib/auth/actions';
import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { FolderLinks } from './folder-links';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FolderPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = createServiceClient();

  // Fetch folder
  const { data: folder } = await supabase
    .from('folders')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!folder) {
    notFound();
  }

  // Fetch links in this folder
  const { data: links } = await supabase
    .from('link_instances')
    .select(
      `
      id,
      user_title,
      user_description,
      position,
      created_at,
      canonical:link_canonicals (
        id,
        url_key,
        original_url,
        domain,
        title,
        description,
        og_image,
        favicon
      )
    `
    )
    .eq('folder_id', id)
    .eq('user_id', user.id)
    .order('position');

  // Transform data for the component
  const linksData =
    links?.map((link) => ({
      id: link.id,
      user_title: link.user_title,
      user_description: link.user_description,
      position: link.position,
      created_at: link.created_at,
      canonical: link.canonical as {
        id: string;
        url_key: string;
        original_url: string;
        domain: string;
        title: string | null;
        description: string | null;
        og_image: string | null;
        favicon: string | null;
      },
      tags: [],
    })) ?? [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{folder.name}</h1>
      <FolderLinks links={linksData} folderId={id} />
    </div>
  );
}
