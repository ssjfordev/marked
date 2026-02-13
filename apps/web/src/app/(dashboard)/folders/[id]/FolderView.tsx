'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const [error, setError] = useState(false);

  const fetchData = useCallback(
    (showLoading = true) => {
      if (showLoading) {
        setFolder(null);
        setLinks(null);
        setNotFound(false);
        setError(false);
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);

      fetch(`/api/v1/folders/${folderId}`, { signal: controller.signal })
        .then((res) => {
          if (res.status === 404) throw new Error('not-found');
          return res.json();
        })
        .then((json) => {
          if (json?.data) setFolder(json.data);
        })
        .catch((err) => {
          if (err.message === 'not-found') setNotFound(true);
          else if (err.name !== 'AbortError') setError(true);
        });

      fetch(`/api/v1/folders/${folderId}/links`, { signal: controller.signal })
        .then((res) => res.json())
        .then((json) => {
          if (json?.data) setLinks(json.data);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') console.error('Failed to fetch links:', err);
        });

      return { controller, timer };
    },
    [folderId]
  );

  useEffect(() => {
    const { controller, timer } = fetchData(true);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [fetchData]);

  // Refetch when tab becomes visible (e.g., after saving from extension)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchData(false);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchData]);

  if (error) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-foreground-muted text-sm">{t('common.loadFailed')}</p>
        <button
          onClick={() => fetchData(true)}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

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
      <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-foreground-muted border-t-transparent rounded-full animate-spin" />
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
