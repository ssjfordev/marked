'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FolderManager } from './FolderManager';
import { useLocale } from '@/components/LanguageProvider';

interface Folder {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  position: number;
  children?: Folder[];
}

export function FolderManageView() {
  const { t } = useLocale();
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [error, setError] = useState(false);

  const fetchFolders = useCallback(() => {
    setError(false);
    setFolders(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    fetch('/api/v1/folders', { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) setFolders(json.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => clearTimeout(timer));

    return controller;
  }, []);

  useEffect(() => {
    const controller = fetchFolders();
    return () => controller.abort();
  }, [fetchFolders]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors mb-4"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('folderManager.backToDashboard')}
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mb-2">{t('folderManager.title')}</h1>
        <p className="text-foreground-muted">{t('folderManager.desc')}</p>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-foreground-muted text-sm">{t('common.loadFailed')}</p>
          <button
            onClick={fetchFolders}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : folders === null ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 border-2 border-foreground-muted border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <FolderManager initialFolders={folders} />
      )}
    </div>
  );
}
