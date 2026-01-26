'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IconPicker } from '@/components/ui/IconPicker';

interface FolderHeaderProps {
  folderId: string;
  name: string;
  icon: string | null;
  linkCount: number;
}

export function FolderHeader({ folderId, name, icon, linkCount }: FolderHeaderProps) {
  const router = useRouter();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [currentIcon, setCurrentIcon] = useState(icon);

  const handleUpdateIcon = useCallback(async (newIcon: string | null) => {
    setCurrentIcon(newIcon);
    setIsPickerOpen(false);

    try {
      await fetch(`/api/v1/folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icon: newIcon }),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to update icon:', error);
      setCurrentIcon(icon);
    }
  }, [folderId, icon, router]);

  return (
    <div className="flex items-center gap-3">
      {/* Clickable icon */}
      <div className="relative">
        <button
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
          title="Change icon"
        >
          {currentIcon ? (
            <span className="text-2xl">{currentIcon}</span>
          ) : (
            <svg className="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          )}
        </button>

        {isPickerOpen && (
          <div className="absolute top-12 left-0 z-50">
            <IconPicker
              value={currentIcon}
              onChange={handleUpdateIcon}
              onClose={() => setIsPickerOpen(false)}
            />
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">{name}</h1>
        <p className="text-sm text-foreground-muted">
          {linkCount} {linkCount === 1 ? 'link' : 'links'}
        </p>
      </div>
    </div>
  );
}
