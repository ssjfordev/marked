/**
 * Links API - List, Create
 *
 * GET /api/v1/links - List all links (with optional ?favorites=true filter)
 * POST /api/v1/links - Create a new link
 */

import { createApiClient } from '@/lib/supabase/server';
import {
  requireAuth,
  success,
  handleError,
  validateRequest,
  createLinkSchema,
  NotFoundError,
} from '@/lib/api';
import type { Tag } from '@/types/api';
import type { Database } from '@/types/database';

type LinkCanonicalRow = Database['public']['Tables']['link_canonicals']['Row'] & {
  short_id: string;
};
type TagRow = Database['public']['Tables']['tags']['Row'];

interface LinkInstanceWithCanonical {
  id: string;
  user_id: string;
  link_canonical_id: string;
  folder_id: string;
  user_title: string | null;
  user_description: string | null;
  position: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  link_canonicals: LinkCanonicalRow;
  link_tags: Array<{
    tags: TagRow;
  }>;
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const supabase = await createApiClient();
    const { searchParams } = new URL(request.url);
    const favoritesOnly = searchParams.get('favorites') === 'true';

    let query = supabase
      .from('link_instances')
      .select(
        `
        *,
        link_canonicals (id, short_id, url_key, original_url, domain, title, description, og_image, favicon, created_at, updated_at),
        link_tags (
          tags (*)
        )
      `
      )
      .eq('user_id', user.id);

    if (favoritesOnly) {
      query = query.eq('is_favorite', true).order('updated_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: links, error } = await query;

    if (error) throw error;

    const result = ((links ?? []) as unknown as LinkInstanceWithCanonical[]).map((link) => ({
      id: link.id,
      user_title: link.user_title,
      user_description: link.user_description,
      position: link.position,
      is_favorite: link.is_favorite,
      created_at: link.created_at,
      updated_at: link.updated_at,
      canonical: {
        id: link.link_canonicals.short_id,
        url_key: link.link_canonicals.url_key,
        original_url: link.link_canonicals.original_url,
        domain: link.link_canonicals.domain,
        title: link.link_canonicals.title,
        description: link.link_canonicals.description,
        og_image: link.link_canonicals.og_image,
        favicon: link.link_canonicals.favicon,
      },
      tags: link.link_tags.map((lt) => lt.tags).filter((t): t is Tag => t !== null),
    }));

    return success(result);
  } catch (err) {
    return handleError(err);
  }
}
import { canonicalizeUrl } from '@/domain/url';

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await validateRequest(request, createLinkSchema);
    const supabase = await createApiClient();

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

      // Always overwrite canonical metadata with client-provided data
      // (extension reads from actual page DOM — more accurate than enrichment)
      const updateFields: Record<string, string> = {};
      if (body.ogImage) updateFields.og_image = body.ogImage;
      if (body.pageTitle) updateFields.title = body.pageTitle;
      if (body.pageDescription) updateFields.description = body.pageDescription;

      if (Object.keys(updateFields).length > 0) {
        updateFields.updated_at = new Date().toISOString();
        await supabase.from('link_canonicals').update(updateFields).eq('id', canonicalId);
      }
    } else {
      // Create new canonical (include metadata if provided by extension)
      const hasMetadata = !!(body.pageTitle && body.ogImage);
      const insertData: Record<string, string> = {
        url_key: urlKey,
        original_url: body.url,
        domain,
      };
      if (body.ogImage) insertData.og_image = body.ogImage;
      if (body.pageTitle) insertData.title = body.pageTitle;
      if (body.pageDescription) insertData.description = body.pageDescription;
      if (hasMetadata) {
        // Extension provided metadata — use Google favicon as fallback
        const hostname = new URL(body.url).hostname;
        insertData.favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
      }

      const { data: newCanonical, error: canonicalError } = await supabase
        .from('link_canonicals')
        .insert(insertData)
        .select('id')
        .single();

      if (canonicalError) throw canonicalError;
      canonicalId = newCanonical.id;

      // Only queue enrichment if metadata is missing (e.g. import, context menu)
      // Extension provides title/ogImage/description — no need to re-fetch
      if (!hasMetadata) {
        await supabase.from('enrichment_jobs').insert({
          link_canonical_id: canonicalId,
          status: 'queued',
        });
      }
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
      .select(
        'id, short_id, url_key, original_url, domain, title, description, og_image, favicon, created_at, updated_at'
      )
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
      const { data: tagData } = await supabase.from('tags').select('id, name').in('id', tagIds);
      tags = tagData ?? [];
    }

    // Build response with short_id as canonical.id
    const response = {
      id: linkInstance.id,
      link_canonical_id: canonicalId,
      user_title: linkInstance.user_title,
      user_description: linkInstance.user_description,
      position: linkInstance.position,
      is_favorite: linkInstance.is_favorite,
      created_at: linkInstance.created_at,
      updated_at: linkInstance.updated_at,
      canonical: canonical
        ? {
            id: canonical.short_id,
            url_key: canonical.url_key,
            original_url: canonical.original_url,
            domain: canonical.domain,
            title: canonical.title,
            description: canonical.description,
            og_image: canonical.og_image,
            favicon: canonical.favicon,
          }
        : null,
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
  supabase: Awaited<ReturnType<typeof createApiClient>>,
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
