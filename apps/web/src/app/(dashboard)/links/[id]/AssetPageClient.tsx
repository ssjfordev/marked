'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { debounce } from '@/lib/utils/debounce';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { TagInput } from '@/components/ui/TagInput';
import { TEXT_LIMITS } from '@/lib/api/sanitize';

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

interface Mark {
  id: string;
  text: string;
  color: string;
  note: string | null;
  position: number;
  created_at: string;
}

interface Memo {
  id: string;
  content: string;
  updated_at: string;
}

interface AssetPageClientProps {
  canonical: LinkCanonical;
  instance: {
    id: string;
    user_title: string | null;
    user_description: string | null;
  };
  folder: { id: string; name: string } | null;
  tags: { id: string; name: string }[];
  marks: Mark[];
  memo: Memo | null;
  hasAssetPageAccess: boolean;
  hasMemoAccess: boolean;
}

export function AssetPageClient({
  canonical,
  instance,
  folder,
  tags,
  marks,
  memo,
  hasAssetPageAccess,
  hasMemoAccess,
}: AssetPageClientProps) {
  const router = useRouter();
  const [memoContent, setMemoContent] = useState(memo?.content ?? '');
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [deleteMarkId, setDeleteMarkId] = useState<string | null>(null);

  const displayTitle = instance.user_title || canonical.title || canonical.domain;
  const displayDescription = instance.user_description || canonical.description;

  // Debounced memo save
  const saveMemo = useCallback(
    (content: string) => {
      const debouncedSave = debounce(async () => {
        setIsSavingMemo(true);
        try {
          await fetch(`/api/v1/links/${canonical.id}/memo`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
          });
        } finally {
          setIsSavingMemo(false);
        }
      }, 1000);
      debouncedSave();
    },
    [canonical.id]
  );

  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setMemoContent(content);
    saveMemo(content);
  };

  const handleRemoveTag = async (tagId: string) => {
    await fetch(`/api/v1/links/${instance.id}/tags/${tagId}`, {
      method: 'DELETE',
    });
    router.refresh();
  };

  const handleDeleteMark = async (markId: string) => {
    await fetch(`/api/v1/links/${canonical.id}/marks/${markId}`, {
      method: 'DELETE',
    });
    router.refresh();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm">
        {folder && (
          <>
            <Link href={`/folders/${folder.id}`} className="text-foreground-muted hover:text-foreground transition-colors">
              {folder.name}
            </Link>
            <svg className="w-4 h-4 text-foreground-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
        <span className="text-foreground font-medium truncate">{displayTitle}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start gap-4">
          {/* Favicon */}
          {canonical.favicon && (
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden">
              <Image
                src={canonical.favicon}
                alt=""
                width={32}
                height={32}
                className="rounded"
                unoptimized
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{displayTitle}</h1>

            {/* URL */}
            <a
              href={canonical.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary-light hover:text-primary-dark transition-colors"
            >
              {canonical.domain}
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* OG Image */}
        {canonical.og_image && (
          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <Image
              src={canonical.og_image}
              alt=""
              width={800}
              height={400}
              className="h-auto w-full object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Description */}
        {displayDescription && (
          <p className="mt-5 text-foreground-secondary leading-relaxed">{displayDescription}</p>
        )}

        {/* Tags */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="group inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary-light"
            >
              {tag.name}
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="hidden group-hover:inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary/20 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {addingTag ? (
            <div className="w-48">
              <TagInput
                value={newTagName}
                onChange={setNewTagName}
                onSubmit={(tagName) => {
                  if (tagName.trim()) {
                    fetch(`/api/v1/links/${instance.id}/tags`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: tagName.trim() }),
                    }).then(() => {
                      setNewTagName('');
                      setAddingTag(false);
                      router.refresh();
                    });
                  }
                }}
                onCancel={() => {
                  setAddingTag(false);
                  setNewTagName('');
                }}
                placeholder="Search or create tag..."
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingTag(true)}
              className="rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-foreground-muted hover:border-border-hover hover:text-foreground transition-colors"
            >
              + Add tag
            </button>
          )}
        </div>
      </header>

      {/* Paid feature gate */}
      {!hasAssetPageAccess && (
        <div className="mb-8 rounded-xl border p-5" style={{ borderColor: 'var(--status-warning-border)', backgroundColor: 'var(--status-warning-bg)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--status-warning-bg)' }}>
              <svg className="h-5 w-5" style={{ color: 'var(--status-warning-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <span className="font-medium" style={{ color: 'var(--status-warning-text)' }}>Upgrade to unlock full features</span>
              <p className="mt-0.5 text-sm text-foreground-muted">
                Memo editing and advanced mark features are available with a Pro subscription.
              </p>
            </div>
            <Link
              href="/settings/billing"
              className="flex-shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Marks Section */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-5 flex items-center gap-2.5 text-lg font-semibold text-foreground">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <svg className="h-4 w-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
              </svg>
            </div>
            Marks
            <span className="text-sm font-normal text-foreground-muted">({marks.length})</span>
          </h2>

          {marks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-foreground-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <p className="text-foreground-muted">No marks yet</p>
              <p className="mt-1 text-sm text-foreground-faint">Highlight text while browsing to add marks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {marks.map((mark) => (
                <div
                  key={mark.id}
                  className="group rounded-xl border border-border p-4"
                  style={{ borderLeftColor: mark.color, borderLeftWidth: 4 }}
                >
                  <p className="text-foreground leading-relaxed">&ldquo;{mark.text}&rdquo;</p>
                  {mark.note && (
                    <p className="mt-3 text-sm text-foreground-muted italic">{mark.note}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-foreground-faint">
                    <span>{new Date(mark.created_at).toLocaleDateString()}</span>
                    {hasAssetPageAccess && (
                      <button
                        onClick={() => setDeleteMarkId(mark.id)}
                        className="opacity-0 group-hover:opacity-100 text-danger hover:text-danger/80 transition-all"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Memo Section */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-5 flex items-center gap-2.5 text-lg font-semibold text-foreground">
            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
              <svg className="h-4 w-4 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            Memo
            {hasMemoAccess && isSavingMemo && (
              <span className="text-xs font-normal text-foreground-faint ml-auto">Saving...</span>
            )}
          </h2>

          {hasMemoAccess ? (
            <textarea
              value={memoContent}
              onChange={handleMemoChange}
              placeholder="Add your notes about this page..."
              className="min-h-[200px] w-full resize-y rounded-xl border border-border bg-surface-hover p-4 text-foreground placeholder:text-foreground-faint focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              maxLength={TEXT_LIMITS.LONG_TEXT}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-foreground-faint"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <p className="text-foreground-muted">Memos are a Pro feature</p>
              <Link href="/settings/billing" className="mt-2 inline-block text-sm text-primary-light hover:text-primary-dark transition-colors">
                Upgrade to unlock
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Delete mark confirmation modal */}
      <ConfirmModal
        isOpen={deleteMarkId !== null}
        onClose={() => setDeleteMarkId(null)}
        onConfirm={() => {
          if (deleteMarkId) handleDeleteMark(deleteMarkId);
        }}
        title="Delete mark"
        message="Delete this mark?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </div>
  );
}
