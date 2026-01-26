'use client';

import { useState, useCallback, useEffect } from 'react';
import { Modal, ModalFooter } from './ui/Modal';
import { Button } from './ui/Button';

interface Folder {
  id: string;
  name: string;
  children?: Folder[];
}

interface FolderMultiSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  folders: Folder[];
  selectedIds: string[];
  title?: string;
}

export function FolderMultiSelectModal({
  isOpen,
  onClose,
  onConfirm,
  folders,
  selectedIds: initialSelectedIds,
  title = 'Select Folders',
}: FolderMultiSelectModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Reset selection when modal opens with new initial values
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initialSelectedIds));
      // Auto-expand folders that have selected children
      const toExpand = new Set<string>();
      const findParentsOfSelected = (tree: Folder[], parentPath: string[] = []) => {
        for (const folder of tree) {
          const currentPath = [...parentPath, folder.id];
          if (initialSelectedIds.includes(folder.id)) {
            parentPath.forEach(id => toExpand.add(id));
          }
          if (folder.children) {
            findParentsOfSelected(folder.children, currentPath);
          }
        }
      };
      findParentsOfSelected(folders);
      setExpandedIds(toExpand);
    }
  }, [isOpen, initialSelectedIds, folders]);

  // Get all descendant IDs of a folder
  const getAllDescendantIds = useCallback((folder: Folder): string[] => {
    const ids: string[] = [];
    if (folder.children) {
      for (const child of folder.children) {
        ids.push(child.id);
        ids.push(...getAllDescendantIds(child));
      }
    }
    return ids;
  }, []);

  // Check if all descendants are selected
  const areAllDescendantsSelected = useCallback((folder: Folder, selected: Set<string>): boolean => {
    if (!folder.children || folder.children.length === 0) return true;
    return folder.children.every(child =>
      selected.has(child.id) && areAllDescendantsSelected(child, selected)
    );
  }, []);

  // Check if some (but not all) descendants are selected
  const areSomeDescendantsSelected = useCallback((folder: Folder, selected: Set<string>): boolean => {
    if (!folder.children || folder.children.length === 0) return false;
    const hasSelectedChild = folder.children.some(child =>
      selected.has(child.id) || areSomeDescendantsSelected(child, selected)
    );
    return hasSelectedChild && !areAllDescendantsSelected(folder, selected);
  }, [areAllDescendantsSelected]);

  // Toggle folder selection
  const toggleFolder = useCallback((folder: Folder) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const isCurrentlySelected = next.has(folder.id);
      const descendantIds = getAllDescendantIds(folder);

      if (isCurrentlySelected) {
        // Deselect this folder and all descendants
        next.delete(folder.id);
        descendantIds.forEach(id => next.delete(id));
      } else {
        // Select this folder and all descendants
        next.add(folder.id);
        descendantIds.forEach(id => next.add(id));
      }

      return next;
    });
  }, [getAllDescendantIds]);

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
    onConfirm(Array.from(selectedIds));
    onClose();
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  const renderFolder = (folder: Folder, depth: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedIds.has(folder.id);
    const isSelected = selectedIds.has(folder.id);
    const isIndeterminate = !isSelected && areSomeDescendantsSelected(folder, selectedIds);

    return (
      <div key={folder.id}>
        <div
          className={`
            group flex items-center gap-2 px-3 py-2 rounded-lg
            transition-all duration-150
            hover:bg-surface-hover
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
              transition-colors cursor-pointer
              ${hasChildren
                ? 'text-foreground-muted hover:text-foreground hover:bg-surface-active'
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

          {/* Checkbox */}
          <button
            type="button"
            onClick={() => toggleFolder(folder)}
            className={`
              flex items-center justify-center w-5 h-5 rounded border-2
              transition-all duration-150 cursor-pointer
              ${isSelected
                ? 'bg-primary border-primary'
                : isIndeterminate
                  ? 'bg-primary/50 border-primary/50'
                  : 'border-foreground-muted hover:border-primary'
              }
            `}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {isIndeterminate && !isSelected && (
              <div className="w-2 h-0.5 bg-white rounded" />
            )}
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
          <span
            onClick={() => toggleFolder(folder)}
            className={`
              flex-1 truncate text-sm font-medium cursor-pointer
              ${isSelected ? 'text-primary-light' : 'text-foreground-secondary'}
            `}
          >
            {folder.name}
          </span>
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

  const selectedCount = selectedIds.size;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      {/* Header with count and clear */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
        <span className="text-sm text-foreground-muted">
          {selectedCount > 0 ? (
            <><span className="font-medium text-foreground">{selectedCount}</span> folders selected</>
          ) : (
            'No folders selected'
          )}
        </span>
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto -mx-1 px-1">
        {folders.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-foreground-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <p className="text-foreground-muted text-sm">No folders yet</p>
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
        >
          Apply
        </Button>
      </ModalFooter>
    </Modal>
  );
}
