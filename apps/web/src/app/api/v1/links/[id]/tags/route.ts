/**
 * Link Tags API - Add tag to link
 *
 * POST /api/v1/links/[id]/tags - Add a tag to a link
 */

import { createServerClient } from '@/lib/supabase/server';
import {
  requireAuth,
  success,
  handleError,
  validateRequest,
  validateUuid,
  addTagToLinkSchema,
  NotFoundError,
} from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: linkId } = await params;
    validateUuid(linkId, 'link id');

    const body = await validateRequest(request, addTagToLinkSchema);
    const supabase = await createServerClient();

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

    // Get or create tag
    let tagId: string;

    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', body.tagName)
      .maybeSingle();

    if (existingTag) {
      tagId = existingTag.id;
    } else {
      const { data: newTag, error: tagError } = await supabase
        .from('tags')
        .insert({
          user_id: user.id,
          name: body.tagName,
        })
        .select('id')
        .single();

      if (tagError) throw tagError;
      tagId = newTag.id;
    }

    // Link tag to instance (upsert to handle duplicates gracefully)
    const { error: linkTagError } = await supabase.from('link_tags').upsert(
      {
        link_instance_id: linkId,
        tag_id: tagId,
      },
      { onConflict: 'link_instance_id,tag_id' }
    );

    if (linkTagError) throw linkTagError;

    // Get the tag details
    const { data: tag } = await supabase.from('tags').select('*').eq('id', tagId).single();

    return success(tag, 201);
  } catch (err) {
    return handleError(err);
  }
}
