'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FolderManager } from './FolderManager';

interface Folder {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  position: number;
  children?: Folder[];
}

export function FolderManageView() {
  const [folders, setFolders] = useState<Folder[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/v1/folders')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json?.data) {
          setFolders(json.data);
        }
      })
      .catch((err) => console.error('Failed to fetch folders:', err));

    return () => {
      cancelled = true;
    };
  }, []);

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
          대시보드
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Manage Folders</h1>
        <p className="text-foreground-muted">Create, rename, reorder, and organize your folders.</p>
      </div>

      {folders === null ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <div className="w-8 h-8 rounded bg-muted" />
              <div className="h-4 w-40 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <FolderManager initialFolders={folders} />
      )}
    </div>
  );
}
