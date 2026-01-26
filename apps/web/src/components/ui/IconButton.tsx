'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';

type IconButtonVariant = 'default' | 'ghost' | 'danger';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  icon: ReactNode;
  label: string; // For accessibility
}

const variantStyles: Record<IconButtonVariant, string> = {
  default: `
    text-foreground-muted
    hover:text-foreground hover:bg-hover
    active:bg-surface-active
  `,
  ghost: `
    text-foreground-faint
    hover:text-foreground-muted hover:bg-hover
    active:bg-surface-active
  `,
  danger: `
    text-foreground-muted
    hover:text-danger hover:bg-danger/10
    active:bg-danger/15
  `,
};

const sizeStyles: Record<IconButtonSize, { button: string; icon: string }> = {
  sm: { button: 'h-7 w-7 rounded-md', icon: 'w-3.5 h-3.5' },
  md: { button: 'h-8 w-8 rounded-lg', icon: 'w-4 h-4' },
  lg: { button: 'h-9 w-9 rounded-lg', icon: 'w-5 h-5' },
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      icon,
      label,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={`
          inline-flex items-center justify-center cursor-pointer
          transition-all duration-150 ease-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
          disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
          ${variantStyles[variant]}
          ${sizeStyles[size].button}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        <span className={sizeStyles[size].icon}>{icon}</span>
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
