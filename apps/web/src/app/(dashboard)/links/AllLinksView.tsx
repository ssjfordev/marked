'use client';

import { useState, useEffect, useCallback } from 'react';
import { AllLinks } from './AllLinks';
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

export function AllLinksView() {
  const { t } = useLocale();
  const [links, setLinks] = useState<LinkInstance[] | null>(null);
  const [error, setError] = useState(false);

  const fetchLinks = useCallback(() => {
    setError(false);
    setLinks(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    fetch('/api/v1/links', { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setLinks(json.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => clearTimeout(timer));

    return controller;
  }, []);

  useEffect(() => {
    const controller = fetchLinks();
    return () => controller.abort();
  }, [fetchLinks]);

  // Refetch when tab becomes visible (e.g., after saving from extension)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchLinks();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchLinks]);

  if (error) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-foreground-muted text-sm">{t('common.loadFailed')}</p>
        <button
          onClick={fetchLinks}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (links === null) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-foreground-muted border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
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
              <h1 className="text-2xl font-semibold text-foreground">{t('allLinks.title')}</h1>
              <p className="text-sm text-foreground-muted">{t('allLinks.count', { count: 0 })}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <h2 className="text-lg font-medium text-foreground mb-2">{t('allLinks.empty')}</h2>
          <p className="text-foreground-muted max-w-sm mx-auto">{t('allLinks.emptyDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
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
            <h1 className="text-2xl font-semibold text-foreground">{t('allLinks.title')}</h1>
            <p className="text-sm text-foreground-muted">
              {links.length === 1
                ? t('allLinks.countOne', { count: links.length })
                : t('allLinks.count', { count: links.length })}
            </p>
          </div>
        </div>
      </div>
      <AllLinks links={links} />
    </div>
  );
}
