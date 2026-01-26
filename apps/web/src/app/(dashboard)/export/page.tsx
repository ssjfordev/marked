'use client';

import { useState, useEffect, useCallback } from 'react';
import { FolderSelectTree, type FolderWithCount } from '@/components/export/FolderSelectTree';
import { Button } from '@/components/ui/Button';

type ExportFormat = 'html' | 'csv' | 'json';

interface FormatOption {
  value: ExportFormat;
  label: string;
  description: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: 'html',
    label: 'HTML (Browser Compatible)',
    description: 'Netscape Bookmark Format - importable to any browser',
  },
  {
    value: 'csv',
    label: 'CSV (Spreadsheet)',
    description: 'Comma-separated values for Excel, Google Sheets',
  },
  {
    value: 'json',
    label: 'JSON (Structured Data)',
    description: 'Full structured data with all metadata',
  },
];

export default function ExportPage() {
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
          ? buildWithCounts(folder.children as Array<{ id: string; name: string; children?: unknown[] }>)
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
      setError('Please select at least one folder');
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
  }, [format, selectedIds]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Export Bookmarks</h1>
        <p className="text-foreground-muted">
          Export your bookmarks to HTML, CSV, or JSON format.
        </p>
      </div>

      {/* Main Section */}
      <div className="mb-8 rounded-xl border border-border bg-surface p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">Format</label>
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
                      <p className="text-sm font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-foreground-muted">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Folder Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">Folders</label>
              <FolderSelectTree
                folders={folders}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-lg p-3" style={{ backgroundColor: 'var(--status-error-bg)' }}>
                <p className="text-sm" style={{ color: 'var(--status-error-text)' }}>{error}</p>
              </div>
            )}

            {/* Export Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleExport}
                loading={exporting}
                disabled={selectedIds.size === 0}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                }
              >
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Info Section */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-semibold text-foreground mb-4">Format Details</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">HTML</h3>
            <p className="text-xs text-foreground-muted mt-1">
              Standard browser bookmark format. Can be imported directly into Chrome, Firefox, Safari, Edge, and other browsers.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">CSV</h3>
            <p className="text-xs text-foreground-muted mt-1">
              Spreadsheet-compatible format with columns: url, title, description, folder, tags, created_at, is_favorite.
              Can be opened in Excel, Google Sheets, or re-imported into this app.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">JSON</h3>
            <p className="text-xs text-foreground-muted mt-1">
              Structured data format with complete folder hierarchy and all metadata.
              Useful for backups or integration with other tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
