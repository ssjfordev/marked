'use client';

import { useState, useRef, useEffect } from 'react';

export type DatePreset = 'today' | '7days' | '30days' | '1year' | 'custom' | null;

interface DateRange {
  preset: DatePreset;
  from: Date | null;
  to: Date | null;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  className?: string;
}

const presets: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
  { value: '1year', label: 'Last year' },
];

function getPresetDates(preset: DatePreset): { from: Date; to: Date } | null {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  switch (preset) {
    case 'today': {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      return { from, to: today };
    }
    case '7days': {
      const from = new Date();
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      return { from, to: today };
    }
    case '30days': {
      const from = new Date();
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
      return { from, to: today };
    }
    case '1year': {
      const from = new Date();
      from.setFullYear(from.getFullYear() - 1);
      from.setHours(0, 0, 0, 0);
      return { from, to: today };
    }
    default:
      return null;
  }
}

function formatDateForInput(date: Date | null): string {
  if (!date) return '';
  return date.toISOString().split('T')[0] ?? '';
}

export function DateRangeFilter({ value, onChange, className = '' }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');
  const [customFrom, setCustomFrom] = useState(formatDateForInput(value.from));
  const [customTo, setCustomTo] = useState(formatDateForInput(value.to));
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

  const handlePresetClick = (preset: DatePreset) => {
    const dates = getPresetDates(preset);
    if (dates) {
      onChange({ preset, from: dates.from, to: dates.to });
      setShowCustom(false);
      setIsOpen(false);
    }
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      const from = new Date(customFrom);
      from.setHours(0, 0, 0, 0);
      const to = new Date(customTo);
      to.setHours(23, 59, 59, 999);
      onChange({ preset: 'custom', from, to });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange({ preset: null, from: null, to: null });
    setCustomFrom('');
    setCustomTo('');
    setShowCustom(false);
    setIsOpen(false);
  };

  const hasValue = value.preset !== null;

  const getDisplayLabel = () => {
    if (!value.preset) return 'Date';
    if (value.preset === 'custom' && value.from && value.to) {
      const fromStr = value.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const toStr = value.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${fromStr} - ${toStr}`;
    }
    return presets.find((p) => p.value === value.preset)?.label || 'Date';
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
          border border-dashed border-border text-foreground-muted
          hover:border-border-hover hover:text-foreground hover:bg-surface-hover
          transition-all duration-150
          ${isOpen ? 'border-primary/50 text-primary-light bg-primary/5' : ''}
          ${hasValue ? 'border-solid border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5' : ''}
        `}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {hasValue ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          )}
        </svg>
        <span>{getDisplayLabel()}</span>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute z-50 mt-1 w-72 bg-surface border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {/* Presets */}
          <div className="p-2">
            <div className="text-xs font-medium text-foreground-muted px-2 py-1 mb-1">Quick select</div>
            <div className="space-y-0.5">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetClick(preset.value)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md
                    transition-colors duration-100
                    ${value.preset === preset.value
                      ? 'bg-primary/10 text-primary-light'
                      : 'text-foreground-secondary hover:bg-hover hover:text-foreground'
                    }
                  `}
                >
                  {value.preset === preset.value && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className={value.preset === preset.value ? '' : 'ml-6'}>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom range */}
          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={() => setShowCustom(!showCustom)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground-secondary hover:text-foreground hover:bg-hover rounded-md transition-colors"
            >
              <span>Custom range</span>
              <svg
                className={`w-4 h-4 transition-transform ${showCustom ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showCustom && (
              <div className="mt-2 space-y-2 px-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-foreground-muted mb-1">From</label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-surface-hover border border-border rounded-md
                               text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-foreground-muted mb-1">To</label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-surface-hover border border-border rounded-md
                               text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCustomApply}
                  disabled={!customFrom || !customTo}
                  className="w-full px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-md
                           hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Clear */}
          {hasValue && (
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={handleClear}
                className="w-full px-3 py-1.5 text-xs text-foreground-muted hover:text-foreground
                         hover:bg-hover rounded-md transition-colors"
              >
                Clear date filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { getPresetDates };
