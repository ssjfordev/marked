'use client';

import { forwardRef, HTMLAttributes, MouseEvent } from 'react';

type TagVariant = 'default' | 'primary' | 'muted';
type TagSize = 'sm' | 'md';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  size?: TagSize;
  removable?: boolean;
  onRemove?: () => void;
}

const variantStyles: Record<TagVariant, string> = {
  default: 'bg-surface-hover text-foreground-secondary hover:bg-surface-active',
  primary: 'bg-primary/15 text-primary-light hover:bg-primary/25',
  muted: 'bg-hover text-foreground-muted hover:bg-surface-hover',
};

const sizeStyles: Record<TagSize, string> = {
  sm: 'h-5 px-1.5 text-[10px] gap-1 rounded',
  md: 'h-6 px-2 text-xs gap-1.5 rounded-md',
};

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      variant = 'default',
      size = 'sm',
      removable = false,
      onRemove,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const handleRemove = (e: MouseEvent) => {
      e.stopPropagation();
      onRemove?.();
    };

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center
          font-medium
          transition-colors duration-150
          select-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        <span className="truncate max-w-[120px]">{children}</span>
        {removable && (
          <button
            type="button"
            onClick={handleRemove}
            className="
              flex-shrink-0
              text-current opacity-50
              hover:opacity-100
              transition-opacity duration-150
              focus:outline-none
            "
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Tag.displayName = 'Tag';
