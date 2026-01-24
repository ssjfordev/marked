'use client';

import { LinkList } from '@/components/link-list';
import { useRouter } from 'next/navigation';

interface LinkCanonical {
  id: string;
  url_key: string;
  original_url: string;
  domain: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  favicon: string | null;
}

interface LinkInstance {
  id: string;
  user_title: string | null;
  user_description: string | null;
  position: number;
  created_at: string;
  canonical: LinkCanonical;
  tags: { id: string; name: string }[];
}

interface FolderLinksProps {
  links: LinkInstance[];
  folderId: string;
}

export function FolderLinks({ links, folderId: _folderId }: FolderLinksProps) {
  const router = useRouter();

  const handleOpenLink = (link: LinkInstance) => {
    window.open(link.canonical.original_url, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      const response = await fetch(`/api/v1/links/${linkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

  return (
    <LinkList
      links={links}
      view="list"
      onOpenLink={handleOpenLink}
      onDeleteLink={handleDeleteLink}
    />
  );
}
