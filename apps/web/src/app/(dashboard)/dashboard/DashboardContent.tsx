'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  return FALLBACK_THUMBNAILS[Math.abs(hash) % FALLBACK_THUMBNAILS.length];
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

interface DashboardContentProps {
  recentLinks: LinkInstance[];
  favoriteLinks: LinkInstance[];
}

export function DashboardContent({
  recentLinks: initialRecent,
  favoriteLinks: initialFavorites,
}: DashboardContentProps) {
  const router = useRouter();
  const [recentLinks, setRecentLinks] = useState(initialRecent);
  const [favoriteLinks, setFavoriteLinks] = useState(initialFavorites);

  const handleToggleFavorite = async (linkId: string) => {
    // Find the link in either list
    const link =
      recentLinks.find((l) => l.id === linkId) || favoriteLinks.find((l) => l.id === linkId);
    if (!link) return;

    const wasFavorite = link.is_favorite;

    // Optimistic update
    setRecentLinks((links) =>
      links.map((l) => (l.id === linkId ? { ...l, is_favorite: !l.is_favorite } : l))
    );

    if (wasFavorite) {
      // Remove from favorites
      setFavoriteLinks((links) => links.filter((l) => l.id !== linkId));
    } else {
      // Add to favorites
      setFavoriteLinks((links) => [{ ...link, is_favorite: true }, ...links].slice(0, 6));
    }

    try {
      const response = await fetch(`/api/v1/links/${linkId}/favorite`, {
        method: 'PUT',
      });

      if (!response.ok) {
        router.refresh();
      }
    } catch {
      router.refresh();
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    const previousRecent = recentLinks;
    const previousFavorites = favoriteLinks;

    setRecentLinks((links) => links.filter((l) => l.id !== linkId));
    setFavoriteLinks((links) => links.filter((l) => l.id !== linkId));

    try {
      const response = await fetch(`/api/v1/links/${linkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        setRecentLinks(previousRecent);
        setFavoriteLinks(previousFavorites);
      }
    } catch {
      setRecentLinks(previousRecent);
      setFavoriteLinks(previousFavorites);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-8">
      {/* Recent Links Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Recent Links</h2>
        </div>

        {recentLinks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onToggleFavorite={() => handleToggleFavorite(link.id)}
                onDelete={() => handleDeleteLink(link.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-foreground-muted">No recent links</p>
          </div>
        )}
      </section>

      {/* Favorites Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <h2 className="text-lg font-medium text-foreground">Favorites</h2>
          </div>
          <Link
            href="/favorites"
            className="text-sm text-primary hover:text-primary-dark transition-colors"
          >
            View all →
          </Link>
        </div>

        {favoriteLinks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onToggleFavorite={() => handleToggleFavorite(link.id)}
                onDelete={() => handleDeleteLink(link.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-yellow-500/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </div>
            <p className="text-foreground-muted">No favorites yet</p>
            <p className="text-sm text-foreground-muted/60 mt-1">
              Click the star icon on any link to add it here
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

interface LinkCardProps {
  link: LinkInstance;
  onToggleFavorite: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
}

function LinkCard({ link, onToggleFavorite, onDelete, formatDate }: LinkCardProps) {
  const [showActions, setShowActions] = useState(false);
  const title = link.user_title || link.canonical.title || link.canonical.domain;
  const description = link.user_description || link.canonical.description;
  const fallbackThumbnail = useMemo(
    () => getFallbackThumbnail(title + link.canonical.domain),
    [title, link.canonical.domain]
  );
  const [thumbnailSrc, setThumbnailSrc] = useState(link.canonical.og_image || fallbackThumbnail);

  return (
    <div
      className="group relative rounded-xl border border-border bg-surface hover:border-border-hover transition-colors overflow-hidden"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Thumbnail (always shown — fallback if missing or broken) */}
      <div className="relative aspect-[16/9] bg-surface-secondary overflow-hidden">
        <img
          src={thumbnailSrc}
          alt=""
          className="w-full h-full object-cover"
          onError={() => {
            if (thumbnailSrc !== fallbackThumbnail) {
              setThumbnailSrc(fallbackThumbnail);
            }
          }}
        />

        {/* Favorite button overlay */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all ${
            link.is_favorite
              ? 'bg-yellow-500/20 text-yellow-500'
              : showActions
                ? 'bg-black/40 text-white/80 hover:text-yellow-400'
                : 'opacity-0'
          }`}
        >
          <svg
            className="w-4 h-4"
            fill={link.is_favorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </button>

        {/* Delete button */}
        {showActions && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/40 text-white/80 hover:text-red-400 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <a
        href={link.canonical.original_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4"
      >
        <div className="flex items-start gap-2 mb-2">
          <img
            src={
              link.canonical.favicon ||
              `https://www.google.com/s2/favicons?domain=${link.canonical.domain}&sz=32`
            }
            alt=""
            className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
          />
          <h3 className="font-medium text-foreground text-sm line-clamp-2 leading-snug">{title}</h3>
        </div>

        {description && (
          <p className="text-xs text-foreground-muted line-clamp-2 mb-2">{description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-foreground-muted/60">
          <span className="truncate max-w-[60%]">{link.canonical.domain}</span>
          <span>{formatDate(link.created_at)}</span>
        </div>

        {/* Tags */}
        {link.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {link.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-surface-secondary text-foreground-muted"
              >
                {tag.name}
              </span>
            ))}
            {link.tags.length > 3 && (
              <span className="text-[10px] text-foreground-muted/60">+{link.tags.length - 3}</span>
            )}
          </div>
        )}
      </a>
    </div>
  );
}
