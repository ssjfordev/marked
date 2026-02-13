'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardContent } from './DashboardContent';
import { useLocale } from '@/components/LanguageProvider';

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

interface DashboardData {
  totalLinks: number;
  totalFolders: number;
  totalFavorites: number;
  recentLinks: LinkInstance[];
  favoriteLinks: LinkInstance[];
  email: string;
}

export function DashboardView() {
  const { t } = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);

  const [error, setError] = useState(false);

  const fetchData = useCallback(() => {
    setError(false);
    setData(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    fetch('/api/v1/dashboard', { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) setData(json.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => clearTimeout(timer));

    return controller;
  }, []);

  useEffect(() => {
    const controller = fetchData();
    return () => controller.abort();
  }, [fetchData]);

  if (error) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-foreground-muted text-sm">{t('common.loadFailed')}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-foreground-muted border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (data.totalLinks === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {t('dashboard.welcomeBack')}
          </h1>
          <p className="text-foreground-muted">{data.email}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-primary-light"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-foreground mb-2">{t('dashboard.empty.title')}</h2>
          <p className="text-foreground-muted mb-6 max-w-sm mx-auto">{t('dashboard.empty.desc')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/import"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              {t('dashboard.empty.import')}
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-primary-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <h3 className="font-medium text-foreground mb-1">{t('dashboard.empty.organize')}</h3>
            <p className="text-sm text-foreground-muted">{t('dashboard.empty.organizeDesc')}</p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-primary-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <h3 className="font-medium text-foreground mb-1">{t('dashboard.empty.tag')}</h3>
            <p className="text-sm text-foreground-muted">{t('dashboard.empty.tagDesc')}</p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-primary-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="font-medium text-foreground mb-1">{t('dashboard.empty.search')}</h3>
            <p className="text-sm text-foreground-muted">{t('dashboard.empty.searchDesc')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">{t('dashboard.title')}</h1>
        <p className="text-foreground-muted">{data.email}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Link
          href="/links"
          className="p-5 rounded-xl border border-border bg-surface hover:border-border-hover hover:bg-hover transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{data.totalLinks}</p>
              <p className="text-sm text-foreground-muted">{t('dashboard.totalLinks')}</p>
            </div>
          </div>
        </Link>
        <Link
          href="/folders/manage"
          className="p-5 rounded-xl border border-border bg-surface hover:border-border-hover hover:bg-hover transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{data.totalFolders}</p>
              <p className="text-sm text-foreground-muted">{t('dashboard.folders')}</p>
            </div>
          </div>
        </Link>
        <Link
          href="/favorites"
          className="p-5 rounded-xl border border-border bg-surface hover:border-border-hover hover:bg-hover transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{data.totalFavorites}</p>
              <p className="text-sm text-foreground-muted">{t('dashboard.favorites')}</p>
            </div>
          </div>
        </Link>
      </div>

      <DashboardContent recentLinks={data.recentLinks} favoriteLinks={data.favoriteLinks} />
    </div>
  );
}
