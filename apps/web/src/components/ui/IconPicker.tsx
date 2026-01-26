'use client';

import { useRef, useEffect } from 'react';

// Common folder icons as emojis
const FOLDER_ICONS = [
  // General
  '📁', '📂', '🗂️', '📦', '🗃️',
  // Work
  '💼', '📊', '📈', '💻', '🖥️', '⚙️', '🔧', '🛠️',
  // Categories
  '📚', '📖', '📝', '✏️', '🎨', '🎬', '🎵', '🎮',
  // Tech
  '🌐', '🔗', '💾', '📱', '🤖', '🧠', '⚡', '🚀',
  // Personal
  '🏠', '❤️', '⭐', '🔖', '📌', '🎯', '💡', '🔥',
  // Finance
  '💰', '💳', '📉', '🏦', '💵',
  // Time
  '📅', '⏰', '🗓️',
  // Nature
  '🌱', '🌿', '🌸', '🌳',
  // Other
  '🔒', '🔑', '📧', '✉️', '🎁', '🏷️',
];

interface IconPickerProps {
  value: string | null;
  onChange: (icon: string | null) => void;
  onClose?: () => void;
}

export function IconPicker({ value, onChange, onClose }: IconPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 p-2 bg-surface border border-border rounded-lg shadow-lg w-64 animate-scaleIn"
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-medium text-foreground-muted">아이콘 선택</span>
        {value && (
          <button
            onClick={() => onChange(null)}
            className="text-xs text-foreground-muted hover:text-foreground"
          >
            제거
          </button>
        )}
      </div>
      <div className="grid grid-cols-8 gap-1">
        {FOLDER_ICONS.map((icon) => (
          <button
            key={icon}
            onClick={() => {
              onChange(icon);
              onClose?.();
            }}
            className={`
              w-7 h-7 flex items-center justify-center rounded text-lg
              hover:bg-hover transition-colors
              ${value === icon ? 'bg-primary/20 ring-1 ring-primary' : ''}
            `}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}

interface FolderIconProps {
  icon: string | null;
  isExpanded?: boolean;
  className?: string;
  /** Show editable placeholder when no icon is set */
  editable?: boolean;
}

export function FolderIcon({ icon, isExpanded, className = '', editable = false }: FolderIconProps) {
  if (icon) {
    return <span className={`text-base ${className}`}>{icon}</span>;
  }

  // Editable placeholder: dashed border with + sign
  if (editable) {
    return (
      <div className={`w-5 h-5 flex items-center justify-center rounded border border-dashed border-foreground-faint/50 text-foreground-faint/70 ${className}`}>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
    );
  }

  return (
    <svg
      className={`w-5 h-5 flex-shrink-0 text-foreground-muted ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      {isExpanded ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      )}
    </svg>
  );
}
