'use client';

export type TagMode = 'and' | 'or';

interface TagModeToggleProps {
  value: TagMode;
  onChange: (value: TagMode) => void;
  className?: string;
}

export function TagModeToggle({ value, onChange, className = '' }: TagModeToggleProps) {
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <span className="text-xs text-foreground-muted mr-1">Match:</span>
      <div className="inline-flex rounded-md border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => onChange('or')}
          className={`
            px-2 py-0.5 text-xs font-medium transition-colors
            ${value === 'or'
              ? 'bg-primary text-white'
              : 'bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-hover'
            }
          `}
        >
          Any
        </button>
        <button
          type="button"
          onClick={() => onChange('and')}
          className={`
            px-2 py-0.5 text-xs font-medium transition-colors border-l border-border
            ${value === 'and'
              ? 'bg-primary text-white'
              : 'bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-hover'
            }
          `}
        >
          All
        </button>
      </div>
    </div>
  );
}
