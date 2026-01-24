'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  position: number;
  children?: Folder[];
}

interface SidebarFoldersProps {
  folders: Folder[];
}

export function SidebarFolders({ folders }: SidebarFoldersProps) {
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

    return (
      <div key={folder.id}>
        <div
          className={`group flex items-center gap-1 rounded px-2 py-1.5 text-sm ${
            isSelected ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {/* Expand/Collapse button */}
          <button
            onClick={() => toggleExpand(folder.id)}
            className={`flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200 ${
              hasChildren ? 'visible' : 'invisible'
            }`}
          >
            <svg
              className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Folder icon */}
          <svg
            className="h-4 w-4 flex-shrink-0 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isExpanded ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            )}
          </svg>

          {/* Folder name as link */}
          <Link href={`/folders/${folder.id}`} className="flex-1 truncate">
            {folder.name}
          </Link>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>{folder.children!.map((child) => renderFolder(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  if (folders.length === 0) {
    return (
      <div className="px-2 py-4 text-center text-sm text-gray-500">
        <p>No folders yet.</p>
        <Link href="/import" className="mt-2 inline-block text-blue-600 hover:underline">
          Import bookmarks
        </Link>
      </div>
    );
  }

  return <div className="space-y-0.5">{folders.map((folder) => renderFolder(folder, 0))}</div>;
}
