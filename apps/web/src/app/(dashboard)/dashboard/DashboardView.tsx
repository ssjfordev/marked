'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardContent } from './DashboardContent';

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
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/v1/dashboard')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json?.data) {
          setData(json.data);
        }
      })
      .catch((err) => console.error('Failed to fetch dashboard:', err));

    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="mb-8">
          <div className="h-7 w-40 bg-muted rounded mb-2" />
          <div className="h-4 w-56 bg-muted rounded" />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted" />
                <div>
                  <div className="h-7 w-12 bg-muted rounded mb-1" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <div className="aspect-[16/9] bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.totalLinks === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Welcome back</h1>
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
          <h2 className="text-lg font-medium text-foreground mb-2">No links yet</h2>
          <p className="text-foreground-muted mb-6 max-w-sm mx-auto">
            Import your existing bookmarks or save links with the browser extension to get started.
          </p>
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
              Import Bookmarks
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
            <h3 className="font-medium text-foreground mb-1">Organize with folders</h3>
            <p className="text-sm text-foreground-muted">
              Create folders to keep your links organized and easy to find.
            </p>
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
            <h3 className="font-medium text-foreground mb-1">Tag for quick access</h3>
            <p className="text-sm text-foreground-muted">
              Add tags to links for faster searching and filtering.
            </p>
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
            <h3 className="font-medium text-foreground mb-1">Search everything</h3>
            <p className="text-sm text-foreground-muted">
              Find any link instantly with powerful search across all your content.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Dashboard</h1>
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
              <p className="text-sm text-foreground-muted">Total Links</p>
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
              <p className="text-sm text-foreground-muted">Folders</p>
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
              <p className="text-sm text-foreground-muted">Favorites</p>
            </div>
          </div>
        </Link>
      </div>

      <DashboardContent recentLinks={data.recentLinks} favoriteLinks={data.favoriteLinks} />
    </div>
  );
}
