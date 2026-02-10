'use client';

import { useState, useRef } from 'react';
import { ListItem } from './ListItem';
import { CardItem } from './CardItem';
import { TagInput } from './ui/TagInput';
import { Modal, ModalFooter } from './ui/Modal';
import { Button } from './ui/Button';
import { useLocale } from '@/components/LanguageProvider';

interface LinkCanonical {
  id: string;
  url_key: string;
  original_url: string;
  domain: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  favicon: string | null;
}

interface Tag {
  id: string;
  name: string;
}

interface LinkInstance {
  id: string;
  user_title: string | null;
  user_description: string | null;
  position: number;
  is_favorite: boolean;
  created_at: string;
  canonical: LinkCanonical;
  tags: Tag[];
}

interface ReorderInfo {
  draggedId: string;
  targetId: string;
  position: 'above' | 'below';
}

interface LinkListProps {
  links: LinkInstance[];
  view?: 'card' | 'list';
  // Selection mode props
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelectLink?: (linkId: string) => void;
  onOpenLink?: (link: LinkInstance) => void;
  onEditLink?: (link: LinkInstance) => void;
  onDeleteLink?: (linkId: string) => Promise<void>;
  onToggleFavorite?: (linkId: string) => void;
  onAddTag?: (linkId: string, tagName: string) => Promise<void>;
  onRemoveTag?: (linkId: string, tagId: string) => Promise<void>;
  onReorder?: (info: ReorderInfo) => void;
}

export function LinkList({
  links,
  view = 'list',
  selectionMode = false,
  selectedIds = new Set(),
  onSelectLink,
  onOpenLink,
  onEditLink,
  onDeleteLink,
  onToggleFavorite,
  onAddTag,
  onRemoveTag,
  onReorder,
}: LinkListProps) {
  const { t } = useLocale();
  const [addingTagToLinkId, setAddingTagToLinkId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: 'above' | 'below' | 'left' | 'right';
  } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const linkToDelete = deleteConfirmId ? links.find((l) => l.id === deleteConfirmId) : null;

  const handleConfirmDelete = async () => {
    if (deleteConfirmId && onDeleteLink) {
      await onDeleteLink(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const getDisplayTitle = (link: LinkInstance) => {
    return link.user_title || link.canonical.title || link.canonical.domain;
  };

  const getDisplayDescription = (link: LinkInstance) => {
    return link.user_description || link.canonical.description;
  };

  const handleOpenExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddTag = async (linkId: string) => {
    if (newTagName.trim() && onAddTag) {
      await onAddTag(linkId, newTagName.trim());
      setNewTagName('');
      setAddingTagToLinkId(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, linkId: string) => {
    if (!onReorder) return;
    setDraggedId(linkId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', linkId);
    if (e.currentTarget instanceof HTMLElement) {
      dragNodeRef.current = e.currentTarget as HTMLDivElement;
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTarget(null);
    dragNodeRef.current = null;
  };

  const handleDragOverList = (e: React.DragEvent, linkId: string) => {
    e.preventDefault();
    if (draggedId === linkId) {
      setDropTarget(null);
      return;
    }

    // Calculate if mouse is in upper or lower half of the element
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'above' : 'below';

    setDropTarget({ id: linkId, position });
  };

  const handleDragOverCard = (e: React.DragEvent, linkId: string) => {
    e.preventDefault();
    if (draggedId === linkId) {
      setDropTarget(null);
      return;
    }

    // Calculate if mouse is in left or right half of the element
    const rect = e.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const position = e.clientX < midX ? 'left' : 'right';

    setDropTarget({ id: linkId, position });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetLink: LinkInstance) => {
    e.preventDefault();
    if (!onReorder || !draggedId || draggedId === targetLink.id || !dropTarget) return;

    // Convert card positions to list positions for the reorder callback
    const position =
      dropTarget.position === 'left' || dropTarget.position === 'above' ? 'above' : 'below';

    onReorder({
      draggedId,
      targetId: targetLink.id,
      position,
    });

    setDraggedId(null);
    setDropTarget(null);
  };

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-foreground-faint"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        </div>
        <p className="text-foreground-muted mb-1">{t('link.noLinks')}</p>
        <p className="text-sm text-foreground-faint">{t('link.noLinksDesc')}</p>
      </div>
    );
  }

  if (view === 'card') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {links.map((link) => (
          <CardItem
            key={link.id}
            id={link.id}
            title={getDisplayTitle(link)}
            domain={link.canonical.domain}
            description={getDisplayDescription(link)}
            favicon={link.canonical.favicon}
            thumbnail={link.canonical.og_image}
            tags={link.tags}
            url={link.canonical.original_url}
            isFavorite={link.is_favorite}
            isDragging={draggedId === link.id}
            dropPosition={
              dropTarget?.id === link.id ? (dropTarget.position as 'left' | 'right') : null
            }
            draggable={!!onReorder}
            selectionMode={selectionMode}
            isSelected={selectedIds.has(link.id)}
            onSelect={onSelectLink ? () => onSelectLink(link.id) : undefined}
            onDragStart={(e) => handleDragStart(e, link.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOverCard(e, link.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, link)}
            onClick={() => onOpenLink?.(link)}
            onOpenExternal={() => handleOpenExternal(link.canonical.original_url)}
            onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(link.id) : undefined}
            onEdit={onEditLink ? () => onEditLink(link) : undefined}
            onDelete={onDeleteLink ? () => onDeleteLink(link.id) : undefined}
          />
        ))}
      </div>
    );
  }

  const linkToAddTag = addingTagToLinkId ? links.find((l) => l.id === addingTagToLinkId) : null;

  // List view
  return (
    <>
      <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
        {links.map((link) => (
          <div key={link.id} className="relative">
            <ListItem
              id={link.id}
              title={getDisplayTitle(link)}
              description={getDisplayDescription(link)}
              favicon={link.canonical.favicon}
              tags={link.tags}
              url={link.canonical.original_url}
              isFavorite={link.is_favorite}
              isDragging={draggedId === link.id}
              dropPosition={
                dropTarget?.id === link.id ? (dropTarget.position as 'above' | 'below') : null
              }
              draggable={!!onReorder}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(link.id)}
              onSelect={onSelectLink ? () => onSelectLink(link.id) : undefined}
              onDragStart={(e) => handleDragStart(e, link.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOverList(e, link.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, link)}
              onClick={() => onOpenLink?.(link)}
              onOpenExternal={() => handleOpenExternal(link.canonical.original_url)}
              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(link.id) : undefined}
              onEdit={onEditLink ? () => onEditLink(link) : undefined}
              onDelete={onDeleteLink ? () => setDeleteConfirmId(link.id) : undefined}
              onAddTag={onAddTag ? () => setAddingTagToLinkId(link.id) : undefined}
              onRemoveTag={onRemoveTag ? (tagId) => onRemoveTag(link.id, tagId) : undefined}
            />
          </div>
        ))}
      </div>

      {/* Add Tag Modal */}
      <Modal
        isOpen={!!addingTagToLinkId}
        onClose={() => {
          setAddingTagToLinkId(null);
          setNewTagName('');
        }}
        title={t('link.addTag')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-foreground-muted text-sm">
            {t('link.addTagTo')}{' '}
            <span className="text-foreground font-medium">
              {linkToAddTag ? getDisplayTitle(linkToAddTag) : t('link.thisLink')}
            </span>
          </p>
          <TagInput
            value={newTagName}
            onChange={setNewTagName}
            onSubmit={(tagName) => {
              if (addingTagToLinkId && onAddTag) {
                onAddTag(addingTagToLinkId, tagName);
                setNewTagName('');
                setAddingTagToLinkId(null);
              }
            }}
            onCancel={() => {
              setAddingTagToLinkId(null);
              setNewTagName('');
            }}
            placeholder={t('link.searchOrCreateTag')}
            autoFocus
          />
        </div>
        <ModalFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAddingTagToLinkId(null);
              setNewTagName('');
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (newTagName.trim() && addingTagToLinkId) {
                handleAddTag(addingTagToLinkId);
              }
            }}
            disabled={!newTagName.trim()}
          >
            {t('link.addTag')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title={t('link.deleteTitle')}
        size="sm"
      >
        <p className="text-foreground-muted text-sm">
          {t('link.deleteConfirm')}{' '}
          <span className="text-foreground font-medium">
            {linkToDelete ? getDisplayTitle(linkToDelete) : t('link.thisLink')}
          </span>
          {t('link.deleteConfirmSuffix')}
        </p>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
            {t('common.delete')}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
