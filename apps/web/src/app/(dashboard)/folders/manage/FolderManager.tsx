'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/IconButton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { IconPicker, FolderIcon } from '@/components/ui/IconPicker';
import { Toast } from '@/components/ui/Toast';
import { useLocale } from '@/components/LanguageProvider';

interface Folder {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  position: number;
  children?: Folder[];
}

interface FolderManagerProps {
  initialFolders: Folder[];
}

export function FolderManager({ initialFolders }: FolderManagerProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [folders, setFolders] = useState(initialFolders);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [hasReorderChanges, setHasReorderChanges] = useState(false);
  const hasReorderChangesRef = useRef(false);
  const initialFoldersRef = useRef(initialFolders);

  // Keep ref in sync with state
  useEffect(() => {
    hasReorderChangesRef.current = hasReorderChanges;
  }, [hasReorderChanges]);

  // Sync with server data when it changes
  useEffect(() => {
    setFolders(initialFolders);
    initialFoldersRef.current = initialFolders;
    setHasReorderChanges(false);
  }, [initialFolders]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [iconPickerFolderId, setIconPickerFolderId] = useState<string | null>(null);
  const [creatingInFolderId, setCreatingInFolderId] = useState<string | null | undefined>(
    undefined
  );
  const [newFolderName, setNewFolderName] = useState('');
  const [draggedFolder, setDraggedFolder] = useState<Folder | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: 'above' | 'below' | 'inside';
  } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    folderIds: string[];
    timeoutId: ReturnType<typeof setTimeout>;
    removedFolders: Folder[];
  } | null>(null);
  const pendingDeleteRef = useRef(pendingDelete);
  pendingDeleteRef.current = pendingDelete;

  // Flush pending delete: execute the actual API calls
  const flushPendingDelete = useCallback(
    async (pending: NonNullable<typeof pendingDelete>) => {
      clearTimeout(pending.timeoutId);
      setPendingDelete(null);
      try {
        for (const folderId of pending.folderIds) {
          await fetch(`/api/v1/folders/${folderId}`, { method: 'DELETE' });
        }
        router.refresh();
      } catch (error) {
        console.error('Failed to delete folders:', error);
      }
    },
    [router]
  );

  // Flush pending deletes + warn on unsaved reorder changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const pending = pendingDeleteRef.current;
      if (pending) {
        clearTimeout(pending.timeoutId);
        for (const folderId of pending.folderIds) {
          navigator.sendBeacon(`/api/v1/folders/${folderId}?_method=DELETE`, '');
        }
      }
      if (hasReorderChangesRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Collect all folder ids from a tree (folder + descendants)
  const collectFolderIds = useCallback((folder: Folder): string[] => {
    const ids = [folder.id];
    if (folder.children) {
      for (const child of folder.children) {
        ids.push(...collectFolderIds(child));
      }
    }
    return ids;
  }, []);

  // Find and remove folders by ids from a tree, returning removed folders
  const removeFoldersFromTree = useCallback(
    (tree: Folder[], idsToRemove: Set<string>): { remaining: Folder[]; removed: Folder[] } => {
      const remaining: Folder[] = [];
      const removed: Folder[] = [];
      for (const folder of tree) {
        if (idsToRemove.has(folder.id)) {
          removed.push(folder);
        } else {
          const childResult = folder.children
            ? removeFoldersFromTree(folder.children, idsToRemove)
            : { remaining: [], removed: [] };
          remaining.push({
            ...folder,
            children:
              childResult.remaining.length > 0
                ? childResult.remaining
                : folder.children &&
                    childResult.remaining.length === 0 &&
                    childResult.removed.length > 0
                  ? []
                  : folder.children,
          });
          removed.push(...childResult.removed);
        }
      }
      return { remaining, removed };
    },
    []
  );

  // Restore folders back into tree
  const restoreFoldersToTree = useCallback(
    (tree: Folder[], foldersToRestore: Folder[]): Folder[] => {
      // Separate root-level and child folders
      const rootFolders = foldersToRestore.filter((f) => f.parent_id === null);
      const childFolders = foldersToRestore.filter((f) => f.parent_id !== null);

      // First restore root folders
      let result = [...tree, ...rootFolders];

      // Then restore child folders into their parents
      if (childFolders.length > 0) {
        const childByParent = new Map<string, Folder[]>();
        for (const f of childFolders) {
          const list = childByParent.get(f.parent_id!) ?? [];
          list.push(f);
          childByParent.set(f.parent_id!, list);
        }

        const insertChildren = (folders: Folder[]): Folder[] =>
          folders.map((folder) => {
            const toInsert = childByParent.get(folder.id);
            const updatedChildren = folder.children ? insertChildren(folder.children) : [];
            if (toInsert) {
              return { ...folder, children: [...updatedChildren, ...toInsert] };
            }
            return folder.children ? { ...folder, children: updatedChildren } : folder;
          });

        result = insertChildren(result);
      }

      // Sort by position
      const sortByPosition = (folders: Folder[]): Folder[] =>
        folders
          .map((f) => (f.children ? { ...f, children: sortByPosition(f.children) } : f))
          .sort((a, b) => a.position - b.position);

      return sortByPosition(result);
    },
    []
  );

  // Schedule delete with undo toast
  const scheduleDelete = useCallback(
    async (folderIds: string[]) => {
      // If there's already a pending delete, flush it immediately
      if (pendingDeleteRef.current) {
        await flushPendingDelete(pendingDeleteRef.current);
      }

      const idsToRemove = new Set(folderIds);
      const { remaining, removed } = removeFoldersFromTree(folders, idsToRemove);

      setFolders(remaining);
      setSelectedFolders(new Set());

      const timeoutId = setTimeout(() => {
        const pending = pendingDeleteRef.current;
        if (pending) {
          flushPendingDelete(pending);
        }
      }, 5000);

      setPendingDelete({ folderIds, timeoutId, removedFolders: removed });
    },
    [folders, flushPendingDelete, removeFoldersFromTree]
  );

  const handleUndoDelete = useCallback(() => {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timeoutId);
    setFolders((prev) => restoreFoldersToTree(prev, pendingDelete.removedFolders));
    setPendingDelete(null);
  }, [pendingDelete, restoreFoldersToTree]);

  const toggleExpand = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleStartEdit = useCallback((folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditingName(folder.name);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingFolderId || !editingName.trim()) {
      setEditingFolderId(null);
      setEditingName('');
      return;
    }

    try {
      const response = await fetch(`/api/v1/folders/${editingFolderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }

    setEditingFolderId(null);
    setEditingName('');
  }, [editingFolderId, editingName, router]);

  const handleUpdateIcon = useCallback(
    async (folderId: string, icon: string | null) => {
      try {
        const response = await fetch(`/api/v1/folders/${folderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ icon }),
        });

        if (response.ok) {
          router.refresh();
        }
      } catch (error) {
        console.error('Failed to update folder icon:', error);
      }
    },
    [router]
  );

  const handleStartCreate = useCallback((parentId: string | null) => {
    setCreatingInFolderId(parentId);
    setNewFolderName('');
    if (parentId) {
      setExpandedFolders((prev) => new Set([...prev, parentId]));
    }
  }, []);

  const handleSaveCreate = useCallback(async () => {
    if (!newFolderName.trim()) {
      setCreatingInFolderId(undefined);
      setNewFolderName('');
      return;
    }

    try {
      const response = await fetch('/api/v1/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: creatingInFolderId ?? null,
        }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }

    setCreatingInFolderId(undefined);
    setNewFolderName('');
  }, [newFolderName, creatingInFolderId, router]);

  const handleDelete = useCallback(
    (folderId: string) => {
      scheduleDelete([folderId]);
    },
    [scheduleDelete]
  );

  const toggleSelect = useCallback((folderId: string) => {
    setSelectedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    setBulkDeleteConfirm(false);
    scheduleDelete([...selectedFolders]);
  }, [selectedFolders, scheduleDelete]);

  const selectMode = selectedFolders.size > 0;

  const handleDragStart = (e: React.DragEvent, folder: Folder) => {
    setDraggedFolder(folder);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, folder: Folder) => {
    e.preventDefault();
    if (!draggedFolder || draggedFolder.id === folder.id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    let position: 'above' | 'below' | 'inside';
    if (y < height * 0.25) {
      position = 'above';
    } else if (y > height * 0.75) {
      position = 'below';
    } else {
      position = 'inside';
    }

    setDropTarget({ id: folder.id, position });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  // Check if targetId is a descendant of folder
  const isDescendant = (folder: Folder, targetId: string): boolean => {
    if (!folder.children) return false;
    for (const child of folder.children) {
      if (child.id === targetId) return true;
      if (isDescendant(child, targetId)) return true;
    }
    return false;
  };

  // Helper: remove a folder from tree by id and return the removed folder
  const removeFolderFromTree = (
    tree: Folder[],
    folderId: string
  ): { tree: Folder[]; removed: Folder | null } => {
    let removed: Folder | null = null;
    const filter = (items: Folder[]): Folder[] =>
      items.reduce<Folder[]>((acc, f) => {
        if (f.id === folderId) {
          removed = f;
          return acc;
        }
        const newChildren = f.children ? filter(f.children) : undefined;
        acc.push({ ...f, children: newChildren });
        return acc;
      }, []);
    return { tree: filter(tree), removed };
  };

  // Helper: insert a folder into tree at a specific position
  const insertFolderInTree = (
    tree: Folder[],
    folder: Folder,
    targetId: string,
    position: 'above' | 'below' | 'inside'
  ): Folder[] => {
    if (position === 'inside') {
      return tree.map((f) => {
        if (f.id === targetId) {
          const children = f.children
            ? [...f.children, { ...folder, parent_id: f.id }]
            : [{ ...folder, parent_id: f.id }];
          return { ...f, children };
        }
        return f.children
          ? { ...f, children: insertFolderInTree(f.children, folder, targetId, position) }
          : f;
      });
    }
    // above or below
    const insertInLevel = (items: Folder[]): { items: Folder[]; inserted: boolean } => {
      const out: Folder[] = [];
      let inserted = false;
      for (const f of items) {
        if (f.id === targetId) {
          inserted = true;
          if (position === 'above') {
            out.push({ ...folder, parent_id: f.parent_id });
            out.push(f);
          } else {
            out.push(f);
            out.push({ ...folder, parent_id: f.parent_id });
          }
        } else {
          out.push(f);
        }
      }
      return { items: out, inserted };
    };

    const { items: topLevel, inserted } = insertInLevel(tree);
    if (inserted) return topLevel;
    // Not found at this level, recurse
    return tree.map((f) =>
      f.children
        ? { ...f, children: insertFolderInTree(f.children, folder, targetId, position) }
        : f
    );
  };

  // Helper: reassign position numbers in tree
  const reassignPositions = (tree: Folder[]): Folder[] =>
    tree.map((f, i) => ({
      ...f,
      position: i,
      children: f.children ? reassignPositions(f.children) : undefined,
    }));

  // Helper: flatten tree into list of { id, parent_id, position }
  const flattenTree = (
    tree: Folder[]
  ): { id: string; parent_id: string | null; position: number }[] => {
    const result: { id: string; parent_id: string | null; position: number }[] = [];
    for (const f of tree) {
      result.push({ id: f.id, parent_id: f.parent_id, position: f.position });
      if (f.children) result.push(...flattenTree(f.children));
    }
    return result;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedFolder || !dropTarget) return;

    if (draggedFolder.id === dropTarget.id) {
      setDraggedFolder(null);
      setDropTarget(null);
      return;
    }

    if (isDescendant(draggedFolder, dropTarget.id)) {
      setDraggedFolder(null);
      setDropTarget(null);
      return;
    }

    // Remove dragged folder from current position
    const { tree: treeWithout, removed } = removeFolderFromTree(folders, draggedFolder.id);
    if (!removed) {
      setDraggedFolder(null);
      setDropTarget(null);
      return;
    }

    // Insert at new position (strip children of the moved folder to keep them intact)
    const movedFolder = { ...removed };
    const newTree = insertFolderInTree(
      treeWithout,
      movedFolder,
      dropTarget.id,
      dropTarget.position
    );
    const reindexed = reassignPositions(newTree);

    setFolders(reindexed);
    setHasReorderChanges(true);
    setDraggedFolder(null);
    setDropTarget(null);

    // Auto-expand target folder when dropping inside
    if (dropTarget.position === 'inside') {
      setExpandedFolders((prev) => new Set([...prev, dropTarget.id]));
    }
  };

  const handleSaveReorder = async () => {
    setReordering(true);
    try {
      const currentFlat = flattenTree(folders);
      const initialFlat = flattenTree(initialFoldersRef.current);
      const initialMap = new Map(initialFlat.map((f) => [f.id, f]));

      // Find changed folders
      const changes = currentFlat.filter((f) => {
        const orig = initialMap.get(f.id);
        if (!orig) return true;
        return orig.parent_id !== f.parent_id || orig.position !== f.position;
      });

      // Send PATCH for each changed folder
      await Promise.all(
        changes.map((f) =>
          fetch(`/api/v1/folders/${f.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parentId: f.parent_id, position: f.position }),
          })
        )
      );

      initialFoldersRef.current = folders;
      setHasReorderChanges(false);
      router.refresh();
    } catch (error) {
      console.error('Failed to save reorder:', error);
    } finally {
      setReordering(false);
    }
  };

  const handleDiscardReorder = () => {
    setFolders(initialFoldersRef.current);
    setHasReorderChanges(false);
  };

  const handleDragEnd = () => {
    setDraggedFolder(null);
    setDropTarget(null);
  };

  const renderFolder = (folder: Folder, depth: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isEditing = editingFolderId === folder.id;
    const isDragging = draggedFolder?.id === folder.id;
    const isDropTarget = dropTarget?.id === folder.id;

    return (
      <div key={folder.id} className="relative">
        {/* Drop indicator - above */}
        {isDropTarget && dropTarget.position === 'above' && (
          <div
            className="absolute left-0 right-0 h-0.5 bg-primary -top-0.5 z-10"
            style={{ marginLeft: `${depth * 24}px` }}
          />
        )}

        <div
          draggable
          onDragStart={(e) => handleDragStart(e, folder)}
          onDragOver={(e) => handleDragOver(e, folder)}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onClick={(e) => {
            // Only toggle if the click target is the row itself, not interactive children
            const target = e.target as HTMLElement;
            if (!target.closest('button, input, a')) {
              toggleSelect(folder.id);
            }
          }}
          className={`
            group flex items-center gap-2 cursor-pointer
            rounded-lg px-3 py-2.5
            text-sm transition-colors duration-150
            ${isDragging ? 'opacity-50' : ''}
            ${
              selectedFolders.has(folder.id)
                ? 'bg-primary/5'
                : isDropTarget && dropTarget.position === 'inside'
                  ? 'bg-primary/10 ring-2 ring-primary/30'
                  : 'hover:bg-hover'
            }
          `
            .trim()
            .replace(/\s+/g, ' ')}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={selectedFolders.has(folder.id)}
            onChange={() => toggleSelect(folder.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer flex-shrink-0"
          />

          {/* Drag handle */}
          <div className="cursor-grab text-foreground-muted/50 hover:text-foreground-muted">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
            </svg>
          </div>

          {/* Expand/Collapse button */}
          <button
            onClick={() => toggleExpand(folder.id)}
            className={`
              flex items-center justify-center
              w-6 h-6 rounded
              transition-colors duration-150
              ${
                hasChildren
                  ? 'text-foreground-muted hover:text-foreground hover:bg-hover'
                  : 'invisible'
              }
            `
              .trim()
              .replace(/\s+/g, ' ')}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Folder icon - clickable to change */}
          <div className="relative">
            <button
              onClick={() =>
                setIconPickerFolderId(iconPickerFolderId === folder.id ? null : folder.id)
              }
              className="flex items-center justify-center w-6 h-6 rounded hover:bg-hover transition-colors"
              title={t('folderManager.changeIcon')}
            >
              <FolderIcon icon={folder.icon} isExpanded={isExpanded} editable />
            </button>
            {iconPickerFolderId === folder.id && (
              <div className="absolute top-8 left-0">
                <IconPicker
                  value={folder.icon}
                  onChange={(icon) => handleUpdateIcon(folder.id, icon)}
                  onClose={() => setIconPickerFolderId(null)}
                />
              </div>
            )}
          </div>

          {/* Folder name */}
          {isEditing ? (
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') {
                  setEditingFolderId(null);
                  setEditingName('');
                }
              }}
              className="flex-1 h-8"
              autoFocus
            />
          ) : (
            <span className="flex-1 text-foreground" onDoubleClick={() => handleStartEdit(folder)}>
              {folder.name}
            </span>
          )}

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              variant="ghost"
              size="sm"
              label={t('folderManager.newSubfolder')}
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
              onClick={() => handleStartCreate(folder.id)}
            />
            <IconButton
              variant="ghost"
              size="sm"
              label={t('folderManager.rename')}
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              }
              onClick={() => handleStartEdit(folder)}
            />
            <IconButton
              variant="danger"
              size="sm"
              label={t('folderManager.deleteFolder')}
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              }
              onClick={() => setDeleteConfirmId(folder.id)}
            />
          </div>
        </div>

        {/* Drop indicator - below */}
        {isDropTarget && dropTarget.position === 'below' && (
          <div
            className="absolute left-0 right-0 h-0.5 bg-primary -bottom-0.5 z-10"
            style={{ marginLeft: `${depth * 24}px` }}
          />
        )}

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>{folder.children!.map((child) => renderFolder(child, depth + 1))}</div>
        )}

        {/* New folder input (when creating inside this folder) */}
        {creatingInFolderId === folder.id && (
          <div
            className="flex items-center gap-2 px-3 py-2.5"
            style={{ paddingLeft: `${(depth + 1) * 24 + 12}px` }}
          >
            <div className="w-4" />
            <div className="w-6" />
            <svg
              className="w-5 h-5 flex-shrink-0 text-foreground-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => {
                if (newFolderName.trim()) handleSaveCreate();
                else setCreatingInFolderId(undefined);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveCreate();
                if (e.key === 'Escape') setCreatingInFolderId(undefined);
              }}
              placeholder={t('folderManager.newFolderPlaceholder')}
              className="flex-1 h-8"
              autoFocus
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleStartCreate(null)}
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            {t('folderManager.newFolder')}
          </Button>
          {selectMode && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setBulkDeleteConfirm(true)}
              icon={
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              }
            >
              {t('folderManager.deleteFolders', { count: selectedFolders.size })}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectMode && (
            <Button variant="secondary" size="sm" onClick={() => setSelectedFolders(new Set())}>
              {t('common.cancel')}
            </Button>
          )}
          {hasReorderChanges && (
            <>
              <Button variant="secondary" size="sm" onClick={handleDiscardReorder}>
                {t('common.undo')}
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveReorder}>
                {t('folderManager.saveOrder')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Root level new folder input */}
      {creatingInFolderId === null && (
        <div className="flex items-center gap-2 px-3 py-2.5 mb-2 rounded-lg bg-surface border border-border">
          <div className="w-4" />
          <div className="w-6" />
          <svg
            className="w-5 h-5 flex-shrink-0 text-foreground-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={() => {
              if (newFolderName.trim()) handleSaveCreate();
              else setCreatingInFolderId(undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveCreate();
              if (e.key === 'Escape') setCreatingInFolderId(undefined);
            }}
            placeholder={t('folderManager.newFolderPlaceholder')}
            className="flex-1 h-8"
            autoFocus
          />
        </div>
      )}

      {/* Folder tree */}
      <div className="relative rounded-xl border border-border bg-surface divide-y divide-border">
        {reordering && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/70 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t('common.saving')}
            </div>
          </div>
        )}
        {folders.length > 0 ? (
          folders.map((folder) => renderFolder(folder, 0))
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-primary-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <p className="text-foreground-muted mb-1">{t('folderManager.noFolders')}</p>
            <p className="text-sm text-foreground-muted/60">{t('folderManager.noFoldersDesc')}</p>
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-4 text-sm text-foreground-muted">
        <p>{t('folderManager.dragTip')}</p>
        <p>{t('folderManager.renameTip')}</p>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) handleDelete(deleteConfirmId);
        }}
        title={t('folderManager.deleteFolder')}
        message={t('folderManager.deleteConfirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
      />

      {/* Bulk delete confirmation modal */}
      <ConfirmModal
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={t('folderManager.deleteFolders', { count: selectedFolders.size })}
        message={t('folderManager.deleteFoldersConfirm', { count: selectedFolders.size })}
        confirmText={t('folderManager.deleteAll')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
      />

      {/* Undo delete toast */}
      {pendingDelete && (
        <Toast
          message={
            pendingDelete.folderIds.length === 1
              ? t('folderManager.folderDeleted')
              : t('folderManager.foldersDeleted', { count: pendingDelete.folderIds.length })
          }
          action={{ label: t('common.undo'), onClick: handleUndoDelete }}
          onDismiss={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
