'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useLocale } from '@/components/LanguageProvider';

interface Folder {
  id: string;
  name: string;
  children?: Folder[];
}

interface BulkMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (folderId: string) => Promise<void>;
  folders: Folder[];
  selectedCount: number;
  isLoading?: boolean;
}

export function BulkMoveModal({
  isOpen,
  onClose,
  onSubmit,
  folders,
  selectedCount,
  isLoading = false,
}: BulkMoveModalProps) {
  const { t } = useLocale();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedFolderId(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedFolderId) return;
    await onSubmit(selectedFolderId);
  };

  const renderFolder = (folder: Folder, depth: number = 0) => {
    const isSelected = selectedFolderId === folder.id;
    const paddingLeft = depth * 16 + 12;

    return (
      <div key={folder.id}>
        <button
          type="button"
          onClick={() => setSelectedFolderId(folder.id)}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg
            text-sm text-left transition-colors
            ${
              isSelected
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'hover:bg-surface-hover text-foreground'
            }
          `}
          style={{ paddingLeft: `${paddingLeft}px` }}
          disabled={isLoading}
        >
          <svg
            className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-foreground-muted'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <span className="truncate">{folder.name}</span>
          {isSelected && (
            <svg
              className="w-4 h-4 ml-auto text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {folder.children && folder.children.length > 0 && (
          <div>{folder.children.map((child) => renderFolder(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('bulkMove.title')} size="sm">
      <div className="space-y-4">
        <p className="text-foreground-muted text-sm">
          {t('bulkMove.desc', { count: selectedCount })}
        </p>

        <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
          {folders.length > 0 ? (
            folders.map((folder) => renderFolder(folder, 0))
          ) : (
            <p className="text-sm text-foreground-faint text-center py-4">
              {t('bulkMove.noFolders')}
            </p>
          )}
        </div>
      </div>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={!selectedFolderId || isLoading}
          loading={isLoading}
        >
          {t('bulkMove.move')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
