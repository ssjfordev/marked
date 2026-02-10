'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CardItem } from '@/components/CardItem';
import { useLocale } from '@/components/LanguageProvider';

interface RandomLink {
  id: string;
  user_title: string | null;
  user_description: string | null;
  is_favorite: boolean;
  created_at: string;
  folder: { id: string; name: string } | null;
  canonical: {
    id: string;
    url_key: string;
    original_url: string;
    domain: string;
    title: string | null;
    description: string | null;
    og_image: string | null;
    favicon: string | null;
  };
  tags: { id: string; name: string }[];
}

export function DiscoverClient() {
  const { t } = useLocale();
  const [links, setLinks] = useState<RandomLink[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shuffling, setShuffling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/links/random?count=6')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setLinks(data.data?.links ?? []);
          setTotal(data.data?.total ?? 0);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch random links:', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleShuffle = async () => {
    setShuffling(true);
    try {
      const response = await fetch('/api/v1/links/random?count=6');
      if (response.ok) {
        const data = await response.json();
        setLinks(data.data?.links ?? []);
        setTotal(data.data?.total ?? 0);
      }
    } catch (error) {
      console.error('Failed to fetch random links:', error);
    }
    setTimeout(() => setShuffling(false), 300);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('date.today');
    if (diffDays === 1) return t('date.yesterday');
    if (diffDays < 7) return t('date.daysAgo', { count: diffDays });
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return t('date.weeksAgo', { count: weeks });
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return t('date.monthsAgo', { count: months });
    }
    const years = Math.floor(diffDays / 365);
    return t('date.yearsAgo', { count: years });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-8 h-8 text-purple-500/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-foreground mb-2">{t('discover.empty')}</h2>
        <p className="text-foreground-muted max-w-sm mx-auto">{t('discover.emptyDesc')}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Shuffle Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleShuffle}
          disabled={shuffling}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-500 text-white font-medium hover:bg-purple-600 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
        >
          <svg
            className={`w-5 h-5 transition-transform ${shuffling ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
            />
          </svg>
          {t('discover.shuffle')}
        </button>
      </div>

      {/* Stats */}
      <div className="text-center mb-6">
        <p className="text-sm text-foreground-muted">
          {t('discover.stats', { total, count: links.length })}
        </p>
      </div>

      {/* Cards Grid */}
      <div
        className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300 ${shuffling ? 'opacity-50' : 'opacity-100'}`}
      >
        {links.map((link) => {
          const title = link.user_title || link.canonical.title || link.canonical.domain;
          const description = link.user_description || link.canonical.description;
          return (
            <CardItem
              key={link.id}
              id={link.id}
              title={title}
              domain={link.canonical.domain}
              description={description}
              favicon={link.canonical.favicon}
              thumbnail={link.canonical.og_image}
              tags={link.tags}
              url={link.canonical.original_url}
              isFavorite={link.is_favorite}
              onClick={() =>
                window.open(link.canonical.original_url, '_blank', 'noopener,noreferrer')
              }
              footer={
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {link.folder && (
                      <Link
                        href={`/folders/${link.folder.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-primary"
                      >
                        <svg
                          className="w-3 h-3"
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
                        {link.folder.name}
                      </Link>
                    )}
                  </div>
                  <span className="text-xs text-foreground-faint">
                    {formatDate(link.created_at)}
                  </span>
                </div>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
