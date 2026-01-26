'use client';

import { useState, useRef, useEffect } from 'react';

export type SortOption = 'newest' | 'oldest' | 'relevance' | 'domain';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  hasQuery?: boolean; // Only show relevance option when there's a search query
  className?: string;
}

const sortOptions: { value: SortOption; label: string; description: string }[] = [
  { value: 'newest', label: 'Newest first', description: 'Most recently added' },
  { value: 'oldest', label: 'Oldest first', description: 'Oldest first' },
  { value: 'relevance', label: 'Most relevant', description: 'Best match for search' },
  { value: 'domain', label: 'By domain', description: 'Group by website' },
];

export function SortDropdown({ value, onChange, hasQuery = false, className = '' }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const availableOptions = sortOptions.filter((opt) => {
    // Only show relevance option when there's a search query
    if (opt.value === 'relevance' && !hasQuery) return false;
    return true;
  });

  const selectedOption = sortOptions.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
          border border-border text-foreground-secondary
          hover:border-border-hover hover:text-foreground hover:bg-surface-hover
          transition-all duration-150
          ${isOpen ? 'border-primary/50 text-primary-light bg-primary/5' : ''}
        `}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
        <span>{selectedOption?.label || 'Sort'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 z-50 mt-1 w-52 bg-surface border border-border rounded-lg shadow-lg overflow-hidden"
        >
          <div className="p-1">
            {availableOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-start gap-3 px-3 py-2 text-left rounded-md
                  transition-colors duration-100
                  ${value === option.value
                    ? 'bg-primary/10 text-primary-light'
                    : 'text-foreground-secondary hover:bg-hover hover:text-foreground'
                  }
                `}
              >
                <span
                  className={`
                    flex-shrink-0 w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center
                    transition-all duration-150
                    ${value === option.value ? 'border-primary bg-primary' : 'border-border'}
                  `}
                >
                  {value === option.value && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </span>
                <div>
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-foreground-muted">{option.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
