'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Input } from './ui/Input';
import { IconButton } from './ui/IconButton';
import { ConfirmModal } from './ui/ConfirmModal';

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
      if (onDeleteFolder) {
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

    // Reduced padding: 12px per level instead of 16px
    const paddingLeft = depth * 12 + 4;

    return (
      <div key={folder.id}>
        <div
          className={`
            group flex items-center gap-1.5
            rounded-lg px-2 py-1.5
            text-sm transition-colors duration-150 cursor-pointer
            ${isSelected
              ? 'bg-[#059669]/15 text-[#10B981]'
              : 'text-white/70 hover:bg-white/[0.05] hover:text-white'
            }
          `.trim().replace(/\s+/g, ' ')}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => onSelectFolder?.(folder.id)}
        >
          {/* Expand/Collapse button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(folder.id);
            }}
            className={`
              flex items-center justify-center
              w-5 h-5 rounded
              transition-colors duration-150
              ${hasChildren
                ? 'text-white/30 hover:text-white/60 hover:bg-white/[0.08]'
                : 'invisible'
              }
            `.trim().replace(/\s+/g, ' ')}
          >
            <svg
              className={`w-3 h-3 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Folder icon */}
          <svg
            className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-[#10B981]' : 'text-white/40'}`}
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

          {/* Folder name */}
          {isEditing ? (
            <Input
              variant="inline"
              inputSize="sm"
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
              className="flex-1 h-6 py-0"
              autoFocus
            />
          ) : (
            <span
              className="flex-1 truncate"
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleStartEdit(folder);
              }}
            >
              {folder.name}
            </span>
          )}

          {/* Actions */}
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              variant="ghost"
              size="sm"
              label="New subfolder"
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
              onClick={(e) => {
                e.stopPropagation();
                handleStartCreate(folder.id);
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmId(folder.id);
              }}
            />
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="animate-slideDown">
            {folder.children!.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}

        {/* New folder input (when creating inside this folder) */}
        {creatingInFolderId === folder.id && (
          <div
            className="flex items-center gap-1.5 px-2 py-1.5"
            style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
          >
            <div className="w-5" /> {/* Spacer for alignment */}
            <svg
              className="w-4 h-4 flex-shrink-0 text-white/30"
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
              variant="inline"
              inputSize="sm"
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
              className="flex-1 h-6 py-0"
              autoFocus
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-2">
      {/* Header with new folder and manage buttons */}
      <div className="mb-2 px-2 flex items-center gap-1">
        <button
          onClick={() => handleStartCreate(null)}
          className="
            flex items-center gap-2 flex-1
            px-2 py-1.5 rounded-lg
            text-sm text-white/50
            hover:bg-white/[0.05] hover:text-white/70
            transition-colors duration-150
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New folder
        </button>
        <Link
          href="/folders/manage"
          className="
            flex items-center justify-center
            w-7 h-7 rounded-lg
            text-white/50
            hover:bg-white/[0.05] hover:text-white/70
            transition-colors duration-150
          "
          title="Manage folders"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </Link>
      </div>

      {/* Root level new folder input */}
      {creatingInFolderId === null && (
        <div className="mb-2 flex items-center gap-1.5 px-4 py-1.5">
          <svg
            className="w-4 h-4 flex-shrink-0 text-white/30"
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
            variant="inline"
            inputSize="sm"
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
            className="flex-1 h-6 py-0"
            autoFocus
          />
        </div>
      )}

      {/* Folder tree */}
      <div className="space-y-0.5">
        {folders.map((folder) => renderFolder(folder, 0))}
      </div>

      {/* Empty state */}
      {folders.length === 0 && creatingInFolderId === undefined && (
        <div className="px-3 py-8 text-center">
          <p className="text-sm text-white/40">No folders yet.</p>
          <p className="text-xs text-white/30 mt-1">Create one to get started.</p>
        </div>
      )}

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
