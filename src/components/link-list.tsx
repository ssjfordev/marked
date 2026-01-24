'use client';

import { useState } from 'react';
import Image from 'next/image';

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

interface Tag {
  id: string;
  name: string;
}

interface LinkInstance {
  id: string;
  user_title: string | null;
  user_description: string | null;
  position: number;
  created_at: string;
  canonical: LinkCanonical;
  tags: Tag[];
}

interface LinkListProps {
  links: LinkInstance[];
  view?: 'card' | 'list';
  onOpenLink?: (link: LinkInstance) => void;
  onEditLink?: (link: LinkInstance) => void;
  onDeleteLink?: (linkId: string) => Promise<void>;
  onAddTag?: (linkId: string, tagName: string) => Promise<void>;
  onRemoveTag?: (linkId: string, tagId: string) => Promise<void>;
}

export function LinkList({
  links,
  view = 'list',
  onOpenLink,
  onEditLink,
  onDeleteLink,
  onAddTag,
  onRemoveTag,
}: LinkListProps) {
  const [addingTagToLinkId, setAddingTagToLinkId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');

  const getDisplayTitle = (link: LinkInstance) => {
    return link.user_title || link.canonical.title || link.canonical.domain;
  };

  const getDisplayDescription = (link: LinkInstance) => {
    return link.user_description || link.canonical.description;
  };

  const handleOpenExternal = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddTag = async (linkId: string) => {
    if (newTagName.trim() && onAddTag) {
      await onAddTag(linkId, newTagName.trim());
      setNewTagName('');
      setAddingTagToLinkId(null);
    }
  };

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="mb-4 h-12 w-12 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        <p className="text-gray-500">No links in this folder</p>
        <p className="mt-1 text-sm text-gray-400">
          Add links using the browser extension or import bookmarks
        </p>
      </div>
    );
  }

  if (view === 'card') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <div
            key={link.id}
            className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
            onClick={() => onOpenLink?.(link)}
          >
            {/* Thumbnail */}
            {link.canonical.og_image && (
              <div className="relative aspect-video bg-gray-100">
                <Image
                  src={link.canonical.og_image}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            <div className="p-4">
              {/* Domain + favicon */}
              <div className="mb-2 flex items-center gap-2">
                {link.canonical.favicon && (
                  <Image
                    src={link.canonical.favicon}
                    alt=""
                    width={16}
                    height={16}
                    className="rounded"
                    unoptimized
                  />
                )}
                <span className="text-xs text-gray-500">{link.canonical.domain}</span>
                <button
                  onClick={(e) => handleOpenExternal(link.canonical.original_url, e)}
                  className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                  title="Open in new tab"
                >
                  <svg
                    className="h-4 w-4 text-gray-400 hover:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </button>
              </div>

              {/* Title */}
              <h3 className="mb-1 line-clamp-2 font-medium text-gray-900">
                {getDisplayTitle(link)}
              </h3>

              {/* Description */}
              {getDisplayDescription(link) && (
                <p className="mb-3 line-clamp-2 text-sm text-gray-500">
                  {getDisplayDescription(link)}
                </p>
              )}

              {/* Tags */}
              {link.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {link.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // List view
  return (
    <div className="divide-y divide-gray-100">
      {links.map((link) => (
        <div
          key={link.id}
          className="group flex gap-4 px-4 py-3 transition-colors hover:bg-gray-50"
        >
          {/* Favicon */}
          <div className="flex-shrink-0 pt-1">
            {link.canonical.favicon ? (
              <Image
                src={link.canonical.favicon}
                alt=""
                width={20}
                height={20}
                className="rounded"
                unoptimized
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded bg-gray-200">
                <svg
                  className="h-3 w-3 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onOpenLink?.(link)}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-medium text-gray-900">{getDisplayTitle(link)}</h3>
              <span className="flex-shrink-0 text-xs text-gray-400">{link.canonical.domain}</span>
            </div>

            {getDisplayDescription(link) && (
              <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">
                {getDisplayDescription(link)}
              </p>
            )}

            {/* Tags */}
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {link.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="group/tag flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {tag.name}
                  {onRemoveTag && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTag(link.id, tag.id);
                      }}
                      className="hidden text-gray-400 hover:text-red-500 group-hover/tag:inline"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}

              {/* Add tag button */}
              {addingTagToLinkId === link.id ? (
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onBlur={() => {
                    if (newTagName.trim()) handleAddTag(link.id);
                    else setAddingTagToLinkId(null);
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') handleAddTag(link.id);
                    if (e.key === 'Escape') setAddingTagToLinkId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Tag name"
                  className="rounded-full border px-2 py-0.5 text-xs"
                  autoFocus
                />
              ) : (
                onAddTag && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingTagToLinkId(link.id);
                    }}
                    className="rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-400 opacity-0 transition-opacity hover:border-gray-400 hover:text-gray-500 group-hover:opacity-100"
                  >
                    + tag
                  </button>
                )
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => handleOpenExternal(link.canonical.original_url, e)}
              className="rounded p-1 hover:bg-gray-200"
              title="Open in new tab"
            >
              <svg
                className="h-4 w-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </button>
            {onEditLink && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditLink(link);
                }}
                className="rounded p-1 hover:bg-gray-200"
                title="Edit"
              >
                <svg
                  className="h-4 w-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            )}
            {onDeleteLink && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this link?')) {
                    onDeleteLink(link.id);
                  }
                }}
                className="rounded p-1 hover:bg-red-100"
                title="Delete"
              >
                <svg
                  className="h-4 w-4 text-gray-500 hover:text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
