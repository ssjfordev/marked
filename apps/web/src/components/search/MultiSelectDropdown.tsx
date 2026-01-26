'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface Option {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface MultiSelectDropdownProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  icon?: ReactNode;
  emptyMessage?: string;
  className?: string;
  onOpen?: () => void;
}

export function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select...',
  icon,
  emptyMessage = 'No options available',
  className = '',
  onOpen,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    if (!isOpen) {
      onOpen?.();
    }
    setIsOpen(!isOpen);
  };
  const [search, setSearch] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
          border border-dashed border-border text-foreground-muted
          hover:border-border-hover hover:text-foreground hover:bg-surface-hover
          transition-all duration-150
          ${isOpen ? 'border-primary/50 text-primary-light bg-primary/5' : ''}
          ${selectedValues.length > 0 ? 'border-solid border-primary/30 text-primary-light bg-primary/5' : ''}
        `}
      >
        {icon || (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        )}
        <span>{placeholder}</span>
        {selectedValues.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-primary/20 rounded-full">
            {selectedValues.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute z-50 mt-1 w-64 bg-surface border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-1.5 text-sm bg-surface-hover border border-border rounded-md
                       text-foreground placeholder:text-foreground-faint
                       focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-foreground-muted text-center">
                {search ? 'No matches found' : emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 text-sm text-left
                      transition-colors duration-100
                      ${isSelected ? 'bg-primary/10 text-primary-light' : 'text-foreground-secondary hover:bg-hover hover:text-foreground'}
                    `}
                  >
                    {/* Checkbox */}
                    <span
                      className={`
                        flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center
                        transition-all duration-150
                        ${isSelected ? 'bg-primary border-primary' : 'border-border'}
                      `}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>

                    {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer with clear all */}
          {selectedValues.length > 0 && (
            <div className="p-2 border-t border-border">
              <button
                type="button"
                onClick={clearAll}
                className="w-full px-3 py-1.5 text-xs text-foreground-muted hover:text-foreground
                         hover:bg-hover rounded-md transition-colors"
              >
                Clear all ({selectedValues.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
