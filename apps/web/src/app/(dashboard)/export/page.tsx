'use client';

import { useState, useEffect, useCallback } from 'react';
import { FolderSelectTree, type FolderWithCount } from '@/components/export/FolderSelectTree';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/components/LanguageProvider';
import type { MessageKeys } from '@/i18n/messages/ko';

type ExportFormat = 'html' | 'csv' | 'json';

interface FormatOption {
  value: ExportFormat;
  labelKey: MessageKeys;
  descKey: MessageKeys;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: 'html',
    labelKey: 'export.htmlName',
    descKey: 'export.htmlDesc',
  },
  {
    value: 'csv',
    labelKey: 'export.csvName',
    descKey: 'export.csvDesc',
  },
  {
    value: 'json',
    labelKey: 'export.jsonName',
    descKey: 'export.jsonDesc',
  },
];

export default function ExportPage() {
  const { t } = useLocale();
  const [folders, setFolders] = useState<FolderWithCount[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<ExportFormat>('html');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch folders with link counts
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/folders');
        if (!response.ok) throw new Error('Failed to fetch folders');

        const { data } = await response.json();

        // Transform folders to include link counts
        // The API should return folders with counts, but for now we'll fetch separately
        const foldersWithCounts = await addLinkCounts(data || []);
        setFolders(foldersWithCounts);

        // Select all folders by default
        const allIds = new Set<string>();
        const collectIds = (folderList: FolderWithCount[]) => {
          for (const f of folderList) {
            allIds.add(f.id);
            if (f.children.length > 0) {
              collectIds(f.children);
            }
          }
        };
        collectIds(foldersWithCounts);
        setSelectedIds(allIds);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load folders');
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, []);

  // Helper to fetch link counts for folders
  const addLinkCounts = async (
    folderList: Array<{ id: string; name: string; children?: unknown[] }>
  ): Promise<FolderWithCount[]> => {
    // Fetch link counts per folder
    const response = await fetch('/api/v1/folders/link-counts');
    let countMap: Record<string, number> = {};

    if (response.ok) {
      const { data } = await response.json();
      countMap = data || {};
    }

    const buildWithCounts = (
      folders: Array<{ id: string; name: string; children?: unknown[] }>
    ): FolderWithCount[] => {
      return folders.map((folder) => {
        const children = folder.children
          ? buildWithCounts(
              folder.children as Array<{ id: string; name: string; children?: unknown[] }>
            )
          : [];

        const linkCount = countMap[folder.id] || 0;
        const childrenTotal = children.reduce((sum, c) => sum + c.totalLinkCount, 0);

        return {
          id: folder.id,
          name: folder.name,
          linkCount,
          totalLinkCount: linkCount + childrenTotal,
          children,
        };
      });
    };

    return buildWithCounts(folderList);
  };

  // Handle export
  const handleExport = useCallback(async () => {
    if (selectedIds.size === 0) {
      setError(t('export.selectAtLeastOne'));
      return;
    }

    setExporting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          folderIds: Array.from(selectedIds),
          includeSubfolders: false, // Already included in selectedIds
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || 'Export failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? `bookmarks.${format}`;

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [format, selectedIds, t]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">{t('export.title')}</h1>
        <p className="text-foreground-muted">{t('export.desc')}</p>
      </div>

      {/* Main Section */}
      <div className="mb-8 rounded-xl border border-border bg-surface p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : (
          <>
            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                {t('export.format')}
              </label>
              <div className="space-y-2">
                {FORMAT_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      format === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-border-hover'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={option.value}
                      checked={format === option.value}
                      onChange={(e) => setFormat(e.target.value as ExportFormat)}
                      className="mt-0.5 w-4 h-4 text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{t(option.labelKey)}</p>
                      <p className="text-xs text-foreground-muted">{t(option.descKey)}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Folder Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                {t('export.folders')}
              </label>
              <FolderSelectTree
                folders={folders}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-6 rounded-lg p-3"
                style={{ backgroundColor: 'var(--status-error-bg)' }}
              >
                <p className="text-sm" style={{ color: 'var(--status-error-text)' }}>
                  {error}
                </p>
              </div>
            )}

            {/* Export Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleExport}
                loading={exporting}
                disabled={selectedIds.size === 0}
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                }
              >
                {exporting ? t('export.exporting') : t('export.export')}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Info Section */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-semibold text-foreground mb-4">{t('export.formatDetails')}</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">HTML</h3>
            <p className="text-xs text-foreground-muted mt-1">{t('export.htmlDetails')}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">CSV</h3>
            <p className="text-xs text-foreground-muted mt-1">{t('export.csvDetails')}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">JSON</h3>
            <p className="text-xs text-foreground-muted mt-1">{t('export.jsonDetails')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
