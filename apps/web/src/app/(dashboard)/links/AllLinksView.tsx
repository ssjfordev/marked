'use client';

import { useState, useEffect } from 'react';
import { AllLinks } from './AllLinks';

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
  const [links, setLinks] = useState<LinkInstance[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/v1/links')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.data) {
          setLinks(json.data);
        }
      })
      .catch((err) => console.error('Failed to fetch links:', err));

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border overflow-hidden">
              <div className="h-36 bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
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
              <h1 className="text-2xl font-semibold text-foreground">All Links</h1>
              <p className="text-sm text-foreground-muted">0 links</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <h2 className="text-lg font-medium text-foreground mb-2">No links yet</h2>
          <p className="text-foreground-muted max-w-sm mx-auto">
            Import bookmarks or add links to get started.
          </p>
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
            <h1 className="text-2xl font-semibold text-foreground">All Links</h1>
            <p className="text-sm text-foreground-muted">
              {links.length} {links.length === 1 ? 'link' : 'links'}
            </p>
          </div>
        </div>
      </div>
      <AllLinks links={links} />
    </div>
  );
}
