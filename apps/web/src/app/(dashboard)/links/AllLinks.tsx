'use client';

import { useState, useEffect, useCallback } from 'react';
import { LinkList } from '@/components/LinkList';
import { useRouter } from 'next/navigation';
import { SelectionProvider, useSelection, SelectionToolbar } from '@/components/selection';
import { useLocale } from '@/components/LanguageProvider';

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

interface Folder {
  id: string;
  name: string;
  children?: Folder[];
}

interface AllLinksProps {
  links: LinkInstance[];
}

function AllLinksContent({ links: initialLinks }: AllLinksProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [view, setView] = useState<'list' | 'card'>('list');
  const [links, setLinks] = useState(initialLinks);
  const [folders, setFolders] = useState<Folder[]>([]);

  const { isSelectionMode, selectedIds, toggleSelect, enterSelectionMode } = useSelection();

  // Sync with server data when it changes
  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  // Fetch folders for bulk move
  useEffect(() => {
    fetch('/api/v1/folders')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setFolders(json.data);
      })
      .catch((err) => console.error('Failed to fetch folders:', err));
  }, []);

  const handleOpenLink = (link: LinkInstance) => {
    router.push(`/links/${link.canonical.id}`);
  };

  const handleDeleteLink = async (linkId: string) => {
    const previousLinks = links;
    setLinks((currentLinks) => currentLinks.filter((l) => l.id !== linkId));

    try {
      const response = await fetch(`/api/v1/links/${linkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        setLinks(previousLinks);
      }
    } catch (error) {
      console.error('Failed to delete link:', error);
      setLinks(previousLinks);
    }
  };

  const handleToggleFavorite = async (linkId: string) => {
    // Optimistic update
    setLinks((currentLinks) =>
      currentLinks.map((l) => (l.id === linkId ? { ...l, is_favorite: !l.is_favorite } : l))
    );

    try {
      const response = await fetch(`/api/v1/links/${linkId}/favorite`, {
        method: 'PUT',
      });

      if (!response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      router.refresh();
    }
  };

  const handleAddTag = async (linkId: string, tagName: string) => {
    const tempId = `temp-${Date.now()}`;
    const previousLinks = links;

    setLinks((currentLinks) =>
      currentLinks.map((link) =>
        link.id === linkId ? { ...link, tags: [...link.tags, { id: tempId, name: tagName }] } : link
      )
    );

    try {
      const response = await fetch(`/api/v1/links/${linkId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        setLinks(previousLinks);
      }
    } catch (error) {
      console.error('Failed to add tag:', error);
      setLinks(previousLinks);
    }
  };

  const handleRemoveTag = async (linkId: string, tagId: string) => {
    const previousLinks = links;

    setLinks((currentLinks) =>
      currentLinks.map((link) =>
        link.id === linkId ? { ...link, tags: link.tags.filter((t) => t.id !== tagId) } : link
      )
    );

    try {
      const response = await fetch(`/api/v1/links/${linkId}/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        setLinks(previousLinks);
      }
    } catch (error) {
      console.error('Failed to remove tag:', error);
      setLinks(previousLinks);
    }
  };

  // Bulk operation handlers
  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      const previousLinks = links;
      setLinks((currentLinks) => currentLinks.filter((l) => !ids.includes(l.id)));

      try {
        const response = await fetch('/api/v1/links/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', linkIds: ids }),
        });

        if (!response.ok) {
          setLinks(previousLinks);
          throw new Error('Bulk delete failed');
        }
      } catch (error) {
        console.error('Bulk delete failed:', error);
        setLinks(previousLinks);
        throw error;
      }
    },
    [links]
  );

  const handleBulkTag = useCallback(
    async (ids: string[], tagName: string) => {
      const tempId = `temp-${Date.now()}`;
      const previousLinks = links;

      setLinks((currentLinks) =>
        currentLinks.map((link) =>
          ids.includes(link.id)
            ? { ...link, tags: [...link.tags, { id: tempId, name: tagName }] }
            : link
        )
      );

      try {
        const response = await fetch('/api/v1/links/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'addTag', linkIds: ids, tagName }),
        });

        if (response.ok) {
          router.refresh();
        } else {
          setLinks(previousLinks);
          throw new Error('Bulk tag failed');
        }
      } catch (error) {
        console.error('Bulk tag failed:', error);
        setLinks(previousLinks);
        throw error;
      }
    },
    [links, router]
  );

  const handleBulkMove = useCallback(async (ids: string[], targetFolderId: string) => {
    // In AllLinks, don't remove from list (it's the full list)
    try {
      const response = await fetch('/api/v1/links/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', linkIds: ids, folderId: targetFolderId }),
      });

      if (!response.ok) {
        throw new Error('Bulk move failed');
      }
    } catch (error) {
      console.error('Bulk move failed:', error);
      throw error;
    }
  }, []);

  const handleBulkFavorite = useCallback(
    async (ids: string[], favorite: boolean) => {
      const previousLinks = links;

      setLinks((currentLinks) =>
        currentLinks.map((link) =>
          ids.includes(link.id) ? { ...link, is_favorite: favorite } : link
        )
      );

      try {
        const response = await fetch('/api/v1/links/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: favorite ? 'favorite' : 'unfavorite', linkIds: ids }),
        });

        if (!response.ok) {
          setLinks(previousLinks);
          throw new Error('Bulk favorite failed');
        }
      } catch (error) {
        console.error('Bulk favorite failed:', error);
        setLinks(previousLinks);
        throw error;
      }
    },
    [links]
  );

  const allLinkIds = links.map((l) => l.id);

  return (
    <div className={isSelectionMode ? 'pb-24' : ''}>
      {/* View toggle */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-foreground-muted">{links.length} links</span>
        <div className="flex items-center gap-2">
          {/* Selection mode toggle */}
          {links.length > 0 && !isSelectionMode && (
            <button
              onClick={enterSelectionMode}
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                text-sm text-foreground-muted
                hover:bg-surface-hover hover:text-foreground
                transition-colors
              "
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              {t('selection.select')}
            </button>
          )}

          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
            <button
              onClick={() => setView('list')}
              className={`rounded-md p-1.5 transition-colors ${
                view === 'list'
                  ? 'bg-surface-hover text-foreground'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
              title="List view"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <button
              onClick={() => setView('card')}
              className={`rounded-md p-1.5 transition-colors ${
                view === 'card'
                  ? 'bg-surface-hover text-foreground'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
              title="Card view"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <LinkList
        links={links}
        view={view}
        selectionMode={isSelectionMode}
        selectedIds={selectedIds}
        onSelectLink={toggleSelect}
        onOpenLink={handleOpenLink}
        onDeleteLink={handleDeleteLink}
        onToggleFavorite={handleToggleFavorite}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
      />

      {/* Selection Toolbar */}
      <SelectionToolbar
        allIds={allLinkIds}
        folders={folders}
        onBulkDelete={handleBulkDelete}
        onBulkTag={handleBulkTag}
        onBulkMove={handleBulkMove}
        onBulkFavorite={handleBulkFavorite}
      />
    </div>
  );
}

// Export wrapped component with SelectionProvider
export function AllLinks(props: AllLinksProps) {
  return (
    <SelectionProvider>
      <AllLinksContent {...props} />
    </SelectionProvider>
  );
}
