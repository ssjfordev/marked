/**
 * Folder API - Get, Update, Delete
 *
 * GET /api/v1/folders/[id] - Get folder details
 * PATCH /api/v1/folders/[id] - Update folder (rename, move)
 * DELETE /api/v1/folders/[id] - Delete folder
 */

import { createServerClient } from '@/lib/supabase/server';
import {
  requireAuth,
  success,
  handleError,
  validateRequest,
  validateUuid,
  updateFolderSchema,
  NotFoundError,
} from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    validateUuid(id, 'folder id');

    const supabase = await createServerClient();

    const { data: folder, error } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !folder) {
      throw new NotFoundError('Folder not found');
    }

    return success(folder);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    validateUuid(id, 'folder id');

    const body = await validateRequest(request, updateFolderSchema);
    const supabase = await createServerClient();

    // Check folder exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('folders')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundError('Folder not found');
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.parentId !== undefined) updates.parent_id = body.parentId;
    if (body.position !== undefined) updates.position = body.position;

    if (Object.keys(updates).length === 0) {
      // Nothing to update
      const { data: folder } = await supabase.from('folders').select('*').eq('id', id).single();
      return success(folder);
    }

    updates.updated_at = new Date().toISOString();

    const { data: folder, error } = await supabase
      .from('folders')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return success(folder);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    validateUuid(id, 'folder id');

    const supabase = await createServerClient();

    // Check folder exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('folders')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundError('Folder not found');
    }

    // Delete folder (cascade will handle child folders and links)
    const { error } = await supabase.from('folders').delete().eq('id', id).eq('user_id', user.id);

    if (error) throw error;

    return success({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
