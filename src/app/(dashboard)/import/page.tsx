'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ImportJob {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
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
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<ImportJob[]>([]);
  const [error, setError] = useState<string | null>(null);

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
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentJob]);

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

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Upload failed');
      }

      setCurrentJob(result.data.job);
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

  const getStatusColor = (status: ImportJob['status']) => {
    switch (status) {
      case 'succeeded':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'running':
        return 'text-blue-600 bg-blue-50';
      case 'queued':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Import Bookmarks</h1>
      <p className="mb-8 text-gray-600">
        Upload your Chrome bookmarks HTML file to import your existing bookmarks.
      </p>

      {/* Upload Section */}
      <div className="mb-8 rounded-lg border-2 border-dashed border-gray-300 p-8">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="mb-2 text-sm text-gray-600">
            <label
              htmlFor="file-input"
              className="cursor-pointer font-medium text-blue-600 hover:text-blue-500"
            >
              Click to upload
            </label>{' '}
            or drag and drop
          </p>
          <p className="text-xs text-gray-500">Chrome bookmarks HTML file (max 10MB)</p>

          <input
            id="file-input"
            type="file"
            accept=".html,.htm"
            onChange={handleFileChange}
            className="hidden"
          />

          {file && (
            <div className="mt-4 rounded-md bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="mt-4 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Start Import'}
          </button>
        </div>
      </div>

      {/* How to Export Section */}
      <div className="mb-8 rounded-lg bg-gray-50 p-6">
        <h2 className="mb-3 font-semibold">How to export Chrome bookmarks</h2>
        <ol className="list-inside list-decimal space-y-2 text-sm text-gray-600">
          <li>Open Chrome and go to Bookmark Manager (Ctrl+Shift+O / Cmd+Shift+O)</li>
          <li>Click the three-dot menu in the top right</li>
          <li>Select &quot;Export bookmarks&quot;</li>
          <li>Save the HTML file and upload it here</li>
        </ol>
      </div>

      {/* Current Job Progress */}
      {currentJob && (
        <div className="mb-8 rounded-lg border border-gray-200 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Import Progress</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(currentJob.status)}`}
            >
              {currentJob.status}
            </span>
          </div>

          {currentJob.status === 'running' && (
            <>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${currentJob.progress || 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {currentJob.processed_items} / {currentJob.total_items} items processed
                {currentJob.failed_items > 0 && (
                  <span className="text-red-600"> ({currentJob.failed_items} failed)</span>
                )}
              </p>
            </>
          )}

          {currentJob.status === 'succeeded' && (
            <div className="text-sm text-gray-600">
              <p className="text-green-600">
                Successfully imported {currentJob.processed_items - currentJob.failed_items}{' '}
                bookmarks
              </p>
              {currentJob.failed_items > 0 && (
                <p className="text-yellow-600">
                  {currentJob.failed_items} items could not be imported
                </p>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 text-blue-600 hover:underline"
              >
                View your bookmarks →
              </button>
            </div>
          )}

          {currentJob.status === 'failed' && (
            <div className="text-sm text-red-600">
              <p>Import failed: {currentJob.last_error || 'Unknown error'}</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Jobs */}
      {recentJobs.length > 0 && !currentJob && (
        <div>
          <h2 className="mb-4 font-semibold">Recent Imports</h2>
          <div className="space-y-3">
            {recentJobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div>
                  <p className="text-sm font-medium">
                    {job.processed_items - job.failed_items} bookmarks imported
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(job.created_at)}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(job.status)}`}
                >
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
