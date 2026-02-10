'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FolderLinks } from './FolderLinks';
import { FolderHeader } from './FolderHeader';
import { FolderDescription } from './FolderDescription';
import { ShareButton } from './ShareButton';
import { useLocale } from '@/components/LanguageProvider';

interface FolderData {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  share_id: string | null;
}

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
  is_favorite: boolean;
  created_at: string;
  canonical: LinkCanonical;
  tags: { id: string; name: string }[];
}

export function FolderView() {
  const { id: folderId } = useParams<{ id: string }>();
  const { t } = useLocale();
  const [folder, setFolder] = useState<FolderData | null>(null);
  const [links, setLinks] = useState<LinkInstance[] | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFolder(null);
    setLinks(null);
    setNotFound(false);

    // Parallel fetch: folder header renders first (~1s), links follow (~2s)
    // Progressive rendering — user sees something quickly
    fetch(`/api/v1/folders/${folderId}`)
      .then((res) => {
        if (res.status === 404) throw new Error('not-found');
        return res.json();
      })
      .then((json) => {
        if (!cancelled && json?.data) setFolder(json.data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.message === 'not-found') setNotFound(true);
        else {
          console.error('Failed to fetch folder:', err);
          setNotFound(true);
        }
      });

    fetch(`/api/v1/folders/${folderId}/links`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json?.data) setLinks(json.data);
      })
      .catch((err) => {
        if (!cancelled) console.error('Failed to fetch links:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [folderId]);

  if (notFound) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <h1 className="text-2xl font-semibold text-foreground mb-2">{t('folder.notFound')}</h1>
        <p className="text-foreground-muted">{t('folder.notFoundDesc')}</p>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted" />
              <div className="h-7 w-40 bg-muted rounded" />
            </div>
            <div className="h-8 w-20 bg-muted rounded-lg" />
          </div>
          <div className="h-4 w-48 bg-muted rounded" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border overflow-hidden">
              <div className="aspect-[16/9] bg-muted" />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-3.5 h-3.5 rounded-sm bg-muted" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
                <div className="h-4 w-3/4 bg-muted rounded mb-1.5" />
                <div className="h-3 w-full bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <FolderHeader folderId={folder.id} name={folder.name} icon={folder.icon} />
          <ShareButton folderId={folder.id} initialShareId={folder.share_id} />
        </div>
        <FolderDescription folderId={folder.id} description={folder.description} />
      </div>
      <FolderLinks folderId={folder.id} links={links ?? undefined} />
    </div>
  );
}
