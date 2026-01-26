'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from './ui/Modal';
import { Button } from './ui/Button';

interface Folder {
  id: string;
  name: string;
  children?: Folder[];
}

interface FolderSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string, folderName: string) => void;
  folders: Folder[];
  selectedFolderId?: string;
  title?: string;
}

export function FolderSelectModal({
  isOpen,
  onClose,
  onSelect,
  folders,
  selectedFolderId: initialSelectedId,
  title = 'Select Folder',
}: FolderSelectModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Find path to a folder
  const findFolderPath = (tree: Folder[], targetId: string, path: string[] = []): string[] | null => {
    for (const folder of tree) {
      if (folder.id === targetId) {
        return [...path, folder.id];
      }
      if (folder.children) {
        const found = findFolderPath(folder.children, targetId, [...path, folder.id]);
        if (found) return found;
      }
    }
    return null;
  };

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedId(initialSelectedId || null);
      // Auto-expand to show selected folder
      if (initialSelectedId) {
        const path = findFolderPath(folders, initialSelectedId);
        if (path) {
          setExpandedIds(new Set(path.slice(0, -1)));
        }
      }
    }
  }, [isOpen, initialSelectedId, folders]);

  // Find folder name by ID
  const findFolderName = (tree: Folder[], targetId: string): string | null => {
    for (const folder of tree) {
      if (folder.id === targetId) return folder.name;
      if (folder.children) {
        const found = findFolderName(folder.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleExpand = (folderId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selectedId) {
      const name = findFolderName(folders, selectedId);
      if (name) {
        onSelect(selectedId, name);
        onClose();
      }
    }
  };

  const renderFolder = (folder: Folder, depth: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedIds.has(folder.id);
    const isSelected = selectedId === folder.id;

    return (
      <div key={folder.id}>
        <div
          onClick={() => setSelectedId(folder.id)}
          className={`
            group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
            transition-all duration-150
            ${isSelected
              ? 'bg-primary/10 text-primary-light ring-1 ring-primary/30'
              : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
            }
          `}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          {/* Expand button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(folder.id);
            }}
            className={`
              flex items-center justify-center w-5 h-5 rounded
              transition-colors
              ${hasChildren
                ? 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'
                : 'invisible'
              }
            `}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
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
            className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-primary-light' : 'text-foreground-muted'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
            />
          </svg>

          {/* Folder name */}
          <span className="flex-1 truncate text-sm font-medium">{folder.name}</span>

          {/* Selected indicator */}
          {isSelected && (
            <svg className="w-4 h-4 text-primary-light flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="animate-in slide-in-from-top-1 duration-150">
            {folder.children!.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="max-h-80 overflow-y-auto -mx-1 px-1">
        {folders.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-foreground-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <p className="text-foreground-muted text-sm">No folders yet</p>
            <p className="text-foreground-faint text-xs mt-1">Create folders from the sidebar</p>
          </div>
        ) : (
          <div className="space-y-0.5 py-1">
            {folders.map((folder) => renderFolder(folder))}
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirm}
          disabled={!selectedId}
        >
          Select
        </Button>
      </ModalFooter>
    </Modal>
  );
}
