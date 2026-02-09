'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';

const FALLBACK_THUMBNAILS = [
  '/images/fallback-thumbnails/waves.png',
  '/images/fallback-thumbnails/bubbles.png',
  '/images/fallback-thumbnails/lines.png',
  '/images/fallback-thumbnails/dots.png',
  '/images/fallback-thumbnails/geometric.png',
  '/images/fallback-thumbnails/gradient.png',
];

function getFallbackThumbnail(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return FALLBACK_THUMBNAILS[Math.abs(hash) % FALLBACK_THUMBNAILS.length] ?? FALLBACK_THUMBNAILS[0];
}

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
  const [links, setLinks] = useState<RandomLink[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shuffling, setShuffling] = useState(false);

  const fetchRandomLinks = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchRandomLinks().finally(() => setLoading(false));
  }, [fetchRandomLinks]);

  const handleShuffle = async () => {
    setShuffling(true);
    await fetchRandomLinks();
    setTimeout(() => setShuffling(false), 300);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
    return `${Math.floor(diffDays / 365)}년 전`;
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
        <h2 className="text-lg font-medium text-foreground mb-2">아직 북마크가 없습니다</h2>
        <p className="text-foreground-muted max-w-sm mx-auto">
          북마크를 추가하면 여기서 랜덤하게 다시 만나볼 수 있어요.
        </p>
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
          셔플
        </button>
      </div>

      {/* Stats */}
      <div className="text-center mb-6">
        <p className="text-sm text-foreground-muted">
          총 <span className="font-medium text-foreground">{total}</span>개의 북마크 중{' '}
          <span className="font-medium text-foreground">{links.length}</span>개를 보고 있어요
        </p>
      </div>

      {/* Cards Grid */}
      <div
        className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300 ${shuffling ? 'opacity-50' : 'opacity-100'}`}
      >
        {links.map((link) => (
          <LinkCard key={link.id} link={link} formatDate={formatDate} />
        ))}
      </div>
    </div>
  );
}

function LinkCard({
  link,
  formatDate,
}: {
  link: RandomLink;
  formatDate: (date: string) => string;
}) {
  const title = link.user_title || link.canonical.title || link.canonical.domain;
  const description = link.user_description || link.canonical.description;
  const fallbackThumbnail = useMemo(
    () => getFallbackThumbnail(title + link.canonical.domain),
    [title, link.canonical.domain]
  );
  const [thumbnailSrc, setThumbnailSrc] = useState(link.canonical.og_image || fallbackThumbnail);

  return (
    <a
      href={link.canonical.original_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-border bg-surface p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
    >
      {/* Header with favicon and domain */}
      <div className="flex items-center gap-2 mb-3">
        <img
          src={
            link.canonical.favicon ||
            `https://www.google.com/s2/favicons?domain=${link.canonical.domain}&sz=32`
          }
          alt=""
          className="w-4 h-4 rounded"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span className="text-xs text-foreground-muted truncate">{link.canonical.domain}</span>
        {link.is_favorite && (
          <svg
            className="w-3.5 h-3.5 text-yellow-500 ml-auto flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        )}
      </div>

      {/* Thumbnail */}
      <div className="relative aspect-[1.91/1] mb-3 rounded-lg overflow-hidden bg-foreground/5">
        <img
          src={thumbnailSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => {
            if (thumbnailSrc !== fallbackThumbnail) {
              setThumbnailSrc(fallbackThumbnail);
            }
          }}
        />
      </div>

      {/* Title */}
      <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mt-1.5 text-sm text-foreground-muted line-clamp-2">{description}</p>
      )}

      {/* Footer */}
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
        <span className="text-xs text-foreground-faint">{formatDate(link.created_at)}</span>
      </div>

      {/* Tags */}
      {link.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {link.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-foreground/5 text-foreground-muted"
            >
              #{tag.name}
            </span>
          ))}
          {link.tags.length > 3 && (
            <span className="text-xs text-foreground-faint">+{link.tags.length - 3}</span>
          )}
        </div>
      )}
    </a>
  );
}
