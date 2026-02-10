/**
 * Link Tag API - Remove tag from link
 *
 * DELETE /api/v1/links/[id]/tags/[tagId] - Remove a tag from a link
 */

import { createApiClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError, validateUuid, NotFoundError } from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string; tagId: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: linkId, tagId } = await params;
    validateUuid(linkId, 'link id');
    validateUuid(tagId, 'tag id');

    const supabase = await createApiClient();

    // Check link exists and belongs to user
    const { data: link, error: linkError } = await supabase
      .from('link_instances')
      .select('id')
      .eq('id', linkId)
      .eq('user_id', user.id)
      .single();

    if (linkError || !link) {
      throw new NotFoundError('Link not found');
    }

    // Check tag exists and belongs to user
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('id', tagId)
      .eq('user_id', user.id)
      .single();

    if (tagError || !tag) {
      throw new NotFoundError('Tag not found');
    }

    // Remove the link-tag association
    const { error: deleteError } = await supabase
      .from('link_tags')
      .delete()
      .eq('link_instance_id', linkId)
      .eq('tag_id', tagId);

    if (deleteError) throw deleteError;

    return success({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
