/**
 * Folder API - Get, Update, Delete
 *
 * GET /api/v1/folders/[id] - Get folder details (id = short_id)
 * PATCH /api/v1/folders/[id] - Update folder (rename, move)
 * DELETE /api/v1/folders/[id] - Delete folder
 */

import { createServiceClient } from '@/lib/supabase/server';
import {
  requireAuth,
  success,
  handleError,
  validateRequest,
  updateFolderSchema,
  NotFoundError,
} from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Transform folder to use short_id as id
 */
function transformFolder(folder: {
  id: string;
  short_id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}, parentShortId: string | null = null) {
  return {
    id: folder.short_id,
    name: folder.name,
    icon: folder.icon,
    parent_id: parentShortId,
    position: folder.position,
    created_at: folder.created_at,
    updated_at: folder.updated_at,
  };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: shortId } = await params;

    const supabase = createServiceClient();

    const { data: folder, error } = await supabase
      .from('folders')
      .select('id, short_id, name, icon, parent_id, position, created_at, updated_at')
      .eq('short_id', shortId)
      .eq('user_id', user.id)
      .single();

    if (error || !folder) {
      throw new NotFoundError('Folder not found');
    }

    // Resolve parent short_id if exists
    let parentShortId: string | null = null;
    if (folder.parent_id) {
      const { data: parent } = await supabase
        .from('folders')
        .select('short_id')
        .eq('id', folder.parent_id)
        .single();
      parentShortId = parent?.short_id ?? null;
    }

    return success(transformFolder(folder, parentShortId));
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: shortId } = await params;

    const body = await validateRequest(request, updateFolderSchema);
    const supabase = createServiceClient();

    // Get folder by short_id
    const { data: existing, error: fetchError } = await supabase
      .from('folders')
      .select('id, short_id, name, icon, parent_id, position, created_at, updated_at')
      .eq('short_id', shortId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundError('Folder not found');
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.description !== undefined) updates.description = body.description;
    if (body.position !== undefined) updates.position = body.position;

    // Resolve parent short_id to UUID if provided
    if (body.parentId !== undefined) {
      if (body.parentId === null) {
        updates.parent_id = null;
      } else {
        const { data: parent } = await supabase
          .from('folders')
          .select('id')
          .eq('short_id', body.parentId)
          .eq('user_id', user.id)
          .single();

        if (!parent) {
          throw new NotFoundError('Parent folder not found');
        }
        updates.parent_id = parent.id;
      }
    }

    if (Object.keys(updates).length === 0) {
      // Nothing to update, return current
      let parentShortId: string | null = null;
      if (existing.parent_id) {
        const { data: parent } = await supabase
          .from('folders')
          .select('short_id')
          .eq('id', existing.parent_id)
          .single();
        parentShortId = parent?.short_id ?? null;
      }
      return success(transformFolder(existing, parentShortId));
    }

    updates.updated_at = new Date().toISOString();

    const { data: folder, error } = await supabase
      .from('folders')
      .update(updates)
      .eq('id', existing.id)
      .eq('user_id', user.id)
      .select('id, short_id, name, icon, parent_id, position, created_at, updated_at')
      .single();

    if (error) throw error;

    // Resolve parent short_id
    let parentShortId: string | null = null;
    if (folder.parent_id) {
      const { data: parent } = await supabase
        .from('folders')
        .select('short_id')
        .eq('id', folder.parent_id)
        .single();
      parentShortId = parent?.short_id ?? null;
    }

    return success(transformFolder(folder, parentShortId));
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: shortId } = await params;

    const supabase = createServiceClient();

    // Get folder by short_id
    const { data: existing, error: fetchError } = await supabase
      .from('folders')
      .select('id')
      .eq('short_id', shortId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundError('Folder not found');
    }

    // Delete folder (cascade will handle child folders and links)
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', existing.id)
      .eq('user_id', user.id);

    if (error) throw error;

    return success({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
