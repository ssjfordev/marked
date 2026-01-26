'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/IconButton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { IconPicker, FolderIcon } from '@/components/ui/IconPicker';

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
  const [folders, setFolders] = useState(initialFolders);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Sync with server data when it changes
  useEffect(() => {
    setFolders(initialFolders);
  }, [initialFolders]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [iconPickerFolderId, setIconPickerFolderId] = useState<string | null>(null);
  const [creatingInFolderId, setCreatingInFolderId] = useState<string | null | undefined>(undefined);
  const [newFolderName, setNewFolderName] = useState('');
  const [draggedFolder, setDraggedFolder] = useState<Folder | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'above' | 'below' | 'inside' } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const handleUpdateIcon = useCallback(async (folderId: string, icon: string | null) => {
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
  }, [router]);

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

  const handleDelete = useCallback(async (folderId: string) => {
    try {
      const response = await fetch(`/api/v1/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  }, [router]);

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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedFolder || !dropTarget) return;

    // Don't drop on itself
    if (draggedFolder.id === dropTarget.id) {
      setDraggedFolder(null);
      setDropTarget(null);
      return;
    }

    // Don't drop a parent folder into its own descendant (circular reference)
    if (isDescendant(draggedFolder, dropTarget.id)) {
      console.warn('Cannot move a folder into its own descendant');
      setDraggedFolder(null);
      setDropTarget(null);
      return;
    }

    try {
      if (dropTarget.position === 'inside') {
        // Move into folder as child
        await fetch(`/api/v1/folders/${draggedFolder.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentId: dropTarget.id }),
        });
      } else {
        // Find target folder to get its parent and position
        const findFolder = (folders: Folder[], id: string): Folder | null => {
          for (const f of folders) {
            if (f.id === id) return f;
            if (f.children) {
              const found = findFolder(f.children, id);
              if (found) return found;
            }
          }
          return null;
        };

        const targetFolder = findFolder(folders, dropTarget.id);
        if (targetFolder) {
          const newParentId = targetFolder.parent_id;
          const newPosition = dropTarget.position === 'above'
            ? targetFolder.position
            : targetFolder.position + 1;

          await fetch(`/api/v1/folders/${draggedFolder.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parentId: newParentId, position: newPosition }),
          });
        }
      }

      router.refresh();
    } catch (error) {
      console.error('Failed to move folder:', error);
    }

    setDraggedFolder(null);
    setDropTarget(null);
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
          className={`
            group flex items-center gap-2
            rounded-lg px-3 py-2.5
            text-sm transition-colors duration-150
            ${isDragging ? 'opacity-50' : ''}
            ${isDropTarget && dropTarget.position === 'inside'
              ? 'bg-primary/10 ring-2 ring-primary/30'
              : 'hover:bg-hover'
            }
          `.trim().replace(/\s+/g, ' ')}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          {/* Drag handle */}
          <div className="cursor-grab text-foreground-muted/50 hover:text-foreground-muted">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
              ${hasChildren
                ? 'text-foreground-muted hover:text-foreground hover:bg-hover'
                : 'invisible'
              }
            `.trim().replace(/\s+/g, ' ')}
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
              onClick={() => setIconPickerFolderId(iconPickerFolderId === folder.id ? null : folder.id)}
              className="flex items-center justify-center w-6 h-6 rounded hover:bg-hover transition-colors"
              title="아이콘 변경"
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
            <span
              className="flex-1 text-foreground"
              onDoubleClick={() => handleStartEdit(folder)}
            >
              {folder.name}
            </span>
          )}

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              variant="ghost"
              size="sm"
              label="New subfolder"
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
              label="Rename"
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              }
              onClick={() => handleStartEdit(folder)}
            />
            <IconButton
              variant="danger"
              size="sm"
              label="Delete folder"
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
          <div>
            {folder.children!.map((child) => renderFolder(child, depth + 1))}
          </div>
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
              placeholder="New folder name"
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
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleStartCreate(null)}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          New Folder
        </Button>

        <Link href="/dashboard">
          <Button variant="secondary" size="sm">
            Done
          </Button>
        </Link>
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
            placeholder="New folder name"
            className="flex-1 h-8"
            autoFocus
          />
        </div>
      )}

      {/* Folder tree */}
      <div className="rounded-xl border border-border bg-surface divide-y divide-border">
        {folders.length > 0 ? (
          folders.map((folder) => renderFolder(folder, 0))
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-foreground-muted mb-1">No folders yet</p>
            <p className="text-sm text-foreground-muted/60">
              Create your first folder to organize your links.
            </p>
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-4 text-sm text-foreground-muted">
        <p>• Drag folders to reorder or nest them</p>
        <p>• Double-click a folder name to rename it</p>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) handleDelete(deleteConfirmId);
        }}
        title="Delete folder"
        message="Delete this folder and all its contents?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />

    </div>
  );
}
