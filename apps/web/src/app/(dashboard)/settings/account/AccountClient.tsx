'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useLocale } from '@/components/LanguageProvider';

interface AccountClientProps {
  email: string;
  createdAt?: string;
}

export function AccountClient({ email, createdAt }: AccountClientProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch('/api/v1/account', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to delete account');
      }

      // Logout and redirect
      await fetch('/api/auth/signout', { method: 'POST' });
      router.push('/login?deleted=true');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="space-y-8">
      {/* Account Info */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('account.info')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-1">
              {t('account.email')}
            </label>
            <div className="text-foreground">{email}</div>
          </div>
          {formattedDate && (
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1">
                {t('account.memberSince')}
              </label>
              <div className="text-foreground">{formattedDate}</div>
            </div>
          )}
        </div>
      </div>

      {/* Session */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('account.session')}</h2>
        <p className="text-sm text-foreground-muted mb-4">{t('account.sessionDesc')}</p>
        <Button
          variant="secondary"
          onClick={handleLogout}
          loading={isLoggingOut}
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          }
        >
          {t('account.signOut')}
        </Button>
      </div>

      {/* Language */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="px-6 py-5">
          <h2 className="text-base font-semibold text-foreground mb-1">{t('account.language')}</h2>
          <p className="text-sm text-foreground-muted mb-4">{t('account.languageDesc')}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setLocale('ko')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                locale === 'ko'
                  ? 'bg-primary text-white'
                  : 'bg-surface-hover text-foreground-secondary hover:text-foreground'
              }`}
            >
              🇰🇷 한국어
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                locale === 'en'
                  ? 'bg-primary text-white'
                  : 'bg-surface-hover text-foreground-secondary hover:text-foreground'
              }`}
            >
              🇺🇸 English
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div
        className="rounded-xl border p-6"
        style={{
          borderColor: 'var(--status-error-border)',
          backgroundColor: 'var(--status-error-bg)',
        }}
      >
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--status-error-text)' }}>
          {t('account.dangerZone')}
        </h2>
        <p className="text-sm text-foreground-muted mb-4">{t('account.dangerDesc')}</p>
        <Button
          variant="danger"
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
          {t('account.deleteAccount')}
        </Button>
      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteConfirmText('');
          setDeleteError(null);
        }}
        title={t('account.deleteTitle')}
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--status-error-bg)' }}>
            <p className="text-sm" style={{ color: 'var(--status-error-text)' }}>
              {t('account.deleteWarning')}
            </p>
            <ul className="mt-2 text-sm space-y-1" style={{ color: 'var(--status-error-text)' }}>
              <li>{t('account.deleteItem1')}</li>
              <li>{t('account.deleteItem2')}</li>
              <li>{t('account.deleteItem3')}</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-2">
              {t('account.typeDelete')}
            </label>
            <Input
              type="text"
              placeholder="DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
          </div>

          {deleteError && (
            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--status-error-bg)' }}>
              <p className="text-sm" style={{ color: 'var(--status-error-text)' }}>
                {deleteError}
              </p>
            </div>
          )}

          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteConfirmText('');
                setDeleteError(null);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              loading={isDeleting}
              disabled={deleteConfirmText !== 'DELETE'}
            >
              {t('account.deleteMyAccount')}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
