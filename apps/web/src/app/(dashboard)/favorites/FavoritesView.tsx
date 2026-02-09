'use client';

import { useState, useEffect } from 'react';
import { FavoriteLinks } from './FavoriteLinks';

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

export function FavoritesView() {
  const [links, setLinks] = useState<LinkInstance[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/v1/links?favorites=true')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.data) {
          setLinks(json.data);
        }
      })
      .catch((err) => console.error('Failed to fetch favorites:', err));

    return () => {
      cancelled = true;
    };
  }, []);

  if (links === null) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted" />
            <div>
              <div className="h-8 w-32 bg-muted rounded mb-1" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border p-4 flex gap-4">
              <div className="w-10 h-10 rounded bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Favorites</h1>
              <p className="text-sm text-foreground-muted">0 links</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <h2 className="text-lg font-medium text-foreground mb-2">No favorites yet</h2>
          <p className="text-foreground-muted max-w-sm mx-auto">
            Click the star icon on any link to add it to your favorites for quick access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Favorites</h1>
            <p className="text-sm text-foreground-muted">
              {links.length} {links.length === 1 ? 'link' : 'links'}
            </p>
          </div>
        </div>
      </div>
      <FavoriteLinks links={links} />
    </div>
  );
}
