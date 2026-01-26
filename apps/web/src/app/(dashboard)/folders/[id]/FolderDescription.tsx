'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TEXT_LIMITS } from '@/lib/api/sanitize';

interface FolderDescriptionProps {
  folderId: string;
  description: string | null;
}

export function FolderDescription({ folderId, description }: FolderDescriptionProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(description || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(async () => {
    const trimmed = value.trim();
    setIsEditing(false);

    try {
      await fetch(`/api/v1/folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: trimmed || null }),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to update description:', error);
      setValue(description || '');
    }
  }, [folderId, value, description, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setValue(description || '');
    }
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder="Add a description..."
        className="w-full max-w-xl px-3 py-2 text-sm bg-surface-hover border border-border rounded-lg text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        rows={2}
        maxLength={TEXT_LIMITS.DESCRIPTION}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group flex items-center gap-2 text-sm text-left"
    >
      {description ? (
        <>
          <span className="text-foreground-muted">{description}</span>
          <svg className="w-3.5 h-3.5 text-foreground-faint opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </>
      ) : (
        <span className="text-foreground-faint hover:text-foreground-muted transition-colors">
          + Add description
        </span>
      )}
    </button>
  );
}
