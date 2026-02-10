'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/components/LanguageProvider';

interface Folder {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  position: number;
  children?: Folder[];
}

interface SidebarFoldersProps {
  folders: Folder[];
  linkCounts?: Record<string, number>;
}

export function SidebarFolders({ folders, linkCounts = {} }: SidebarFoldersProps) {
  const { t } = useLocale();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const renderFolder = (folder: Folder, depth: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = pathname === `/folders/${folder.id}`;

    // Tight padding: 10px per level
    const paddingLeft = depth * 10 + 6;

    return (
      <div key={folder.id}>
        <div
          className={`
            group flex items-center gap-1
            rounded-md px-1.5 py-1
            text-[13px] transition-colors duration-150
            ${
              isSelected
                ? 'bg-primary/15 text-primary-light'
                : 'text-foreground-secondary hover:bg-hover hover:text-foreground'
            }
          `
            .trim()
            .replace(/\s+/g, ' ')}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          {/* Expand/Collapse button - only render if has children */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleExpand(folder.id);
              }}
              className="flex items-center justify-center w-4 h-4 rounded transition-colors duration-150 text-foreground-faint hover:text-foreground-muted"
            >
              <svg
                className={`w-2.5 h-2.5 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* Folder icon */}
          {folder.icon ? (
            <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center text-sm leading-none">
              {folder.icon}
            </span>
          ) : (
            <svg
              className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-primary-light' : 'text-foreground-faint'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              {isExpanded ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              )}
            </svg>
          )}

          {/* Folder name as link */}
          <Link href={`/folders/${folder.id}`} className="flex-1 truncate">
            {folder.name}
          </Link>

          {/* Link count badge */}
          {(linkCounts[folder.id] ?? 0) > 0 && (
            <span className="text-[10px] text-foreground-faint tabular-nums px-1.5 py-0.5 rounded bg-surface-hover">
              {linkCounts[folder.id]}
            </span>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="animate-slideDown">
            {folder.children!.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (folders.length === 0) {
    return (
      <div className="px-2 py-4 text-center">
        <p className="text-xs text-foreground-faint mb-1">{t('sidebar.noFolders')}</p>
        <Link
          href="/import"
          className="text-xs text-primary-light hover:text-primary transition-colors"
        >
          {t('sidebar.importBookmarks')}
        </Link>
      </div>
    );
  }

  return <div className="space-y-0.5">{folders.map((folder) => renderFolder(folder, 0))}</div>;
}
