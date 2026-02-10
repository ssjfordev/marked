'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelection } from './SelectionProvider';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { BulkTagModal } from './BulkTagModal';
import { BulkMoveModal } from './BulkMoveModal';
import { useLocale } from '@/components/LanguageProvider';

interface Folder {
  id: string;
  name: string;
  children?: Folder[];
}

interface SelectionToolbarProps {
  allIds: string[];
  folders?: Folder[];
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onBulkTag?: (ids: string[], tagName: string) => Promise<void>;
  onBulkMove?: (ids: string[], folderId: string) => Promise<void>;
  onBulkFavorite?: (ids: string[], favorite: boolean) => Promise<void>;
}

export function SelectionToolbar({
  allIds,
  folders = [],
  onBulkDelete,
  onBulkTag,
  onBulkMove,
  onBulkFavorite,
}: SelectionToolbarProps) {
  const {
    isSelectionMode,
    selectedIds,
    selectedCount,
    exitSelectionMode,
    selectAll,
    clearSelection,
  } = useSelection();
  const { t } = useLocale();

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isSelectionMode) return null;

  const allSelected = selectedCount === allIds.length && allIds.length > 0;

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(allIds);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedCount === 0 || !onBulkDelete) return;

    setIsLoading(true);
    try {
      await onBulkDelete(Array.from(selectedIds));
      setIsDeleteModalOpen(false);
      exitSelectionMode();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagSubmit = async (tagName: string) => {
    if (selectedCount === 0 || !onBulkTag) return;

    setIsLoading(true);
    try {
      await onBulkTag(Array.from(selectedIds), tagName);
      setIsTagModalOpen(false);
      exitSelectionMode();
    } catch (error) {
      console.error('Bulk tag failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveSubmit = async (folderId: string) => {
    if (selectedCount === 0 || !onBulkMove) return;

    setIsLoading(true);
    try {
      await onBulkMove(Array.from(selectedIds), folderId);
      setIsMoveModalOpen(false);
      exitSelectionMode();
    } catch (error) {
      console.error('Bulk move failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavorite = async (favorite: boolean) => {
    if (selectedCount === 0 || !onBulkFavorite) return;

    setIsLoading(true);
    try {
      await onBulkFavorite(Array.from(selectedIds), favorite);
      exitSelectionMode();
    } catch (error) {
      console.error('Bulk favorite failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toolbar = (
    <>
      {/* Background overlay to draw attention */}
      <div
        className="
          fixed inset-0 z-30
          bg-gradient-to-t from-bg/80 via-transparent to-transparent
          pointer-events-none
          animate-fadeIn
        "
      />

      {/* Floating toolbar */}
      <div
        className="
          fixed bottom-4 left-1/2 z-40
          bg-bg-elevated border border-primary/30
          rounded-2xl
          animate-slideUpBounce animate-glowPulse
        "
      >
        <div className="px-5 py-3">
          <div className="flex items-center gap-4">
            {/* Select all checkbox */}
            <button
              onClick={handleSelectAll}
              className="
                flex items-center gap-2 px-3 py-1.5 rounded-lg
                text-sm font-medium
                bg-surface border border-border
                hover:bg-surface-hover hover:border-border-hover
                transition-colors
              "
            >
              <span
                className={`
                  w-4 h-4 rounded border-2 flex items-center justify-center
                  transition-colors
                  ${allSelected ? 'bg-primary border-primary' : 'border-foreground-muted'}
                `}
              >
                {allSelected && (
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
              </span>
              {t('selection.selectAll')}
            </button>

            {/* Selection count badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-sm font-bold text-primary">{selectedCount}</span>
              <span className="text-sm text-primary/80">{t('selection.selected')}</span>
            </div>

            <div className="w-px h-6 bg-border" />

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {onBulkDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  disabled={selectedCount === 0 || isLoading}
                  onClick={() => setIsDeleteModalOpen(true)}
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  }
                >
                  {t('selection.delete')}
                </Button>
              )}

              {onBulkTag && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={selectedCount === 0 || isLoading}
                  onClick={() => setIsTagModalOpen(true)}
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                  }
                >
                  {t('selection.tag')}
                </Button>
              )}

              {onBulkMove && folders.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={selectedCount === 0 || isLoading}
                  onClick={() => setIsMoveModalOpen(true)}
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                  }
                >
                  {t('selection.move')}
                </Button>
              )}

              {onBulkFavorite && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={selectedCount === 0 || isLoading}
                  onClick={() => handleFavorite(true)}
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
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
                  }
                >
                  {t('selection.favorite')}
                </Button>
              )}

              <div className="w-px h-6 bg-border" />

              <Button variant="ghost" size="sm" onClick={exitSelectionMode}>
                {t('selection.cancel')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BulkTagModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onSubmit={handleTagSubmit}
        selectedCount={selectedCount}
        isLoading={isLoading}
      />

      <BulkMoveModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        onSubmit={handleMoveSubmit}
        folders={folders}
        selectedCount={selectedCount}
        isLoading={isLoading}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t('selection.deleteTitle')}
        message={t('selection.deleteConfirm', { count: selectedCount })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
        isLoading={isLoading}
      />
    </>
  );

  if (typeof document !== 'undefined') {
    return createPortal(toolbar, document.body);
  }

  return null;
}
