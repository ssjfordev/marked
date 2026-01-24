/**
 * Import Job API - Get status
 *
 * GET /api/v1/import/[id] - Get import job status and progress
 */

import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError, validateUuid, NotFoundError } from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    validateUuid(id, 'job id');

    const supabase = await createServerClient();

    const { data: job, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !job) {
      throw new NotFoundError('Import job not found');
    }

    // Calculate progress percentage
    const progress =
      job.total_items > 0 ? Math.round((job.processed_items / job.total_items) * 100) : 0;

    return success({
      ...job,
      progress,
    });
  } catch (err) {
    return handleError(err);
  }
}
