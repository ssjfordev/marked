/**
 * Folder Share API
 *
 * POST /api/v1/folders/[id]/share - Generate share link
 * DELETE /api/v1/folders/[id]/share - Revoke share link
 */

import { createServiceClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError, NotFoundError } from '@/lib/api';

function generateShareId(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Generate a share link for a folder
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: shortId } = await params;
    const supabase = createServiceClient();

    // Get folder by short_id
    const { data: folder, error: fetchError } = await supabase
      .from('folders')
      .select('id, short_id, name, share_id')
      .eq('short_id', shortId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !folder) {
      throw new NotFoundError('Folder not found');
    }

    // If already has share_id, return existing
    if (folder.share_id) {
      return success({
        shareId: folder.share_id,
        shareUrl: `/s/${folder.share_id}`,
      });
    }

    // Generate new share_id
    const shareId = generateShareId(12);

    const { error: updateError } = await supabase
      .from('folders')
      .update({ share_id: shareId, updated_at: new Date().toISOString() })
      .eq('id', folder.id)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return success({
      shareId,
      shareUrl: `/s/${shareId}`,
    });
  } catch (err) {
    return handleError(err);
  }
}

/**
 * Revoke share link for a folder
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: shortId } = await params;
    const supabase = createServiceClient();

    // Get folder by short_id
    const { data: folder, error: fetchError } = await supabase
      .from('folders')
      .select('id')
      .eq('short_id', shortId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !folder) {
      throw new NotFoundError('Folder not found');
    }

    // Remove share_id
    const { error: updateError } = await supabase
      .from('folders')
      .update({ share_id: null, updated_at: new Date().toISOString() })
      .eq('id', folder.id)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return success({ revoked: true });
  } catch (err) {
    return handleError(err);
  }
}
