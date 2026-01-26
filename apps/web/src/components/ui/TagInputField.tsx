'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { TEXT_LIMITS } from '@/lib/api/sanitize';

interface TagSuggestion {
  id: string;
  name: string;
}

interface TagInputFieldProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TagInputField({
  tags,
  onTagsChange,
  placeholder = 'Add tags...',
  disabled = false,
  className = '',
}: TagInputFieldProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [allTags, setAllTags] = useState<TagSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all user tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/v1/tags');
        if (response.ok) {
          const data = await response.json();
          setAllTags(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };
    fetchTags();
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = inputValue.toLowerCase().trim();
    const filtered = allTags
      .filter(tag =>
        tag.name.toLowerCase().includes(query) &&
        !tags.includes(tag.name) // Exclude already added tags
      )
      .sort((a, b) => {
        const aLower = a.name.toLowerCase();
        const bLower = b.name.toLowerCase();
        if (aLower === query) return -1;
        if (bLower === query) return 1;
        if (aLower.startsWith(query) && !bLower.startsWith(query)) return -1;
        if (bLower.startsWith(query) && !aLower.startsWith(query)) return 1;
        return aLower.localeCompare(bLower);
      })
      .slice(0, 6);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0 || inputValue.trim().length > 0);
    setSelectedIndex(-1);
  }, [inputValue, allTags, tags]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = useCallback((tagName: string) => {
    const trimmed = tagName.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
    }
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [tags, onTagsChange]);

  const removeTag = useCallback((tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove));
    inputRef.current?.focus();
  }, [tags, onTagsChange]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      e.preventDefault();
      const lastTag = tags[tags.length - 1];
      if (lastTag) removeTag(lastTag);
      return;
    }

    if (e.key === 'Escape') {
      setShowSuggestions(false);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        addTag(suggestions[selectedIndex].name);
      } else if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
      return;
    }

    if (e.key === ',' || e.key === 'Tab') {
      if (inputValue.trim()) {
        e.preventDefault();
        addTag(inputValue.trim());
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions) {
        const maxIndex = suggestions.length + (inputValue.trim() && !suggestions.some(s => s.name.toLowerCase() === inputValue.toLowerCase()) ? 0 : -1);
        setSelectedIndex(prev => prev < maxIndex ? prev + 1 : 0);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions) {
        const maxIndex = suggestions.length + (inputValue.trim() && !suggestions.some(s => s.name.toLowerCase() === inputValue.toLowerCase()) ? 0 : -1);
        setSelectedIndex(prev => prev > 0 ? prev - 1 : maxIndex);
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

  const showCreateOption = inputValue.trim() && !suggestions.some(
    s => s.name.toLowerCase() === inputValue.toLowerCase().trim()
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Main input area */}
      <div
        className={`
          min-h-[42px] px-3 py-2 rounded-lg
          bg-surface border transition-all
          flex flex-wrap items-center gap-1.5
          cursor-text
          ${isFocused
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-border hover:border-border-hover'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Tag chips */}
        {tags.map((tag) => (
          <span
            key={tag}
            className="
              inline-flex items-center gap-1 px-2 py-0.5
              bg-primary/10 text-primary-light
              rounded-md text-sm font-medium
              animate-in fade-in zoom-in-95 duration-150
            "
          >
            <span className="max-w-[150px] truncate">{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="
                  flex-shrink-0 w-4 h-4 rounded-full
                  flex items-center justify-center
                  hover:bg-primary/20 transition-colors
                "
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </span>
        ))}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            if (inputValue.trim()) setShowSuggestions(true);
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          disabled={disabled}
          maxLength={TEXT_LIMITS.NAME}
          className="
            flex-1 min-w-[80px] bg-transparent
            text-sm text-foreground placeholder:text-foreground-faint
            focus:outline-none
            disabled:cursor-not-allowed
          "
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="
          absolute z-50 top-full left-0 right-0 mt-1
          bg-surface border border-border rounded-lg shadow-lg
          max-h-52 overflow-y-auto
          animate-in fade-in slide-in-from-top-1 duration-150
        ">
          {suggestions.map((tag, index) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => addTag(tag.name)}
              className={`
                w-full px-3 py-2 text-left text-sm
                flex items-center gap-2
                transition-colors
                ${index === selectedIndex
                  ? 'bg-primary/10 text-foreground'
                  : 'text-foreground-secondary hover:bg-surface-hover'
                }
              `}
            >
              <svg className="w-3.5 h-3.5 text-foreground-faint flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {highlightMatch(tag.name, inputValue)}
            </button>
          ))}

          {/* Create new option */}
          {showCreateOption && (
            <button
              type="button"
              onClick={() => addTag(inputValue.trim())}
              className={`
                w-full px-3 py-2 text-left text-sm
                flex items-center gap-2
                border-t border-border
                transition-colors
                ${selectedIndex === suggestions.length
                  ? 'bg-primary/10 text-foreground'
                  : 'text-foreground-muted hover:bg-surface-hover'
                }
              `}
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create &ldquo;{inputValue.trim()}&rdquo;
            </button>
          )}

          {/* Empty state */}
          {suggestions.length === 0 && !showCreateOption && (
            <div className="px-3 py-4 text-sm text-foreground-muted text-center">
              Type to search or create tags
            </div>
          )}
        </div>
      )}
    </div>
  );
}
