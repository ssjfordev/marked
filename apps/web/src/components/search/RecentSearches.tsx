'use client';

import { useRef, useEffect } from 'react';

interface RecentSearchesProps {
  searches: string[];
  isVisible: boolean;
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function RecentSearches({
  searches,
  isVisible,
  onSelect,
  onRemove,
  onClear,
  onClose,
}: RecentSearchesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible || searches.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="
        absolute z-50 top-full left-0 right-0 mt-2
        bg-surface border border-border rounded-xl shadow-lg
        overflow-hidden
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-hover/50">
        <span className="text-xs font-medium text-foreground-muted">최근 검색어</span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClear();
          }}
          className="text-xs text-foreground-faint hover:text-foreground-muted transition-colors"
        >
          전체 삭제
        </button>
      </div>

      {/* Search items */}
      <ul className="max-h-72 overflow-y-auto">
        {searches.map((query, index) => (
          <li key={`${query}-${index}`}>
            <div className="flex items-center group">
              <button
                type="button"
                onClick={() => onSelect(query)}
                className="
                  flex-1 flex items-center gap-3 px-4 py-2.5
                  text-sm text-foreground-secondary text-left
                  hover:bg-surface-hover hover:text-foreground
                  transition-colors
                "
              >
                {/* Clock icon */}
                <svg
                  className="w-4 h-4 flex-shrink-0 text-foreground-faint"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="truncate">{query}</span>
              </button>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(query);
                }}
                className="
                  px-3 py-2.5 opacity-0 group-hover:opacity-100
                  text-foreground-faint hover:text-foreground-muted
                  transition-opacity
                "
                title="삭제"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
