/**
 * Import API - Create and list import jobs
 *
 * POST /api/v1/import - Create a new import job with uploaded HTML/CSV file
 * GET /api/v1/import - List user's import jobs
 */

import { after } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError, ValidationError } from '@/lib/api';
import { processImportJob } from '@/lib/import/import-processor';
import { detectFormat, isValidImportExtension, type ImportFormat } from '@/domain/import';
import type { Database } from '@/types/database';

export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type SourceType = Database['public']['Tables']['import_jobs']['Insert']['source_type'];

// Map ImportFormat to source_type for database
function formatToSourceType(format: ImportFormat): SourceType {
  const mapping: Record<ImportFormat, SourceType> = {
    chrome: 'chrome_html',
    firefox: 'firefox_html',
    safari: 'safari_html',
    edge: 'edge_html',
    'raindrop-html': 'raindrop_html',
    'raindrop-csv': 'raindrop_csv',
    csv: 'csv',
  };
  return mapping[format];
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const wrapInFolder = formData.get('wrapInFolder') === 'true';
    const wrapFolderName = (formData.get('wrapFolderName') as string) || null;

    if (!file) {
      throw new ValidationError('No file uploaded');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError('File too large. Maximum size is 10MB.');
    }

    // Validate file extension
    if (!isValidImportExtension(file.name)) {
      throw new ValidationError('Invalid file type. Please upload an HTML or CSV file.');
    }

    // Read file content
    const fileContent = await file.text();

    // Detect format
    const { format, confidence } = detectFormat(fileContent, file.name);

    // Validate content based on format
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'html' || ext === 'htm') {
      if (
        !fileContent.toLowerCase().includes('<!doctype netscape-bookmark-file-1>') &&
        !fileContent.includes('<DL>') &&
        !fileContent.includes('<dl>')
      ) {
        throw new ValidationError(
          'Invalid bookmarks file format. Please upload a browser bookmarks HTML export.'
        );
      }
    } else if (ext === 'csv') {
      const firstLine = fileContent.split('\n')[0]?.toLowerCase() || '';
      if (!firstLine.includes('url')) {
        throw new ValidationError('Invalid CSV format. The file must have a "url" column.');
      }
    }

    const supabase = createServiceClient();

    // Create import job record
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        user_id: user.id,
        source_type: formatToSourceType(format),
        status: 'queued',
        total_items: 0,
        processed_items: 0,
        failed_items: 0,
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Run import asynchronously — return immediately so FE can poll progress
    after(async () => {
      try {
        const result = await processImportJob(job.id, user.id, fileContent, format, {
          wrapInFolder,
          wrapFolderName,
        });

        console.log('[Import] Job completed:', {
          jobId: job.id,
          format,
          confidence,
          linksCreated: result.linksCreated,
          linksSkipped: result.linksSkipped,
          failedCount: result.failedBookmarks.length,
        });
      } catch (err) {
        console.error('[Import] Background job failed:', err);
      }
    });

    return success({ job, detectedFormat: format }, 201);
  } catch (err) {
    return handleError(err);
  }
}

export async function GET() {
  try {
    const user = await requireAuth();
    // Use service client to bypass RLS (we check user_id manually)
    const supabase = createServiceClient();

    const { data: jobs, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return success(jobs ?? []);
  } catch (err) {
    return handleError(err);
  }
}
