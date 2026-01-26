'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';

interface ShareButtonProps {
  folderId: string;
  initialShareId: string | null;
}

export function ShareButton({ folderId, initialShareId }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(
    initialShareId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${initialShareId}` : null
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (shareUrl) {
      setIsOpen(true);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    try {
      const response = await fetch(`/api/v1/folders/${folderId}/share`, {
        method: 'POST',
      });

      if (response.ok) {
        const { data } = await response.json();
        setShareUrl(`${window.location.origin}${data.shareUrl}`);
      }
    } catch (error) {
      console.error('Failed to share folder:', error);
    } finally {
      setLoading(false);
    }
  }, [folderId, shareUrl]);

  const handleCopy = useCallback(() => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleRevoke = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/folders/${folderId}/share`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShareUrl(null);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Failed to revoke share:', error);
    }
  }, [folderId]);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleShare}
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        }
      >
        Share
      </Button>

      {/* Share Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-surface rounded-xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Share Folder</h2>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : shareUrl ? (
              <div className="space-y-4">
                <p className="text-sm text-foreground-muted">
                  Anyone with this link can view your folder.
                </p>

                <div className="flex gap-2 items-stretch">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 h-9 px-3 text-sm bg-surface-hover border border-border rounded-lg text-foreground"
                  />
                  <button
                    onClick={handleCopy}
                    className="h-9 px-4 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <button
                    onClick={handleRevoke}
                    className="text-sm text-red-500 hover:text-red-400"
                  >
                    Revoke link
                  </button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
