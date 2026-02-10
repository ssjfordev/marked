'use client';

import { useState, useCallback } from 'react';
import { useLocale } from '@/components/LanguageProvider';

export interface FolderWithCount {
  id: string;
  name: string;
  linkCount: number; // Direct links in this folder
  totalLinkCount: number; // Including children
  children: FolderWithCount[];
}

interface FolderSelectTreeProps {
  folders: FolderWithCount[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export function FolderSelectTree({
  folders,
  selectedIds,
  onSelectionChange,
}: FolderSelectTreeProps) {
  const { t } = useLocale();
  // Track expanded folders
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Initially expand all root folders
    return new Set(folders.map((f) => f.id));
  });

  // Get all folder IDs for "select all" functionality
  const getAllFolderIds = useCallback((folderList: FolderWithCount[]): string[] => {
    const ids: string[] = [];
    for (const folder of folderList) {
      ids.push(folder.id);
      if (folder.children.length > 0) {
        ids.push(...getAllFolderIds(folder.children));
      }
    }
    return ids;
  }, []);

  // Get all descendant IDs for a folder
  const getDescendantIds = useCallback((folder: FolderWithCount): string[] => {
    const ids: string[] = [];
    for (const child of folder.children) {
      ids.push(child.id);
      ids.push(...getDescendantIds(child));
    }
    return ids;
  }, []);

  // Check if all children are selected
  const areAllChildrenSelected = useCallback(
    (folder: FolderWithCount): boolean => {
      if (folder.children.length === 0) return true;
      return folder.children.every(
        (child) => selectedIds.has(child.id) && areAllChildrenSelected(child)
      );
    },
    [selectedIds]
  );

  // Check if some children are selected (for indeterminate state)
  const areSomeChildrenSelected = useCallback(
    (folder: FolderWithCount): boolean => {
      if (folder.children.length === 0) return false;
      return folder.children.some(
        (child) => selectedIds.has(child.id) || areSomeChildrenSelected(child)
      );
    },
    [selectedIds]
  );

  // Handle folder toggle
  const handleToggle = useCallback(
    (folder: FolderWithCount, isChecked: boolean) => {
      const newSelected = new Set(selectedIds);
      const descendantIds = getDescendantIds(folder);

      if (isChecked) {
        // Select this folder and all descendants
        newSelected.add(folder.id);
        for (const id of descendantIds) {
          newSelected.add(id);
        }
      } else {
        // Deselect this folder and all descendants
        newSelected.delete(folder.id);
        for (const id of descendantIds) {
          newSelected.delete(id);
        }
      }

      onSelectionChange(newSelected);
    },
    [selectedIds, onSelectionChange, getDescendantIds]
  );

  // Handle expand/collapse
  const handleExpandToggle = useCallback((folderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const allIds = getAllFolderIds(folders);
    onSelectionChange(new Set(allIds));
  }, [folders, onSelectionChange, getAllFolderIds]);

  // Handle deselect all
  const handleDeselectAll = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  // Calculate total links for all selected folders
  const totalSelectedLinks = useCallback((): number => {
    let count = 0;
    const countFolder = (folder: FolderWithCount) => {
      if (selectedIds.has(folder.id)) {
        count += folder.linkCount;
      }
      for (const child of folder.children) {
        countFolder(child);
      }
    };
    for (const folder of folders) {
      countFolder(folder);
    }
    return count;
  }, [folders, selectedIds]);

  // Calculate total links across all folders
  const totalLinks = useCallback((): number => {
    let count = 0;
    const countFolder = (folder: FolderWithCount) => {
      count += folder.linkCount;
      for (const child of folder.children) {
        countFolder(child);
      }
    };
    for (const folder of folders) {
      countFolder(folder);
    }
    return count;
  }, [folders]);

  const allSelected = selectedIds.size === getAllFolderIds(folders).length;
  const noneSelected = selectedIds.size === 0;

  return (
    <div className="rounded-lg border border-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-foreground">{t('export.selectFolders')}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            disabled={allSelected}
            className="text-xs text-primary-light hover:text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('export.selectAll')}
          </button>
          <span className="text-foreground-muted">|</span>
          <button
            onClick={handleDeselectAll}
            disabled={noneSelected}
            className="text-xs text-primary-light hover:text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('export.deselectAll')}
          </button>
        </div>
      </div>

      {/* Folder list */}
      <div className="max-h-80 overflow-y-auto p-2">
        {folders.length === 0 ? (
          <div className="text-center py-8 text-foreground-muted text-sm">
            {t('export.noFoldersFound')}
          </div>
        ) : (
          <div className="space-y-0.5">
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                depth={0}
                selectedIds={selectedIds}
                expandedIds={expandedIds}
                onToggle={handleToggle}
                onExpandToggle={handleExpandToggle}
                areAllChildrenSelected={areAllChildrenSelected}
                areSomeChildrenSelected={areSomeChildrenSelected}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border bg-surface-hover/50">
        <p className="text-xs text-foreground-muted">
          {t('export.selectedSummary', {
            links: totalSelectedLinks(),
            folders: selectedIds.size,
            total: totalLinks(),
          })}
        </p>
      </div>
    </div>
  );
}

interface FolderItemProps {
  folder: FolderWithCount;
  depth: number;
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  onToggle: (folder: FolderWithCount, isChecked: boolean) => void;
  onExpandToggle: (folderId: string) => void;
  areAllChildrenSelected: (folder: FolderWithCount) => boolean;
  areSomeChildrenSelected: (folder: FolderWithCount) => boolean;
}

function FolderItem({
  folder,
  depth,
  selectedIds,
  expandedIds,
  onToggle,
  onExpandToggle,
  areAllChildrenSelected,
  areSomeChildrenSelected,
}: FolderItemProps) {
  const isSelected = selectedIds.has(folder.id);
  const isExpanded = expandedIds.has(folder.id);
  const hasChildren = folder.children.length > 0;

  // Determine checkbox state
  const isIndeterminate = !isSelected && areSomeChildrenSelected(folder);
  const isFullySelected = isSelected && (hasChildren ? areAllChildrenSelected(folder) : true);

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-hover transition-colors"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={() => onExpandToggle(folder.id)}
            className="w-5 h-5 flex items-center justify-center text-foreground-muted hover:text-foreground"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isFullySelected}
          ref={(el) => {
            if (el) el.indeterminate = isIndeterminate;
          }}
          onChange={(e) => onToggle(folder, e.target.checked)}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
        />

        {/* Folder icon */}
        <span className="text-lg">📁</span>

        {/* Folder name and count */}
        <span className="flex-1 text-sm text-foreground truncate">{folder.name}</span>
        <span className="text-xs text-foreground-muted">({folder.totalLinkCount})</span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onExpandToggle={onExpandToggle}
              areAllChildrenSelected={areAllChildrenSelected}
              areSomeChildrenSelected={areSomeChildrenSelected}
            />
          ))}
        </div>
      )}
    </div>
  );
}
