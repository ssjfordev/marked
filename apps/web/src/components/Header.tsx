'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from './ThemeToggle';
import { AddLinkModal } from './AddLinkModal';
import { useLocale } from './LanguageProvider';
import { LanguageToggle } from './LanguageToggle';

interface Folder {
  id: string;
  name: string;
  children?: Folder[];
}

interface HeaderProps {
  user: {
    email: string;
  };
  plan: 'free' | 'pro' | 'ai_pro';
  status: string;
}

export function Header({ user, plan, status }: HeaderProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoaded, setFoldersLoaded] = useState(false);

  // Fetch folders lazily when modal opens
  const loadFolders = useCallback(async () => {
    if (foldersLoaded) return;

    try {
      const response = await fetch('/api/v1/folders');
      if (response.ok) {
        const data = await response.json();
        setFolders(data.data || []);
        setFoldersLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }, [foldersLoaded]);

  // Load folders when modal opens
  useEffect(() => {
    if (isAddLinkOpen) {
      loadFolders();
    }
  }, [isAddLinkOpen, loadFolders]);

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <>
      <header className="flex items-center justify-end h-14 px-5 bg-bg border-b border-border">
        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Link href="/search">
            <IconButton
              variant="default"
              size="md"
              label={t('header.search')}
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
            />
          </Link>

          {/* Favorites */}
          <Link href="/favorites">
            <IconButton
              variant="default"
              size="md"
              label={t('header.favorites')}
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              }
            />
          </Link>

          {/* Discover / Random */}
          <Link href="/discover">
            <IconButton
              variant="default"
              size="md"
              label={t('header.discover')}
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
                  />
                </svg>
              }
            />
          </Link>

          {/* Import */}
          <Link href="/import">
            <IconButton
              variant="default"
              size="md"
              label={t('header.import')}
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              }
            />
          </Link>

          {/* Export */}
          <Link href="/export">
            <IconButton
              variant="default"
              size="md"
              label={t('header.export')}
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              }
            />
          </Link>

          {/* Settings */}
          <Link href="/settings">
            <IconButton
              variant="default"
              size="md"
              label={t('header.settings')}
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
            />
          </Link>

          {/* Language Toggle */}
          <LanguageToggle />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Divider */}
          <div className="w-px h-5 bg-border mx-1" />

          {/* Add Link */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddLinkOpen(true)}
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            {t('header.addLink')}
          </Button>

          {/* User Menu */}
          <UserMenu email={user.email} plan={plan} status={status} onSignOut={handleSignOut} />
        </div>
      </header>

      {/* Add Link Modal */}
      <AddLinkModal
        isOpen={isAddLinkOpen}
        onClose={() => setIsAddLinkOpen(false)}
        onSuccess={() => router.refresh()}
        folders={folders}
      />
    </>
  );
}
