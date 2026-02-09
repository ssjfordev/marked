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

  // Only fetch folder metadata (1 fast query) - links load client-side
  const { data: folder } = await supabase
    .from('folders')
    .select('short_id, name, icon, description, share_id')
    .eq('short_id', shortId)
    .eq('user_id', user.id)
    .single();

  if (!folder) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <FolderHeader folderId={folder.short_id} name={folder.name} icon={folder.icon} />
          <ShareButton folderId={folder.short_id} initialShareId={folder.share_id} />
        </div>
        <FolderDescription folderId={folder.short_id} description={folder.description} />
      </div>
      <FolderLinks folderId={folder.short_id} />
    </div>
  );
}
