'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Tag } from './ui/Tag';
import { IconButton } from './ui/IconButton';

interface LinkTag {
  id: string;
  name: string;
}

interface CardItemProps {
  id: string;
  title: string;
  domain: string;
  description?: string | null;
  favicon?: string | null;
  thumbnail?: string | null;
  tags?: LinkTag[];
  url: string;
  isFavorite?: boolean;
  isDragging?: boolean;
  dropPosition?: 'left' | 'right' | null;
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
}

export function CardItem({
  title,
  domain,
  description,
  favicon,
  thumbnail,
  tags = [],
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
}: CardItemProps) {
  const [faviconSrc, setFaviconSrc] = useState(favicon);
  const [faviconError, setFaviconError] = useState(false);
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
      onClick={handleClick}
      className={`
        group relative overflow-hidden rounded-xl
        bg-surface border border-border
        transition-all duration-200
        cursor-pointer
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isSelected ? 'ring-2 ring-primary border-primary' : ''}
        hover:border-border-hover hover:shadow-sm
      `
        .trim()
        .replace(/\s+/g, ' ')}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          className={`
            absolute top-2 left-2 z-20
            w-5 h-5 rounded border-2 flex items-center justify-center
            transition-all duration-150
            ${
              isSelected
                ? 'bg-primary border-primary'
                : 'bg-bg/70 border-foreground-muted hover:border-primary'
            }
          `}
        >
          {isSelected && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}
      {/* Drop indicator */}
      {dropPosition === 'left' && (
        <div className="absolute -left-1 top-2 bottom-2 w-0.5 bg-primary rounded-full z-10" />
      )}
      {dropPosition === 'right' && (
        <div className="absolute -right-1 top-2 bottom-2 w-0.5 bg-primary rounded-full z-10" />
      )}
      {/* Thumbnail */}
      {thumbnail ? (
        <div className="relative aspect-[16/9] bg-surface-hover overflow-hidden">
          <Image
            src={thumbnail}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {/* Favorite button */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`
                absolute top-2 right-2 p-1.5 rounded-full
                transition-all duration-150
                ${
                  isFavorite
                    ? 'bg-yellow-500/90 text-white'
                    : 'bg-bg/70 text-foreground-muted opacity-0 group-hover:opacity-100 hover:bg-bg/90'
                }
              `}
            >
              <svg
                className="w-4 h-4"
                fill={isFavorite ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div className="relative aspect-[16/9] bg-gradient-to-br from-surface-hover to-surface flex items-center justify-center">
          <svg
            className="w-10 h-10 text-foreground-faint"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {/* Favorite button */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`
                absolute top-2 right-2 p-1.5 rounded-full
                transition-all duration-150
                ${
                  isFavorite
                    ? 'bg-yellow-500/90 text-white'
                    : 'bg-bg/70 text-foreground-muted opacity-0 group-hover:opacity-100 hover:bg-bg/90'
                }
              `}
            >
              <svg
                className="w-4 h-4"
                fill={isFavorite ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Domain Row */}
        <div className="flex items-center gap-2 mb-2.5">
          {faviconSrc && !faviconError ? (
            <Image
              src={faviconSrc}
              alt=""
              width={14}
              height={14}
              className="rounded-sm"
              unoptimized
              onError={() => {
                const googleFallback = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
                if (faviconSrc !== googleFallback) {
                  setFaviconSrc(googleFallback);
                } else {
                  setFaviconError(true);
                }
              }}
            />
          ) : (
            <div className="w-3.5 h-3.5 rounded-sm bg-surface-hover" />
          )}
          <span className="text-xs text-foreground-muted truncate">{domain}</span>

          {/* External link button */}
          {onOpenExternal && (
            <IconButton
              variant="ghost"
              size="sm"
              label="Open in new tab"
              className="ml-auto -mr-1 opacity-0 group-hover:opacity-100"
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              }
              onClick={(e) => {
                e.stopPropagation();
                onOpenExternal();
              }}
            />
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1.5 leading-snug">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-xs text-foreground-muted line-clamp-2 mb-3 leading-relaxed">
            {description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <Tag key={tag.id} variant="primary" size="sm">
                {tag.name}
              </Tag>
            ))}
            {tags.length > 3 && (
              <Tag variant="muted" size="sm">
                +{tags.length - 3}
              </Tag>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
