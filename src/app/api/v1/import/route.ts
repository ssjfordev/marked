/**
 * Import API - Create and list import jobs
 *
 * POST /api/v1/import - Create a new import job with uploaded HTML file
 * GET /api/v1/import - List user's import jobs
 */

import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError, ValidationError } from '@/lib/api';
import { processImportJob } from '@/lib/import/import-processor';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new ValidationError('No file uploaded');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError('File too large. Maximum size is 10MB.');
    }

    // Read file content
    const htmlContent = await file.text();

    if (
      !htmlContent.includes('<!DOCTYPE NETSCAPE-Bookmark-file-1>') &&
      !htmlContent.includes('<DL>')
    ) {
      throw new ValidationError(
        'Invalid bookmarks file format. Please upload a Chrome bookmarks HTML export.'
      );
    }

    const supabase = createServiceClient();

    // Create import job record
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        user_id: user.id,
        source_type: 'chrome_html',
        status: 'queued',
        total_items: 0,
        processed_items: 0,
        failed_items: 0,
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Start processing in the background
    // Note: In production, this would be handled by a worker
    // For now, we process inline but return immediately
    processImportJob(job.id, user.id, htmlContent).catch((err) => {
      console.error('Import job failed:', err);
    });

    return success({ job }, 201);
  } catch (err) {
    return handleError(err);
  }
}

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createServerClient();

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
