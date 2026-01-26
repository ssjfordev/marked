'use client';

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

type InputVariant = 'default' | 'search' | 'inline';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  error?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<InputVariant, string> = {
  default: `
    bg-surface border border-border
    hover:border-border-hover
    focus:border-primary/50 focus:bg-surface-hover
    placeholder:text-foreground-faint
  `,
  search: `
    bg-surface border border-border
    hover:border-border-hover
    focus:border-primary/50 focus:bg-surface-hover
    placeholder:text-foreground-faint
  `,
  inline: `
    bg-transparent border border-transparent
    hover:bg-hover
    focus:bg-surface-hover focus:border-border
    placeholder:text-foreground-faint
  `,
};

const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-8 px-2.5 text-xs rounded-md',
  md: 'h-9 px-3 text-sm rounded-lg',
  lg: 'h-11 px-4 text-sm rounded-lg',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      icon,
      iconPosition = 'left',
      error = false,
      inputSize = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const hasLeftIcon = icon && iconPosition === 'left';
    const hasRightIcon = icon && iconPosition === 'right';

    const baseStyles = `
      w-full
      text-foreground
      transition-all duration-150 ease-out
      focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const errorStyles = error
      ? 'border-danger/50 focus:border-danger/50 focus:ring-danger/20'
      : '';

    const paddingStyles = hasLeftIcon
      ? 'pl-9'
      : hasRightIcon
      ? 'pr-9'
      : '';

    if (icon) {
      return (
        <div className="relative">
          {hasLeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-faint pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              ${baseStyles}
              ${variantStyles[variant]}
              ${sizeStyles[inputSize]}
              ${paddingStyles}
              ${errorStyles}
              ${className}
            `.trim().replace(/\s+/g, ' ')}
            {...props}
          />
          {hasRightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-faint pointer-events-none">
              {icon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[inputSize]}
          ${errorStyles}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
