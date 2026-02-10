'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TagInput } from '../ui/TagInput';
import { useLocale } from '@/components/LanguageProvider';

interface BulkTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tagName: string) => Promise<void>;
  selectedCount: number;
  isLoading?: boolean;
}

export function BulkTagModal({
  isOpen,
  onClose,
  onSubmit,
  selectedCount,
  isLoading = false,
}: BulkTagModalProps) {
  const { t } = useLocale();
  const [tagName, setTagName] = useState('');

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTagName('');
    }
  }, [isOpen]);

  const handleSubmit = async (name: string) => {
    if (!name.trim()) return;
    await onSubmit(name.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('bulkTag.title')} size="sm">
      <div className="space-y-4">
        <p className="text-foreground-muted text-sm">
          {t('bulkTag.desc', { count: selectedCount })}
        </p>
        <TagInput
          value={tagName}
          onChange={setTagName}
          onSubmit={handleSubmit}
          onCancel={onClose}
          placeholder={t('bulkTag.placeholder')}
          autoFocus
          disabled={isLoading}
        />
      </div>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleSubmit(tagName)}
          disabled={!tagName.trim() || isLoading}
          loading={isLoading}
        >
          {t('bulkTag.add')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
