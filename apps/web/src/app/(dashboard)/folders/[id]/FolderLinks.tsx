'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { LinkList } from '@/components/LinkList';
import { useRouter } from 'next/navigation';
import { SelectionProvider, useSelection, SelectionToolbar } from '@/components/selection';

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

interface FolderLinksProps {
  links: LinkInstance[];
  folderId: string;
  folders?: Folder[];
}

interface ReorderInfo {
  draggedId: string;
  targetId: string;
  position: 'above' | 'below';
}

function FolderLinksContent({ links: initialLinks, folderId, folders = [] }: FolderLinksProps) {
  const router = useRouter();
  const [view, setView] = useState<'list' | 'card'>('card');
  const [links, setLinks] = useState(initialLinks);
  const pendingReorderRef = useRef<AbortController | null>(null);

  const { isSelectionMode, selectedIds, toggleSelect, enterSelectionMode } = useSelection();

  // Sync with server data when it changes
  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  const handleOpenLink = (link: LinkInstance) => {
    router.push(`/links/${link.canonical.id}`);
  };

  const handleDeleteLink = async (linkId: string) => {
    // Optimistic update - immediately remove from UI
    const previousLinks = links;
    setLinks((currentLinks) => currentLinks.filter((l) => l.id !== linkId));

    try {
      const response = await fetch(`/api/v1/links/${linkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Revert on error
        setLinks(previousLinks);
      }
    } catch (error) {
      console.error('Failed to delete link:', error);
      setLinks(previousLinks);
    }
  };

  const handleAddTag = async (linkId: string, tagName: string) => {
    // Optimistic update with temporary ID
    const tempId = `temp-${Date.now()}`;
    const previousLinks = links;

    setLinks((currentLinks) =>
      currentLinks.map((link) =>
        link.id === linkId
          ? { ...link, tags: [...link.tags, { id: tempId, name: tagName }] }
          : link
      )
    );

    try {
      const response = await fetch(`/api/v1/links/${linkId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName }),
      });

      if (response.ok) {
        // Refresh to get real tag ID
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
    // Optimistic update
    const previousLinks = links;

    setLinks((currentLinks) =>
      currentLinks.map((link) =>
        link.id === linkId
          ? { ...link, tags: link.tags.filter((t) => t.id !== tagId) }
          : link
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

  const handleToggleFavorite = (linkId: string) => {
    // Optimistic update
    setLinks((currentLinks) =>
      currentLinks.map((link) =>
        link.id === linkId
          ? { ...link, is_favorite: !link.is_favorite }
          : link
      )
    );

    // Background API call
    fetch(`/api/v1/links/${linkId}/favorite`, {
      method: 'PUT',
    })
      .then((response) => {
        if (!response.ok) {
          // Revert on error
          setLinks((currentLinks) =>
            currentLinks.map((link) =>
              link.id === linkId
                ? { ...link, is_favorite: !link.is_favorite }
                : link
            )
          );
        }
      })
      .catch((error) => {
        console.error('Failed to toggle favorite:', error);
        // Revert on error
        setLinks((currentLinks) =>
          currentLinks.map((link) =>
            link.id === linkId
              ? { ...link, is_favorite: !link.is_favorite }
              : link
          )
        );
      });
  };

  const handleReorder = ({ draggedId, targetId, position }: ReorderInfo) => {
    // Cancel any pending reorder request
    if (pendingReorderRef.current) {
      pendingReorderRef.current.abort();
    }

    // Optimistic update - immediately reorder in UI
    setLinks((currentLinks) => {
      const draggedIndex = currentLinks.findIndex((l) => l.id === draggedId);
      const targetIndex = currentLinks.findIndex((l) => l.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return currentLinks;

      const newLinks = [...currentLinks];
      const draggedItem = newLinks[draggedIndex];
      if (!draggedItem) return currentLinks;

      newLinks.splice(draggedIndex, 1);

      // Calculate insert index
      let insertIndex = targetIndex;
      if (draggedIndex < targetIndex) {
        // Dragging down - adjust for removed item
        insertIndex = position === 'above' ? targetIndex - 1 : targetIndex;
      } else {
        // Dragging up
        insertIndex = position === 'above' ? targetIndex : targetIndex + 1;
      }

      newLinks.splice(insertIndex, 0, draggedItem);

      // Update positions
      return newLinks.map((link, index) => ({
        ...link,
        position: index,
      }));
    });

    // Background API call
    const abortController = new AbortController();
    pendingReorderRef.current = abortController;

    const targetLink = links.find((l) => l.id === targetId);
    if (!targetLink) return;

    const newPosition = position === 'above' ? targetLink.position : targetLink.position + 1;

    fetch(`/api/v1/links/${draggedId}/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position: newPosition, folderId }),
      signal: abortController.signal,
    })
      .then((response) => {
        if (!response.ok) {
          // Revert on error by refreshing
          router.refresh();
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Failed to reorder link:', error);
          router.refresh();
        }
      });
  };

  // Bulk operation handlers
  const handleBulkDelete = useCallback(async (ids: string[]) => {
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
  }, [links]);

  const handleBulkTag = useCallback(async (ids: string[], tagName: string) => {
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
  }, [links, router]);

  const handleBulkMove = useCallback(async (ids: string[], targetFolderId: string) => {
    const previousLinks = links;
    setLinks((currentLinks) => currentLinks.filter((l) => !ids.includes(l.id)));

    try {
      const response = await fetch('/api/v1/links/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', linkIds: ids, folderId: targetFolderId }),
      });

      if (!response.ok) {
        setLinks(previousLinks);
        throw new Error('Bulk move failed');
      }
    } catch (error) {
      console.error('Bulk move failed:', error);
      setLinks(previousLinks);
      throw error;
    }
  }, [links]);

  const handleBulkFavorite = useCallback(async (ids: string[], favorite: boolean) => {
    const previousLinks = links;

    setLinks((currentLinks) =>
      currentLinks.map((link) =>
        ids.includes(link.id)
          ? { ...link, is_favorite: favorite }
          : link
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
  }, [links]);

  const allLinkIds = links.map((l) => l.id);

  return (
    <div className={isSelectionMode ? 'pb-24' : ''}>
      {/* View toggle & Selection mode */}
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              선택
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
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
        onReorder={handleReorder}
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
export function FolderLinks(props: FolderLinksProps) {
  return (
    <SelectionProvider>
      <FolderLinksContent {...props} />
    </SelectionProvider>
  );
}
