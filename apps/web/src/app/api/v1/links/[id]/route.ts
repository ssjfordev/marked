/**
 * Link API - Get, Update, Delete
 *
 * GET /api/v1/links/[id] - Get link details
 * PATCH /api/v1/links/[id] - Update link instance
 * DELETE /api/v1/links/[id] - Delete link instance
 */

import { createApiClient } from '@/lib/supabase/server';
import {
  requireAuth,
  success,
  handleError,
  validateRequest,
  validateUuid,
  updateLinkSchema,
  NotFoundError,
} from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    validateUuid(id, 'link id');

    const supabase = await createApiClient();

    const { data: link, error } = await supabase
      .from('link_instances')
      .select(
        `
        *,
        link_canonicals (*),
        link_tags (
          tags (*)
        )
      `
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !link) {
      throw new NotFoundError('Link not found');
    }

    return success(link);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    validateUuid(id, 'link id');

    const body = await validateRequest(request, updateLinkSchema);
    const supabase = await createApiClient();

    // Check link exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('link_instances')
      .select('id, link_canonical_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundError('Link not found');
    }

    // Always overwrite canonical metadata with client-provided data
    if (existing.link_canonical_id) {
      const canonicalUpdate: Record<string, string> = {};
      if (body.pageTitle) canonicalUpdate.title = body.pageTitle;
      if (body.pageDescription) canonicalUpdate.description = body.pageDescription;
      if (body.ogImage) canonicalUpdate.og_image = body.ogImage;

      if (Object.keys(canonicalUpdate).length > 0) {
        canonicalUpdate.updated_at = new Date().toISOString();
        await supabase
          .from('link_canonicals')
          .update(canonicalUpdate)
          .eq('id', existing.link_canonical_id);
      }
    }

    // If moving to new folder, verify folder exists (by short_id)
    let folderUuid: string | undefined;
    if (body.folderId) {
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('id')
        .eq('short_id', body.folderId)
        .eq('user_id', user.id)
        .single();

      if (folderError || !folder) {
        throw new NotFoundError('Target folder not found');
      }
      folderUuid = folder.id;
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (folderUuid !== undefined) updates.folder_id = folderUuid;
    if (body.userTitle !== undefined) updates.user_title = body.userTitle;
    if (body.userDescription !== undefined) updates.user_description = body.userDescription;
    if (body.position !== undefined) updates.position = body.position;

    if (Object.keys(updates).length === 0) {
      // Nothing to update, return current state
      const { data: link } = await supabase
        .from('link_instances')
        .select(
          `
          *,
          link_canonicals (*),
          link_tags (
            tags (*)
          )
        `
        )
        .eq('id', id)
        .single();
      return success(link);
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('link_instances')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    // Fetch updated link with relations
    const { data: link } = await supabase
      .from('link_instances')
      .select(
        `
        *,
        link_canonicals (*),
        link_tags (
          tags (*)
        )
      `
      )
      .eq('id', id)
      .single();

    return success(link);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    validateUuid(id, 'link id');

    const supabase = await createApiClient();

    // Check link exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('link_instances')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundError('Link not found');
    }

    // Delete link instance (link_tags cascade will handle junction table)
    const { error } = await supabase
      .from('link_instances')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return success({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
