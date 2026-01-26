/**
 * Link Favorite API - Toggle favorite status
 *
 * PUT /api/v1/links/[id]/favorite - Toggle favorite
 */

import { createServiceClient } from '@/lib/supabase/server';
import {
  requireAuth,
  success,
  handleError,
  validateUuid,
  NotFoundError,
} from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    validateUuid(id, 'link id');

    const supabase = createServiceClient();

    // Get current favorite status
    const { data: existing, error: fetchError } = await supabase
      .from('link_instances')
      .select('id, is_favorite')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundError('Link not found');
    }

    // Toggle favorite
    const newFavoriteStatus = !existing.is_favorite;

    const { error } = await supabase
      .from('link_instances')
      .update({
        is_favorite: newFavoriteStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return success({ is_favorite: newFavoriteStatus });
  } catch (err) {
    return handleError(err);
  }
}
