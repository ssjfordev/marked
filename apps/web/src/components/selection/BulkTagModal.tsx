'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TagInput } from '../ui/TagInput';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="태그 추가"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-foreground-muted text-sm">
          <span className="font-semibold text-foreground">{selectedCount}개</span>의 링크에 태그를 추가합니다.
        </p>
        <TagInput
          value={tagName}
          onChange={setTagName}
          onSubmit={handleSubmit}
          onCancel={onClose}
          placeholder="태그 검색 또는 새로 만들기..."
          autoFocus
          disabled={isLoading}
        />
      </div>
      <ModalFooter>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
        >
          취소
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleSubmit(tagName)}
          disabled={!tagName.trim() || isLoading}
          loading={isLoading}
        >
          태그 추가
        </Button>
      </ModalFooter>
    </Modal>
  );
}
