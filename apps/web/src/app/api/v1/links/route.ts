/**
 * Links API - Create
 *
 * POST /api/v1/links - Create a new link
 *
 * This handles URL deduplication via url_key:
 * 1. Canonicalize the URL to get url_key
 * 2. Check if link_canonical with that url_key exists
 * 3. If not, create new link_canonical
 * 4. Create link_instance pointing to the canonical
 * 5. Handle tags (create if not exist, link to instance)
 */

import { createServerClient } from '@/lib/supabase/server';
import {
  requireAuth,
  success,
  handleError,
  validateRequest,
  createLinkSchema,
  NotFoundError,
} from '@/lib/api';
import { canonicalizeUrl } from '@/domain/url';

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await validateRequest(request, createLinkSchema);
    const supabase = await createServerClient();

    // Verify folder exists and belongs to user (by short_id)
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('id')
      .eq('short_id', body.folderId)
      .eq('user_id', user.id)
      .single();

    if (folderError || !folder) {
      throw new NotFoundError('Folder not found');
    }

    // Canonicalize the URL
    const { urlKey, domain } = canonicalizeUrl(body.url);

    // Check if canonical already exists
    let canonicalId: string;

    const { data: existingCanonical } = await supabase
      .from('link_canonicals')
      .select('id')
      .eq('url_key', urlKey)
      .maybeSingle();

    if (existingCanonical) {
      canonicalId = existingCanonical.id;
    } else {
      // Create new canonical
      const { data: newCanonical, error: canonicalError } = await supabase
        .from('link_canonicals')
        .insert({
          url_key: urlKey,
          original_url: body.url,
          domain,
        })
        .select('id')
        .single();

      if (canonicalError) throw canonicalError;
      canonicalId = newCanonical.id;

      // Queue enrichment job for new canonical
      await supabase.from('enrichment_jobs').insert({
        link_canonical_id: canonicalId,
        status: 'queued',
      });
    }

    // Get max position in folder (use resolved folder UUID)
    const { data: maxPosData } = await supabase
      .from('link_instances')
      .select('position')
      .eq('folder_id', folder.id)
      .eq('user_id', user.id)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newPosition = (maxPosData?.position ?? -1) + 1;

    // Create link instance (use resolved folder UUID)
    const { data: linkInstance, error: instanceError } = await supabase
      .from('link_instances')
      .insert({
        user_id: user.id,
        link_canonical_id: canonicalId,
        folder_id: folder.id,
        user_title: body.userTitle ?? null,
        user_description: body.userDescription ?? null,
        position: newPosition,
      })
      .select('*')
      .single();

    if (instanceError) throw instanceError;

    // Handle tags if provided
    if (body.tags && body.tags.length > 0) {
      await handleTags(supabase, user.id, linkInstance.id, body.tags);
    }

    // Fetch canonical separately for type safety
    const { data: canonical } = await supabase
      .from('link_canonicals')
      .select('id, short_id, url_key, original_url, domain, title, description, og_image, favicon, created_at, updated_at')
      .eq('id', canonicalId)
      .single();

    // Fetch tags for this instance
    const { data: linkTags } = await supabase
      .from('link_tags')
      .select('tag_id')
      .eq('link_instance_id', linkInstance.id);

    let tags: { id: string; name: string }[] = [];
    if (linkTags && linkTags.length > 0) {
      const tagIds = linkTags.map((lt) => lt.tag_id);
      const { data: tagData } = await supabase
        .from('tags')
        .select('id, name')
        .in('id', tagIds);
      tags = tagData ?? [];
    }

    // Build response with short_id as canonical.id
    const response = {
      id: linkInstance.id,
      user_title: linkInstance.user_title,
      user_description: linkInstance.user_description,
      position: linkInstance.position,
      is_favorite: linkInstance.is_favorite,
      created_at: linkInstance.created_at,
      updated_at: linkInstance.updated_at,
      canonical: canonical ? {
        id: canonical.short_id,
        url_key: canonical.url_key,
        original_url: canonical.original_url,
        domain: canonical.domain,
        title: canonical.title,
        description: canonical.description,
        og_image: canonical.og_image,
        favicon: canonical.favicon,
      } : null,
      tags,
    };

    return success(response, 201);
  } catch (err) {
    return handleError(err);
  }
}

/**
 * Handle tag creation and linking
 */
async function handleTags(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  linkInstanceId: string,
  tagNames: string[]
): Promise<void> {
  for (const tagName of tagNames) {
    // Get or create tag
    let tagId: string;

    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('user_id', userId)
      .eq('name', tagName)
      .maybeSingle();

    if (existingTag) {
      tagId = existingTag.id;
    } else {
      const { data: newTag, error: tagError } = await supabase
        .from('tags')
        .insert({
          user_id: userId,
          name: tagName,
        })
        .select('id')
        .single();

      if (tagError) throw tagError;
      tagId = newTag.id;
    }

    // Link tag to instance (ignore if already linked)
    await supabase.from('link_tags').upsert(
      {
        link_instance_id: linkInstanceId,
        tag_id: tagId,
      },
      { onConflict: 'link_instance_id,tag_id' }
    );
  }
}
