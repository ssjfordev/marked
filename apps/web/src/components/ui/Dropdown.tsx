'use client';

import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  ReactNode,
  KeyboardEvent,
} from 'react';

interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: {
    trigger: 'h-8 px-2.5 text-xs rounded-md gap-1.5',
    menu: 'py-1 rounded-md',
    option: 'px-2.5 py-1.5 text-xs',
  },
  md: {
    trigger: 'h-10 px-3 text-sm rounded-lg gap-2',
    menu: 'py-1.5 rounded-lg',
    option: 'px-3 py-2 text-sm',
  },
  lg: {
    trigger: 'h-11 px-4 text-sm rounded-lg gap-2',
    menu: 'py-2 rounded-lg',
    option: 'px-4 py-2.5 text-sm',
  },
};

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select...',
      disabled = false,
      className = '',
      size = 'md',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);
    const styles = sizeStyles[size];

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

    useEffect(() => {
      if (isOpen) {
        setFocusedIndex(options.findIndex((opt) => opt.value === value));
      }
    }, [isOpen, options, value]);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isOpen && focusedIndex >= 0) {
            const option = options[focusedIndex];
            if (option && !option.disabled) {
              onChange?.(option.value);
              setIsOpen(false);
            }
          } else {
            setIsOpen(true);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setFocusedIndex((prev) => {
              let next = prev + 1;
              while (next < options.length && options[next]?.disabled) next++;
              return next < options.length ? next : prev;
            });
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex((prev) => {
              let next = prev - 1;
              while (next >= 0 && options[next]?.disabled) next--;
              return next >= 0 ? next : prev;
            });
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    };

    return (
      <div ref={ref} className={`relative ${className}`}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={`
            w-full flex items-center justify-between
            bg-surface border border-border text-foreground
            transition-all duration-150
            hover:border-border-hover
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
            disabled:opacity-50 disabled:cursor-not-allowed
            ${styles.trigger}
            ${isOpen ? 'border-primary/50 ring-2 ring-primary/20' : ''}
          `.trim().replace(/\s+/g, ' ')}
        >
          <span className={`truncate ${!selectedOption ? 'text-foreground-faint' : ''}`}>
            {selectedOption ? (
              <span className="flex items-center gap-2">
                {selectedOption.icon}
                {selectedOption.label}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <svg
            className={`w-4 h-4 text-foreground-muted transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
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
            className={`
              absolute z-50 w-full mt-1
              bg-surface border border-border
              shadow-lg
              ${styles.menu}
            `.trim().replace(/\s+/g, ' ')}
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  if (!option.disabled) {
                    onChange?.(option.value);
                    setIsOpen(false);
                  }
                }}
                className={`
                  w-full flex items-center gap-2 text-left
                  transition-colors duration-100
                  ${styles.option}
                  ${option.disabled
                    ? 'text-foreground-faint cursor-not-allowed'
                    : 'text-foreground-secondary hover:text-foreground hover:bg-hover'
                  }
                  ${option.value === value ? 'text-primary-light bg-primary/10' : ''}
                  ${focusedIndex === index && !option.disabled ? 'bg-hover text-foreground' : ''}
                `.trim().replace(/\s+/g, ' ')}
              >
                {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                <span className="truncate">{option.label}</span>
                {option.value === value && (
                  <svg
                    className="w-4 h-4 ml-auto text-primary-light"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';
