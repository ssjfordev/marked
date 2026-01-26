'use client';

import { useState } from 'react';
import { FilterChip } from './FilterChip';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { DateRangeFilter, DatePreset } from './DateRangeFilter';
import { SortDropdown, SortOption } from './SortDropdown';
import { TagModeToggle, TagMode } from './TagModeToggle';
import { FolderMultiSelectModal } from '../FolderMultiSelectModal';

export interface SearchFiltersState {
  query: string;
  folders: string[];
  tags: string[];
  tagMode: TagMode;
  dateRange: {
    preset: DatePreset;
    from: Date | null;
    to: Date | null;
  };
  favoriteOnly: boolean;
  sort: SortOption;
}

interface Folder {
  id: string;
  name: string;
  children?: Folder[];
}

interface FlatFolder {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface SearchFiltersProps {
  filters: SearchFiltersState;
  onFiltersChange: (filters: SearchFiltersState) => void;
  folders: FlatFolder[];  // Flat list for display names
  folderTree?: Folder[];  // Hierarchical tree for modal
  tags: Tag[];
  onFilterInteract?: () => void;
}

export function SearchFilters({
  filters,
  onFiltersChange,
  folders,
  folderTree = [],
  tags,
  onFilterInteract,
}: SearchFiltersProps) {
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  const updateFilters = (partial: Partial<SearchFiltersState>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  const handleFilterClick = () => {
    onFilterInteract?.();
  };

  const handleFolderFilterClick = () => {
    onFilterInteract?.();
    setIsFolderModalOpen(true);
  };

  const handleFolderSelect = (selectedIds: string[]) => {
    updateFilters({ folders: selectedIds });
  };

  const tagOptions = tags.map((t) => ({
    value: t.name,
    label: t.name,
    icon: (
      <svg className="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  }));

  const getDateChipLabel = (): string => {
    if (!filters.dateRange.preset) return '';
    switch (filters.dateRange.preset) {
      case 'today':
        return 'Today';
      case '7days':
        return 'Last 7 days';
      case '30days':
        return 'Last 30 days';
      case '1year':
        return 'Last year';
      case 'custom':
        if (filters.dateRange.from && filters.dateRange.to) {
          const fromStr = filters.dateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const toStr = filters.dateRange.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return `${fromStr} - ${toStr}`;
        }
        return 'Custom';
      default:
        return '';
    }
  };

  const selectedFolderNames = filters.folders
    .map((id) => folders.find((f) => f.id === id)?.name)
    .filter(Boolean) as string[];

  const hasActiveFilters =
    filters.folders.length > 0 ||
    filters.tags.length > 0 ||
    filters.dateRange.preset !== null ||
    filters.favoriteOnly;

  const clearAllFilters = () => {
    updateFilters({
      folders: [],
      tags: [],
      tagMode: 'or',
      dateRange: { preset: null, from: null, to: null },
      favoriteOnly: false,
    });
  };

  return (
    <div className="space-y-3">
      {/* Filter buttons row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Folder filter */}
        <button
          type="button"
          onClick={handleFolderFilterClick}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
            border transition-all duration-150 cursor-pointer
            ${filters.folders.length > 0
              ? 'border-primary/30 text-primary-light bg-primary/10'
              : 'border-dashed border-border text-foreground-muted hover:border-border-hover hover:text-foreground hover:bg-surface-hover'
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>Folder</span>
          {filters.folders.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 text-xs bg-primary/20 rounded-full">
              {filters.folders.length}
            </span>
          )}
        </button>

        <FolderMultiSelectModal
          isOpen={isFolderModalOpen}
          onClose={() => setIsFolderModalOpen(false)}
          onConfirm={handleFolderSelect}
          folders={folderTree}
          selectedIds={filters.folders}
          title="Filter by Folders"
        />

        {/* Tag filter */}
        <MultiSelectDropdown
          options={tagOptions}
          selectedValues={filters.tags}
          onChange={(values) => updateFilters({ tags: values })}
          placeholder="Tag"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
          emptyMessage="No tags yet"
          onOpen={handleFilterClick}
        />

        {/* Date filter */}
        <DateRangeFilter
          value={filters.dateRange}
          onChange={(value) => updateFilters({ dateRange: value })}
        />

        {/* Favorite toggle */}
        <button
          type="button"
          onClick={() => updateFilters({ favoriteOnly: !filters.favoriteOnly })}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
            border transition-all duration-150
            ${filters.favoriteOnly
              ? 'border-yellow-500/30 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10'
              : 'border-dashed border-border text-foreground-muted hover:border-border-hover hover:text-foreground hover:bg-surface-hover'
            }
          `}
        >
          <svg
            className="w-4 h-4"
            fill={filters.favoriteOnly ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span>Favorites</span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort dropdown */}
        <SortDropdown
          value={filters.sort}
          onChange={(value) => updateFilters({ sort: value })}
          hasQuery={filters.query.length > 0}
        />
      </div>

      {/* Tag mode toggle (only when multiple tags selected) */}
      {filters.tags.length > 1 && (
        <div className="flex items-center">
          <TagModeToggle
            value={filters.tagMode}
            onChange={(value) => updateFilters({ tagMode: value })}
          />
        </div>
      )}

      {/* Selected filters chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Folder chips */}
          {selectedFolderNames.map((name, index) => (
            <FilterChip
              key={`folder-${filters.folders[index]}`}
              label={name}
              variant="folder"
              onRemove={() => {
                updateFilters({
                  folders: filters.folders.filter((_, i) => i !== index),
                });
              }}
            />
          ))}

          {/* Tag chips */}
          {filters.tags.map((tag) => (
            <FilterChip
              key={`tag-${tag}`}
              label={tag}
              variant="tag"
              onRemove={() => {
                updateFilters({
                  tags: filters.tags.filter((t) => t !== tag),
                });
              }}
            />
          ))}

          {/* Date chip */}
          {filters.dateRange.preset && (
            <FilterChip
              label={getDateChipLabel()}
              variant="date"
              onRemove={() => {
                updateFilters({
                  dateRange: { preset: null, from: null, to: null },
                });
              }}
            />
          )}

          {/* Favorite chip */}
          {filters.favoriteOnly && (
            <FilterChip
              label="Favorites"
              variant="favorite"
              onRemove={() => {
                updateFilters({ favoriteOnly: false });
              }}
            />
          )}

          {/* Clear all */}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-foreground-muted hover:text-foreground transition-colors ml-2"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
