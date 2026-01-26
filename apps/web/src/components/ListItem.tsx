'use client';

import Image from 'next/image';
import { Tag } from './ui/Tag';
import { IconButton } from './ui/IconButton';

interface LinkTag {
  id: string;
  name: string;
}

interface ListItemProps {
  id: string;
  title: string;
  description?: string | null;
  favicon?: string | null;
  tags?: LinkTag[];
  url: string;
  isFavorite?: boolean;
  isDragging?: boolean;
  dropPosition?: 'above' | 'below' | null;
  draggable?: boolean;
  // Selection mode props
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onClick?: () => void;
  onOpenExternal?: () => void;
  onToggleFavorite?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddTag?: () => void;
  onRemoveTag?: (tagId: string) => void;
}

export function ListItem({
  title,
  description,
  favicon,
  tags = [],
  url,
  isFavorite,
  isDragging,
  dropPosition,
  draggable,
  selectionMode,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onOpenExternal,
  onToggleFavorite,
  onEdit,
  onDelete,
  onAddTag,
  onRemoveTag,
}: ListItemProps) {
  const handleClick = () => {
    if (selectionMode && onSelect) {
      onSelect();
    } else if (onClick) {
      onClick();
    }
  };
  return (
    <div
      draggable={draggable && !selectionMode}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`
        relative
        group flex items-start gap-3 px-4 py-3.5
        cursor-pointer
        transition-all duration-150
        ${isDragging ? 'opacity-50' : ''}
        ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''}
        hover:bg-hover
      `.trim().replace(/\s+/g, ' ')}
      onClick={handleClick}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="flex-shrink-0 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center
              transition-all duration-150
              ${isSelected
                ? 'bg-primary border-primary'
                : 'border-foreground-muted hover:border-primary'
              }
            `}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      )}
      {/* Drop indicator line */}
      {dropPosition === 'above' && (
        <div className="absolute -top-[1px] left-0 right-0 h-0.5 bg-primary z-10" />
      )}
      {dropPosition === 'below' && (
        <div className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-primary z-10" />
      )}
      {/* Drag Handle - hidden in selection mode */}
      {draggable && !selectionMode && (
        <div
          className="flex-shrink-0 pt-1.5 text-foreground-faint hover:text-foreground-muted transition-colors cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </div>
      )}

      {/* Favicon */}
      <div className="flex-shrink-0 pt-0.5">
        {favicon ? (
          <Image
            src={favicon}
            alt=""
            width={20}
            height={20}
            className="rounded"
            unoptimized
          />
        ) : (
          <div className="w-5 h-5 rounded bg-surface-hover flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-foreground-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title Row */}
        <div className="mb-0.5">
          <h3 className="text-sm font-medium text-foreground truncate">
            {title}
          </h3>
        </div>

        {/* URL Row */}
        <p className="text-xs text-foreground-faint truncate mb-1.5" title={url}>
          {url.replace(/^https?:\/\//, '')}
        </p>

        {/* Description */}
        {description && (
          <p className="text-xs text-foreground-muted line-clamp-1 mb-1.5">
            {description}
          </p>
        )}

        {/* Tags Row */}
        <div className="flex items-center gap-1.5 min-h-[22px]">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <Tag
                key={tag.id}
                variant="primary"
                size="sm"
                removable={!!onRemoveTag}
                onRemove={() => onRemoveTag?.(tag.id)}
              >
                {tag.name}
              </Tag>
            ))
          ) : (
            <span className="text-[11px] text-foreground-faint/60 italic">
              No tags
            </span>
          )}
          {onAddTag && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddTag();
              }}
              className="
                inline-flex items-center justify-center
                h-[18px] px-1.5 rounded text-[9px] leading-none
                text-foreground-faint bg-surface-hover
                hover:text-foreground-muted hover:bg-hover
                transition-all duration-150
              "
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {onToggleFavorite && (
          <IconButton
            variant="ghost"
            size="md"
            label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            icon={
              isFavorite ? (
                <svg fill="currentColor" viewBox="0 0 24 24" className="text-yellow-500">
                  <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              ) : (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              )
            }
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          />
        )}
        {onOpenExternal && (
          <IconButton
            variant="ghost"
            size="md"
            label="Open in new tab"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            }
            onClick={(e) => {
              e.stopPropagation();
              onOpenExternal();
            }}
          />
        )}
        {onEdit && (
          <IconButton
            variant="ghost"
            size="md"
            label="Edit"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            }
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          />
        )}
        {onDelete && (
          <IconButton
            variant="danger"
            size="md"
            label="Delete"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />
        )}
      </div>
    </div>
  );
}
