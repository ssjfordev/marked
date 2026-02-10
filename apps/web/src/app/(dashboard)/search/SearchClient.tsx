'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { debounce } from '@/lib/utils/debounce';
import { SearchFilters, SearchFiltersState } from '@/components/search';
import { RecentSearches } from '@/components/search/RecentSearches';
import { SelectionProvider, useSelection, SelectionToolbar } from '@/components/selection';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useLocale } from '@/components/LanguageProvider';
import type { SortOption } from '@/components/search/SortDropdown';
import type { TagMode } from '@/components/search/TagModeToggle';
import type { DatePreset } from '@/components/search/DateRangeFilter';

interface SearchResult {
  id: string;
  user_title: string | null;
  user_description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
  similarity?: number;
  keyword_match?: boolean;
  canonical: {
    id: string;
    url_key: string;
    original_url: string;
    domain: string;
    title: string | null;
    description: string | null;
    og_image: string | null;
    favicon: string | null;
  };
  folder: { id: string; name: string } | null;
  tags: { id: string; name: string }[];
}

interface SearchMeta {
  mode: 'exact' | 'nl';
  searchType?: 'hybrid';
  total: number;
  latencyMs?: number;
}

interface Folder {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

const defaultFilters: SearchFiltersState = {
  query: '',
  folders: [],
  tags: [],
  tagMode: 'or' as TagMode,
  dateRange: {
    preset: null as DatePreset,
    from: null,
    to: null,
  },
  favoriteOnly: false,
  sort: 'newest' as SortOption,
};

interface Folder {
  id: string;
  name: string;
  children?: Folder[];
}

function SearchClientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { isSelectionMode, selectedIds, toggleSelect, enterSelectionMode } = useSelection();

  // Recent searches
  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } =
    useRecentSearches();
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Initialize filters from URL params
  const initialFilters = useMemo(() => {
    const foldersParam = searchParams.get('folders');
    const tagsParam = searchParams.get('tags');

    return {
      ...defaultFilters,
      query: searchParams.get('q') || '',
      folders: foldersParam ? foldersParam.split(',').filter(Boolean) : [],
      tags: tagsParam ? tagsParam.split(',').filter(Boolean) : [],
      tagMode: (searchParams.get('tagMode') || 'or') as TagMode,
      favoriteOnly: searchParams.get('favorite') === 'true',
      sort: (searchParams.get('sort') || 'newest') as SortOption,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<SearchFiltersState>(initialFilters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync filters to URL for back/forward navigation
  const syncFiltersToUrl = useCallback(
    (newFilters: SearchFiltersState) => {
      const params = new URLSearchParams();

      if (newFilters.query) params.set('q', newFilters.query);
      if (newFilters.folders.length > 0) params.set('folders', newFilters.folders.join(','));
      if (newFilters.tags.length > 0) {
        params.set('tags', newFilters.tags.join(','));
        params.set('tagMode', newFilters.tagMode);
      }
      if (newFilters.dateRange.from) {
        params.set('dateFrom', newFilters.dateRange.from.toISOString());
      }
      if (newFilters.dateRange.to) {
        params.set('dateTo', newFilters.dateRange.to.toISOString());
      }
      if (newFilters.dateRange.preset) {
        params.set('datePreset', newFilters.dateRange.preset);
      }
      if (newFilters.favoriteOnly) params.set('favorite', 'true');
      if (newFilters.sort !== 'newest') params.set('sort', newFilters.sort);

      const queryString = params.toString();
      const newUrl = queryString ? `/search?${queryString}` : '/search';
      router.replace(newUrl, { scroll: false });
    },
    [router]
  );

  // Lazy-loaded filter options
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderTree, setFolderTree] = useState<Folder[]>([]); // For bulk move modal
  const [tags, setTags] = useState<Tag[]>([]);
  const [filterDataLoaded, setFilterDataLoaded] = useState(false);

  // Flatten folder tree to simple list
  const flattenFolders = (tree: Array<Folder & { children?: Folder[] }>, prefix = ''): Folder[] => {
    const result: Folder[] = [];
    for (const folder of tree) {
      const displayName = prefix ? `${prefix} / ${folder.name}` : folder.name;
      result.push({ id: folder.id, name: displayName });
      if (folder.children && folder.children.length > 0) {
        result.push(...flattenFolders(folder.children, displayName));
      }
    }
    return result;
  };

  // Fetch filter data lazily (folders, tags) - only once when needed
  const loadFilterData = useCallback(async () => {
    if (filterDataLoaded) return;

    try {
      const [foldersRes, tagsRes] = await Promise.all([
        fetch('/api/v1/folders'),
        fetch('/api/v1/tags'),
      ]);

      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        // Folders API returns a tree structure, store both flattened and full tree
        const fullTree = foldersData.data || [];
        setFolderTree(fullTree);
        const flatFolders = flattenFolders(fullTree);
        setFolders(flatFolders);
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        // Tags API returns { data: [...] }
        setTags(tagsData.data || []);
      }

      setFilterDataLoaded(true);
    } catch (error) {
      console.error('Failed to load filter data:', error);
    }
  }, [filterDataLoaded]);

  const debouncedSearch = useCallback(
    debounce(async (currentFilters: SearchFiltersState) => {
      setIsLoading(true);

      try {
        const params = new URLSearchParams();
        if (currentFilters.query) params.set('q', currentFilters.query);
        if (currentFilters.folders.length > 0)
          params.set('folders', currentFilters.folders.join(','));
        if (currentFilters.tags.length > 0) {
          params.set('tags', currentFilters.tags.join(','));
          params.set('tagMode', currentFilters.tagMode);
        }
        if (currentFilters.dateRange.from) {
          params.set('dateFrom', currentFilters.dateRange.from.toISOString());
        }
        if (currentFilters.dateRange.to) {
          params.set('dateTo', currentFilters.dateRange.to.toISOString());
        }
        if (currentFilters.favoriteOnly) {
          params.set('favorite', 'true');
        }
        params.set('sort', currentFilters.sort);

        const response = await fetch(`/api/v1/search?${params.toString()}`);
        const data = await response.json();
        setResults(data.results || []);
        setSearchMeta({
          mode: data.mode || 'exact',
          searchType: data.searchType,
          total: data.total || 0,
          latencyMs: data.latencyMs,
        });
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
        setSearchMeta(null);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    // Skip initial API call if no query and no active filters
    const hasActiveFilters =
      filters.folders.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange.preset !== null ||
      filters.favoriteOnly;

    if (!filters.query && !hasActiveFilters) {
      return;
    }

    debouncedSearch(filters);
  }, [filters, debouncedSearch]);

  // Debounced URL sync for query changes
  const debouncedUrlSync = useCallback(
    debounce((newFilters: SearchFiltersState) => {
      syncFiltersToUrl(newFilters);
    }, 500),
    [syncFiltersToUrl]
  );

  const handleFiltersChange = useCallback(
    (newFilters: SearchFiltersState) => {
      setFilters(newFilters);
      // Immediate URL sync for filter changes (not query)
      syncFiltersToUrl(newFilters);
    },
    [syncFiltersToUrl]
  );

  const handleQueryChange = useCallback(
    (query: string) => {
      setFilters((prev) => {
        const newFilters = { ...prev, query };
        // Debounced URL sync for query to avoid too many history entries
        debouncedUrlSync(newFilters);
        return newFilters;
      });
    },
    [debouncedUrlSync]
  );

  const getDisplayTitle = (result: SearchResult) => {
    return result.user_title || result.canonical.title || result.canonical.domain;
  };

  const getDisplayDescription = (result: SearchResult) => {
    return result.user_description || result.canonical.description;
  };

  const hasActiveFilters =
    filters.folders.length > 0 ||
    filters.tags.length > 0 ||
    filters.dateRange.preset !== null ||
    filters.favoriteOnly;

  // Bulk operation handlers
  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      const previousResults = results;
      setResults((current) => current.filter((r) => !ids.includes(r.id)));

      try {
        const response = await fetch('/api/v1/links/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', linkIds: ids }),
        });

        if (!response.ok) {
          setResults(previousResults);
          throw new Error('Bulk delete failed');
        }
      } catch (error) {
        console.error('Bulk delete failed:', error);
        setResults(previousResults);
        throw error;
      }
    },
    [results]
  );

  const handleBulkTag = useCallback(
    async (ids: string[], tagName: string) => {
      const tempId = `temp-${Date.now()}`;
      const previousResults = results;

      setResults((current) =>
        current.map((result) =>
          ids.includes(result.id)
            ? { ...result, tags: [...result.tags, { id: tempId, name: tagName }] }
            : result
        )
      );

      try {
        const response = await fetch('/api/v1/links/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'addTag', linkIds: ids, tagName }),
        });

        if (!response.ok) {
          setResults(previousResults);
          throw new Error('Bulk tag failed');
        }
      } catch (error) {
        console.error('Bulk tag failed:', error);
        setResults(previousResults);
        throw error;
      }
    },
    [results]
  );

  const handleBulkMove = useCallback(
    async (ids: string[], folderId: string) => {
      const targetFolder = folders.find((f) => f.id === folderId);
      const previousResults = results;

      setResults((current) =>
        current.map((result) =>
          ids.includes(result.id)
            ? {
                ...result,
                folder: targetFolder ? { id: folderId, name: targetFolder.name } : result.folder,
              }
            : result
        )
      );

      try {
        const response = await fetch('/api/v1/links/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'move', linkIds: ids, folderId }),
        });

        if (!response.ok) {
          setResults(previousResults);
          throw new Error('Bulk move failed');
        }
      } catch (error) {
        console.error('Bulk move failed:', error);
        setResults(previousResults);
        throw error;
      }
    },
    [results, folders]
  );

  const handleBulkFavorite = useCallback(
    async (ids: string[], favorite: boolean) => {
      const previousResults = results;

      setResults((current) =>
        current.map((result) =>
          ids.includes(result.id) ? { ...result, is_favorite: favorite } : result
        )
      );

      try {
        const response = await fetch('/api/v1/links/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: favorite ? 'favorite' : 'unfavorite', linkIds: ids }),
        });

        if (!response.ok) {
          setResults(previousResults);
          throw new Error('Bulk favorite failed');
        }
      } catch (error) {
        console.error('Bulk favorite failed:', error);
        setResults(previousResults);
        throw error;
      }
    },
    [results]
  );

  const allResultIds = results.map((r) => r.id);

  return (
    <div className={`space-y-6 ${isSelectionMode ? 'pb-24' : ''}`}>
      {/* Search input with selection toggle */}
      <div className="flex items-center gap-3">
        {results.length > 0 && !isSelectionMode && (
          <button
            onClick={enterSelectionMode}
            className="
              flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg
              text-sm text-foreground-muted
              border border-border
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
            {t('search.select')}
          </button>
        )}
        {/* Search input */}
        <div ref={searchContainerRef} className="relative flex-1">
          <input
            ref={searchInputRef}
            type="text"
            value={filters.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              if (!filters.query && recentSearches.length > 0) {
                setShowRecentSearches(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filters.query.trim()) {
                addRecentSearch(filters.query.trim());
                setShowRecentSearches(false);
              }
              if (e.key === 'Escape') {
                setShowRecentSearches(false);
              }
            }}
            placeholder={t('search.placeholder')}
            maxLength={200}
            className="w-full h-12 rounded-xl border border-border bg-surface px-4 pl-12 text-foreground placeholder:text-foreground-faint focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-faint"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground-faint border-t-primary"></div>
            </div>
          )}

          {/* Recent Searches Dropdown */}
          <RecentSearches
            searches={recentSearches}
            isVisible={showRecentSearches && !filters.query}
            onSelect={(query) => {
              handleQueryChange(query);
              addRecentSearch(query);
              setShowRecentSearches(false);
              searchInputRef.current?.focus();
            }}
            onRemove={removeRecentSearch}
            onClear={clearRecentSearches}
            onClose={() => setShowRecentSearches(false)}
          />
        </div>
      </div>

      {/* Filters */}
      <SearchFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        folders={folders}
        folderTree={folderTree}
        tags={tags}
        onFilterInteract={loadFilterData}
      />

      {/* Results */}
      <div className="space-y-2">
        {results.length === 0 && !isLoading && (filters.query || hasActiveFilters) && (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-foreground-faint"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <p className="text-foreground-muted font-medium">
              {filters.query
                ? t('search.noResults', { query: filters.query })
                : t('search.noResultsGeneral')}
            </p>
            <p className="mt-1 text-sm text-foreground-faint">{t('search.tryDifferent')}</p>
          </div>
        )}

        {results.length === 0 && !isLoading && !filters.query && !hasActiveFilters && (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-foreground-faint"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <p className="text-foreground-muted">{t('search.startTyping')}</p>
          </div>
        )}

        {results.map((result) => {
          const isSelected = selectedIds.has(result.id);
          const baseClassName = `
            group flex gap-4 rounded-xl border bg-surface p-4 transition-all cursor-pointer
            hover:bg-surface-hover hover:border-border-hover hover:shadow-sm
            ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
          `
            .trim()
            .replace(/\s+/g, ' ');

          const content = (
            <>
              {/* Selection Checkbox */}
              {isSelectionMode && (
                <div className="flex-shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(result.id);
                    }}
                    className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center
                      transition-all duration-150
                      ${
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-foreground-muted hover:border-primary'
                      }
                    `}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
              )}

              {/* Favicon */}
              <div className="flex-shrink-0 pt-0.5">
                {result.canonical.favicon ? (
                  <Image
                    src={result.canonical.favicon}
                    alt=""
                    width={24}
                    height={24}
                    className="rounded"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-surface-hover">
                    <svg
                      className="h-4 w-4 text-foreground-faint"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-medium text-foreground group-hover:text-primary-light transition-colors line-clamp-1">
                      {getDisplayTitle(result)}
                    </h3>
                    {result.is_favorite && (
                      <svg
                        className="w-4 h-4 flex-shrink-0 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-xs text-foreground-faint">
                    {result.canonical.domain}
                  </span>
                </div>

                {getDisplayDescription(result) && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-foreground-muted">
                    {getDisplayDescription(result)}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {/* Search match type - only show in NL mode */}
                  {searchMeta?.mode === 'nl' && result.similarity !== undefined && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        result.keyword_match
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-purple-600 dark:text-purple-400'
                      }`}
                    >
                      {result.keyword_match ? (
                        <>
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                          {t('search.keywordMatch')}
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                          {t('search.aiMatch', {
                            similarity: (result.similarity * 100).toFixed(0),
                          })}
                        </>
                      )}
                    </span>
                  )}

                  {/* Separator */}
                  {searchMeta?.mode === 'nl' &&
                    result.similarity !== undefined &&
                    (result.folder || result.tags.length > 0) && (
                      <span className="text-foreground-faint">·</span>
                    )}

                  {/* Folder with icon - clickable */}
                  {result.folder && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/folders/${result.folder!.id}`);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-primary hover:bg-primary/10 px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                        />
                      </svg>
                      {result.folder.name}
                    </button>
                  )}

                  {/* Tags with # prefix */}
                  {result.tags.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-foreground-muted">
                      {result.tags.map((tag, idx) => (
                        <span key={tag.id} className="text-primary-light">
                          #{tag.name}
                          {idx < result.tags.length - 1 ? '' : ''}
                        </span>
                      ))}
                    </span>
                  )}

                  {/* Dates - created and updated */}
                  <span className="inline-flex items-center gap-1.5 text-xs text-foreground-faint">
                    <span title={t('search.createdDate')}>
                      {new Date(result.created_at).toLocaleDateString()}
                    </span>
                    {result.updated_at &&
                      new Date(result.updated_at).getTime() -
                        new Date(result.created_at).getTime() >
                        60000 && (
                        <>
                          <span className="text-foreground-faint/50">&rarr;</span>
                          <span title={t('search.modifiedDate')} className="text-foreground-muted">
                            {new Date(result.updated_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                  </span>
                </div>
              </div>
            </>
          );

          if (isSelectionMode) {
            return (
              <div
                key={result.id}
                onClick={() => toggleSelect(result.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    toggleSelect(result.id);
                  }
                }}
                className={baseClassName}
              >
                {content}
              </div>
            );
          }

          return (
            <Link key={result.id} href={`/links/${result.canonical.id}`} className={baseClassName}>
              {content}
            </Link>
          );
        })}
      </div>

      {/* Results count & search mode */}
      {results.length > 0 && (
        <div className="flex items-center justify-center gap-3 text-sm text-foreground-muted pt-2">
          <span>
            {results.length === 1
              ? t('search.foundResultOne', { count: results.length })
              : t('search.foundResults', { count: results.length })}
          </span>
          {searchMeta && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                searchMeta.mode === 'nl'
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
              }`}
            >
              {searchMeta.mode === 'nl' ? (
                <>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  {t('search.aiSearch')}
                </>
              ) : (
                <>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {t('search.exact')}
                </>
              )}
            </span>
          )}
          {searchMeta?.latencyMs && (
            <span className="text-xs text-foreground-faint">{searchMeta.latencyMs}ms</span>
          )}
        </div>
      )}

      {/* Selection Toolbar */}
      <SelectionToolbar
        allIds={allResultIds}
        folders={folderTree}
        onBulkDelete={handleBulkDelete}
        onBulkTag={handleBulkTag}
        onBulkMove={handleBulkMove}
        onBulkFavorite={handleBulkFavorite}
      />
    </div>
  );
}

// Export wrapped component with SelectionProvider
export function SearchClient() {
  return (
    <SelectionProvider>
      <SearchClientContent />
    </SelectionProvider>
  );
}
