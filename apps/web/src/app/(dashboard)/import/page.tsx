'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ExportGuideModal } from '@/components/import/ExportGuideModal';
import { getFormatDisplayName, type ImportFormat } from '@/domain/import';
import { useLocale } from '@/components/LanguageProvider';

interface ImportJob {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
  source_type: string;
  total_items: number;
  processed_items: number;
  failed_items: number;
  last_error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  progress?: number;
}

export default function ImportPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<ImportJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [wrapInFolder, setWrapInFolder] = useState(true);
  const [wrapFolderName, setWrapFolderName] = useState(() => {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const day = now.getDate();
    const year = now.getFullYear();
    return `Import · ${month} ${day}, ${year}`;
  });
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<ImportFormat | null>(null);

  // Fetch recent jobs on mount
  useEffect(() => {
    fetchRecentJobs();
  }, []);

  // Poll for job status when there's a running job
  useEffect(() => {
    if (!currentJob || currentJob.status === 'succeeded' || currentJob.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      const response = await fetch(`/api/v1/import/${currentJob.id}`);
      if (response.ok) {
        const { data } = await response.json();
        setCurrentJob(data);

        if (data.status === 'succeeded' || data.status === 'failed') {
          fetchRecentJobs();
          // Refresh the page to update sidebar folder tree
          router.refresh();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentJob, router]);

  const fetchRecentJobs = async () => {
    try {
      const response = await fetch('/api/v1/import');
      if (response.ok) {
        const { data } = await response.json();
        setRecentJobs(data);
      }
    } catch {
      // Ignore errors
    }
  };

  const isValidExtension = (filename: string): boolean => {
    const ext = filename.toLowerCase().split('.').pop();
    return ext === 'html' || ext === 'htm' || ext === 'csv';
  };

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        if (!isValidExtension(selectedFile.name)) {
          setError(t('import.onlyHtmlCsv'));
          return;
        }
        setFile(selectedFile);
        setError(null);
        setDetectedFormat(null); // Will be detected on upload
      }
    },
    [t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        if (!isValidExtension(droppedFile.name)) {
          setError(t('import.onlyHtmlCsv'));
          return;
        }
        setFile(droppedFile);
        setError(null);
        setDetectedFormat(null);
      }
    },
    [t]
  );

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wrapInFolder', wrapInFolder ? 'true' : 'false');
      formData.append('wrapFolderName', wrapFolderName);

      const response = await fetch('/api/v1/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Upload failed');
      }

      const jobData = result.data.job;
      // Calculate progress for the returned job
      if (jobData.total_items > 0) {
        jobData.progress = Math.round((jobData.processed_items / jobData.total_items) * 100);
      }
      setCurrentJob(jobData);
      if (result.data.detectedFormat) {
        setDetectedFormat(result.data.detectedFormat);
      }
      // If job already completed (sync mode), refresh sidebar
      if (jobData.status === 'succeeded' || jobData.status === 'failed') {
        fetchRecentJobs();
        router.refresh();
      }
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getStatusStyles = (status: ImportJob['status']) => {
    switch (status) {
      case 'succeeded':
        return {
          bg: 'var(--status-success-bg)',
          text: 'var(--status-success-text)',
        };
      case 'failed':
        return {
          bg: 'var(--status-error-bg)',
          text: 'var(--status-error-text)',
        };
      case 'running':
        return {
          bg: 'var(--status-info-bg)',
          text: 'var(--status-info-text)',
        };
      case 'queued':
        return {
          bg: 'var(--status-warning-bg)',
          text: 'var(--status-warning-text)',
        };
      default:
        return {
          bg: 'var(--surface-hover)',
          text: 'var(--foreground-muted)',
        };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getSourceDisplayName = (sourceType: string): string => {
    const mapping: Record<string, string> = {
      chrome_html: 'Chrome',
      firefox_html: 'Firefox',
      safari_html: 'Safari',
      edge_html: 'Edge',
      raindrop_html: 'Raindrop (HTML)',
      raindrop_csv: 'Raindrop (CSV)',
      csv: 'CSV',
    };
    return mapping[sourceType] || sourceType;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">{t('import.title')}</h1>
        <p className="text-foreground-muted">{t('import.desc')}</p>
      </div>

      {/* Main Section - Upload or Progress */}
      <div className="mb-8 rounded-xl border border-border bg-surface p-8">
        {currentJob ? (
          /* Progress Section */
          <div className="text-center">
            {currentJob.status === 'running' || currentJob.status === 'queued' ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <svg
                    className="animate-spin h-7 w-7 text-primary-light"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
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
                <h2 className="text-lg font-medium text-foreground mb-2">
                  {t('import.importing')}
                </h2>
                <p className="text-sm text-foreground-muted mb-1">
                  {t('import.processed', {
                    processed: currentJob.processed_items,
                    total: currentJob.total_items,
                  })}
                </p>
                {detectedFormat && (
                  <p className="text-xs text-foreground-muted mb-4">
                    {t('import.detectedFormat', { format: getFormatDisplayName(detectedFormat) })}
                  </p>
                )}
                <div className="max-w-md mx-auto h-2 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${currentJob.progress || 0}%` }}
                  />
                </div>
                <p className="text-xs text-foreground-muted mt-2">{currentJob.progress || 0}%</p>
              </>
            ) : currentJob.status === 'succeeded' ? (
              <>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: 'var(--status-success-bg)' }}
                >
                  <svg
                    className="w-7 h-7"
                    style={{ color: 'var(--status-success-text)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-foreground mb-2">{t('import.complete')}</h2>
                <p className="text-sm mb-2" style={{ color: 'var(--status-success-text)' }}>
                  {t('import.successCount', {
                    count: currentJob.processed_items - currentJob.failed_items,
                  })}
                  {currentJob.failed_items > 0 && (
                    <span className="text-foreground-muted">
                      {' '}
                      {t('import.failedCount', { count: currentJob.failed_items })}
                    </span>
                  )}
                </p>
                <p className="text-xs text-foreground-muted mb-6">{t('import.enrichmentNote')}</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                  >
                    {t('import.viewDashboard')}
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentJob(null)}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground-secondary transition-colors hover:bg-hover"
                  >
                    {t('import.importMore')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: 'var(--status-error-bg)' }}
                >
                  <svg
                    className="w-7 h-7"
                    style={{ color: 'var(--status-error-text)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-foreground mb-2">{t('import.failed')}</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--status-error-text)' }}>
                  {currentJob.last_error || 'An error occurred during import'}
                </p>
                <button
                  onClick={() => setCurrentJob(null)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                >
                  {t('import.tryAgain')}
                </button>
              </>
            )}
          </div>
        ) : (
          /* Upload Section */
          <div
            className={`rounded-lg border-2 border-dashed p-8 transition-all ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <svg
                  className="h-7 w-7 text-primary-light"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <p className="text-foreground mb-1">
                <label
                  htmlFor="file-input"
                  className="cursor-pointer font-medium text-primary-light hover:text-primary-dark transition-colors"
                >
                  {t('import.clickUpload')}
                </label>{' '}
                {t('import.orDragDrop')}
              </p>
              <p className="text-sm text-foreground-muted">{t('import.fileTypes')}</p>

              <input
                id="file-input"
                type="file"
                accept=".html,.htm,.csv"
                onChange={handleFileChange}
                className="hidden"
              />

              {error && (
                <div
                  className="mt-5 rounded-lg p-3"
                  style={{ backgroundColor: 'var(--status-error-bg)' }}
                >
                  <p className="text-sm" style={{ color: 'var(--status-error-text)' }}>
                    {error}
                  </p>
                </div>
              )}

              {file ? (
                <div className="mt-6 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-hover px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-primary-light"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-foreground-muted">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="ml-4 p-1.5 rounded-lg hover:bg-hover text-foreground-muted hover:text-foreground transition-colors"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
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
                        {t('import.starting')}
                      </>
                    ) : (
                      <>
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        {t('import.startImport')}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    onClick={() => document.getElementById('file-input')?.click()}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                  >
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
                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {t('import.selectFile')}
                  </button>
                  <button
                    onClick={() => setShowGuideModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground-secondary transition-colors hover:bg-hover"
                  >
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
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {t('import.help')}
                  </button>
                </div>
              )}

              {/* Wrap in folder option */}
              <div className="mt-5 flex flex-col gap-2 w-full max-w-xs mx-auto">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={wrapInFolder}
                    onChange={(e) => setWrapInFolder(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-foreground-secondary">
                    {t('import.wrapInFolder')}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-foreground-muted whitespace-nowrap">
                    {t('import.parentFolderName')}
                  </span>
                  <input
                    type="text"
                    value={wrapFolderName}
                    onChange={(e) => setWrapFolderName(e.target.value)}
                    disabled={!wrapInFolder}
                    maxLength={100}
                    className="flex-1 px-2 py-1 text-[11px] border border-border rounded bg-transparent text-foreground-secondary focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-40 disabled:cursor-not-allowed"
                    placeholder={t('import.folderName')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Supported Formats */}
      <div className="mb-8 rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">{t('import.supportedFormats')}</h2>
          <button
            onClick={() => setShowGuideModal(true)}
            className="text-xs text-primary-light hover:text-primary-dark transition-colors"
          >
            {t('import.viewExportGuide')}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { name: 'Chrome', icon: '🌐' },
            { name: 'Firefox', icon: '🦊' },
            { name: 'Safari', icon: '🧭' },
            { name: 'Edge', icon: '🔷' },
            { name: 'Raindrop', icon: '💧' },
            { name: 'CSV', icon: '📊' },
          ].map((browser) => (
            <div
              key={browser.name}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-hover"
            >
              <span className="text-lg">{browser.icon}</span>
              <span className="text-sm text-foreground-secondary">{browser.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Jobs */}
      {recentJobs.length > 0 && !currentJob && (
        <div>
          <h2 className="font-semibold text-foreground mb-4">{t('import.recentImports')}</h2>
          <div className="space-y-2">
            {recentJobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('import.bookmarksImported', {
                      count: job.processed_items - job.failed_items,
                    })}
                  </p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    {getSourceDisplayName(job.source_type)} · {formatDate(job.created_at)}
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium capitalize"
                  style={{
                    backgroundColor: getStatusStyles(job.status).bg,
                    color: getStatusStyles(job.status).text,
                  }}
                >
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Guide Modal */}
      <ExportGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
    </div>
  );
}
