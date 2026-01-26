'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { TEXT_LIMITS } from '@/lib/api/sanitize';

interface TagSuggestion {
  id: string;
  name: string;
}

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (tagName: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = 'Enter tag name',
  autoFocus = false,
  disabled = false,
  className = '',
}: TagInputProps) {
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [allTags, setAllTags] = useState<TagSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all user tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/v1/tags');
        if (response.ok) {
          const data = await response.json();
          setAllTags(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = value.toLowerCase().trim();
    const filtered = allTags.filter(tag =>
      tag.name.toLowerCase().includes(query)
    );

    // Sort: exact match first, then starts with, then contains
    filtered.sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();

      if (aLower === query) return -1;
      if (bLower === query) return 1;
      if (aLower.startsWith(query) && !bLower.startsWith(query)) return -1;
      if (bLower.startsWith(query) && !aLower.startsWith(query)) return 1;
      return aLower.localeCompare(bLower);
    });

    setSuggestions(filtered.slice(0, 8));
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(-1);
  }, [value, allTags]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((tagName: string) => {
    onSubmit(tagName);
    setShowSuggestions(false);
  }, [onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (showSuggestions) {
        setShowSuggestions(false);
      } else {
        onCancel?.();
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex].name);
      } else if (value.trim()) {
        handleSelect(value.trim());
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      }
      return;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="font-semibold text-primary-light">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value.trim() && suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        maxLength={TEXT_LIMITS.NAME}
        className="
          w-full px-3 py-2 rounded-lg
          bg-surface border border-border
          text-foreground placeholder:text-foreground-faint
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
          disabled:opacity-50 disabled:cursor-not-allowed
          text-sm
        "
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="
          absolute z-50 top-full left-0 right-0 mt-1
          bg-surface border border-border rounded-lg shadow-lg
          max-h-64 overflow-y-auto
        ">
          {suggestions.map((tag, index) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleSelect(tag.name)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                w-full px-3 py-2 text-left text-sm
                transition-colors
                ${index === selectedIndex
                  ? 'bg-primary/10 text-foreground'
                  : 'text-foreground-secondary hover:bg-hover'
                }
                ${index === 0 ? 'rounded-t-lg' : ''}
                ${index === suggestions.length - 1 ? 'rounded-b-lg' : ''}
              `}
            >
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-foreground-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {highlightMatch(tag.name, value)}
              </span>
            </button>
          ))}

          {/* Option to create new tag if no exact match */}
          {value.trim() && !suggestions.some(s => s.name.toLowerCase() === value.toLowerCase().trim()) && (
            <button
              type="button"
              onClick={() => handleSelect(value.trim())}
              className={`
                w-full px-3 py-2 text-left text-sm
                border-t border-border
                text-foreground-muted hover:bg-hover
                ${suggestions.length === 0 ? 'rounded-lg' : 'rounded-b-lg'}
              `}
            >
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create &quot;{value.trim()}&quot;
              </span>
            </button>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="animate-spin h-4 w-4 text-foreground-faint" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}
    </div>
  );
}
