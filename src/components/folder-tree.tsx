'use client';

import { useState, useCallback } from 'react';

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  position: number;
  children?: Folder[];
}

interface FolderTreeProps {
  folders: Folder[];
  selectedFolderId?: string | null;
  onSelectFolder?: (folderId: string) => void;
  onCreateFolder?: (name: string, parentId: string | null) => Promise<void>;
  onRenameFolder?: (folderId: string, newName: string) => Promise<void>;
  onDeleteFolder?: (folderId: string) => Promise<void>;
  onMoveFolder?: (folderId: string, newParentId: string | null) => Promise<void>;
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [creatingInFolderId, setCreatingInFolderId] = useState<string | null | undefined>(
    undefined
  );
  const [newFolderName, setNewFolderName] = useState('');

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
    if (editingFolderId && editingName.trim() && onRenameFolder) {
      await onRenameFolder(editingFolderId, editingName.trim());
    }
    setEditingFolderId(null);
    setEditingName('');
  }, [editingFolderId, editingName, onRenameFolder]);

  const handleStartCreate = useCallback((parentId: string | null) => {
    setCreatingInFolderId(parentId);
    setNewFolderName('');
    // Expand parent if creating in a folder
    if (parentId) {
      setExpandedFolders((prev) => new Set([...prev, parentId]));
    }
  }, []);

  const handleSaveCreate = useCallback(async () => {
    if (newFolderName.trim() && onCreateFolder) {
      await onCreateFolder(newFolderName.trim(), creatingInFolderId ?? null);
    }
    setCreatingInFolderId(undefined);
    setNewFolderName('');
  }, [newFolderName, creatingInFolderId, onCreateFolder]);

  const handleDelete = useCallback(
    async (folderId: string) => {
      if (onDeleteFolder && confirm('Delete this folder and all its contents?')) {
        await onDeleteFolder(folderId);
      }
    },
    [onDeleteFolder]
  );

  const renderFolder = (folder: Folder, depth: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isEditing = editingFolderId === folder.id;

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

          {/* Folder name */}
          {isEditing ? (
            <input
              type="text"
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
              className="flex-1 rounded border px-1 py-0.5 text-sm"
              autoFocus
            />
          ) : (
            <span
              className="flex-1 cursor-pointer truncate"
              onClick={() => onSelectFolder?.(folder.id)}
              onDoubleClick={() => handleStartEdit(folder)}
            >
              {folder.name}
            </span>
          )}

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100">
            <button
              onClick={() => handleStartCreate(folder.id)}
              className="rounded p-1 hover:bg-gray-200"
              title="New subfolder"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(folder.id)}
              className="rounded p-1 hover:bg-red-100 hover:text-red-600"
              title="Delete folder"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>{folder.children!.map((child) => renderFolder(child, depth + 1))}</div>
        )}

        {/* New folder input (when creating inside this folder) */}
        {creatingInFolderId === folder.id && (
          <div
            className="flex items-center gap-1 px-2 py-1.5"
            style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
          >
            <svg
              className="h-4 w-4 flex-shrink-0 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <input
              type="text"
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
              className="flex-1 rounded border px-2 py-0.5 text-sm"
              autoFocus
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-2">
      {/* Root level new folder button */}
      <div className="mb-2 px-2">
        <button
          onClick={() => handleStartCreate(null)}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New folder
        </button>
      </div>

      {/* Root level new folder input */}
      {creatingInFolderId === null && (
        <div className="mb-2 flex items-center gap-1 px-4 py-1.5">
          <svg
            className="h-4 w-4 flex-shrink-0 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <input
            type="text"
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
            className="flex-1 rounded border px-2 py-0.5 text-sm"
            autoFocus
          />
        </div>
      )}

      {/* Folder tree */}
      {folders.map((folder) => renderFolder(folder, 0))}

      {/* Empty state */}
      {folders.length === 0 && creatingInFolderId === undefined && (
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          No folders yet. Create one to get started.
        </div>
      )}
    </div>
  );
}
