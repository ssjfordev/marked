'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Modal, ModalFooter } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TagInputField } from './ui/TagInputField';
import { FolderSelectModal } from './FolderSelectModal';
import { TEXT_LIMITS } from '@/lib/api/sanitize';

interface Folder {
  id: string;
  name: string;
  children?: Folder[];
}

interface LinkPreview {
  url: string;
  urlKey: string;
  domain: string;
  title: string | null;
  description: string | null;
  ogImage: string | null;
  favicon: string | null;
}

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  folders: Folder[];
  defaultFolderId?: string;
}

type Step = 'url' | 'details';

export function AddLinkModal({
  isOpen,
  onClose,
  onSuccess,
  folders,
  defaultFolderId,
}: AddLinkModalProps) {
  const [step, setStep] = useState<Step>('url');
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [preview, setPreview] = useState<LinkPreview | null>(null);

  // Form fields (step 2)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(defaultFolderId || '');
  const [selectedFolderName, setSelectedFolderName] = useState<string>('');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Find folder name by ID
  const findFolderName = (tree: Folder[], targetId: string): string | null => {
    for (const folder of tree) {
      if (folder.id === targetId) return folder.name;
      if (folder.children) {
        const found = findFolderName(folder.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Reset on close/open
  useEffect(() => {
    if (!isOpen) {
      setStep('url');
      setUrl('');
      setIsAnalyzing(false);
      setAnalyzeError(null);
      setPreview(null);
      setTitle('');
      setDescription('');
      setSelectedFolderName('');
      setTags([]);
      setIsSaving(false);
      setSaveError(null);
    }
  }, [isOpen]);

  // Update default folder when prop changes
  useEffect(() => {
    if (defaultFolderId && !selectedFolderId) {
      setSelectedFolderId(defaultFolderId);
      const name = findFolderName(folders, defaultFolderId);
      if (name) setSelectedFolderName(name);
    }
  }, [defaultFolderId, selectedFolderId, folders]);

  // Handle folder selection from modal
  const handleFolderSelect = (folderId: string, folderName: string) => {
    setSelectedFolderId(folderId);
    setSelectedFolderName(folderName);
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const response = await fetch('/api/v1/links/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to analyze URL');
      }

      setPreview(data.data);
      setTitle(data.data.title || '');
      setDescription(data.data.description || '');
      setStep('details');
    } catch (error) {
      setAnalyzeError(
        error instanceof Error ? error.message : 'Failed to analyze URL'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!preview || !selectedFolderId) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/v1/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: preview.url,
          folderId: selectedFolderId,
          userTitle: title.trim() || null,
          userDescription: description.trim() || null,
          tags: tags.length > 0 ? tags : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to save link');
      }

      onSuccess();
      onClose();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save link'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    setStep('url');
    setPreview(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'url' ? 'Add New Link' : 'Link Details'}
      size="md"
    >
      {step === 'url' ? (
        // Step 1: URL Input
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              URL
            </label>
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setAnalyzeError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && url.trim()) {
                  e.preventDefault();
                  handleAnalyze();
                }
              }}
              autoFocus
            />
            {analyzeError && (
              <p className="mt-2 text-sm text-danger">{analyzeError}</p>
            )}
          </div>

          <ModalFooter>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAnalyze}
              loading={isAnalyzing}
              disabled={!url.trim()}
            >
              {isAnalyzing ? 'Analyzing...' : 'Next'}
            </Button>
          </ModalFooter>
        </div>
      ) : (
        // Step 2: Details Form
        <div className="space-y-5">
          {/* Preview card */}
          {preview && (
            <div className="rounded-xl border border-border overflow-hidden bg-surface-hover">
              {/* OG Image */}
              {preview.ogImage && (
                <div className="relative w-full h-40 bg-surface">
                  <Image
                    src={preview.ogImage}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              {/* Info row */}
              <div className="flex items-center gap-3 p-3">
                {preview.favicon ? (
                  <Image
                    src={preview.favicon}
                    alt=""
                    width={20}
                    height={20}
                    className="flex-shrink-0 rounded"
                    unoptimized
                  />
                ) : (
                  <div className="flex-shrink-0 w-5 h-5 rounded bg-surface flex items-center justify-center">
                    <svg
                      className="w-3.5 h-3.5 text-foreground-faint"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {preview.domain}
                  </p>
                  <p className="text-xs text-foreground-muted truncate">
                    {preview.url}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground-secondary mb-2">
              Title
              <span className="w-1.5 h-1.5 rounded-full bg-danger" title="Required" />
            </label>
            <Input
              type="text"
              placeholder="Enter title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TEXT_LIMITS.TITLE}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Description
              <span className="text-foreground-faint font-normal ml-1">(optional)</span>
            </label>
            <textarea
              className="
                w-full px-3 py-2 rounded-lg
                bg-surface border border-border
                text-foreground placeholder:text-foreground-faint
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                resize-none text-sm
              "
              rows={2}
              placeholder="Add a note..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={TEXT_LIMITS.DESCRIPTION}
            />
          </div>

          {/* Folder */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground-secondary mb-2">
              Folder
              <span className="w-1.5 h-1.5 rounded-full bg-danger" title="Required" />
            </label>
            <button
              type="button"
              onClick={() => setIsFolderModalOpen(true)}
              className={`
                w-full px-3 py-2 rounded-lg
                bg-surface border border-border text-sm text-left
                hover:bg-surface-hover transition-colors
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                flex items-center justify-between cursor-pointer
                ${selectedFolderId ? 'text-foreground' : 'text-foreground-faint'}
              `}
            >
              <span className="flex items-center gap-2 truncate">
                {selectedFolderName ? (
                  <>
                    <svg
                      className="w-4 h-4 text-foreground-muted flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                      />
                    </svg>
                    {selectedFolderName}
                  </>
                ) : (
                  'Select a folder...'
                )}
              </span>
              <svg
                className="w-4 h-4 text-foreground-muted flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <FolderSelectModal
              isOpen={isFolderModalOpen}
              onClose={() => setIsFolderModalOpen(false)}
              onSelect={handleFolderSelect}
              folders={folders}
              selectedFolderId={selectedFolderId}
              title="Select Folder"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Tags
              <span className="text-foreground-faint font-normal ml-1">(optional)</span>
            </label>
            <TagInputField
              tags={tags}
              onTagsChange={setTags}
              placeholder="Type and press Enter to add tags..."
            />
          </div>

          {saveError && (
            <p className="text-sm text-danger">{saveError}</p>
          )}

          <ModalFooter>
            <Button variant="ghost" size="sm" onClick={handleBack}>
              Back
            </Button>
            <div className="flex-1" />
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              loading={isSaving}
              disabled={!selectedFolderId || !title.trim()}
            >
              Save Link
            </Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}
