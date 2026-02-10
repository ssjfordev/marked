/**
 * Bulk Link Operations API
 *
 * POST /api/v1/links/bulk - Perform bulk operations on multiple links
 *
 * Actions:
 * - delete: Delete multiple links
 * - addTag: Add a tag to multiple links
 * - removeTag: Remove a tag from multiple links
 * - move: Move multiple links to a folder
 * - favorite: Mark multiple links as favorite
 * - unfavorite: Remove favorite from multiple links
 */

import { z } from 'zod';
import { createApiClient } from '@/lib/supabase/server';
import {
  requireAuth,
  success,
  handleError,
  validateRequest,
  ValidationError,
  NotFoundError,
} from '@/lib/api';
import { sanitizeText, TEXT_LIMITS } from '@/lib/api/sanitize';

const sanitized = z.string().transform((val) => sanitizeText(val));

const bulkOperationSchema = z.object({
  action: z.enum(['delete', 'addTag', 'removeTag', 'move', 'favorite', 'unfavorite']),
  linkIds: z.array(z.string().uuid()).min(1).max(100),
  tagName: sanitized.pipe(z.string().min(1).max(TEXT_LIMITS.NAME)).optional(),
  tagId: z.string().uuid().optional(),
  folderId: z.string().min(1).max(16).optional(), // short_id (not UUID)
});

interface BulkResult {
  id: string;
  success: boolean;
  error?: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await validateRequest(request, bulkOperationSchema);
    const supabase = await createApiClient();

    const { action, linkIds } = body;
    const results: BulkResult[] = [];
    let affected = 0;

    // Verify all links belong to the user
    const { data: userLinks, error: fetchError } = await supabase
      .from('link_instances')
      .select('id')
      .eq('user_id', user.id)
      .in('id', linkIds);

    if (fetchError) throw fetchError;

    const validLinkIds = new Set(userLinks?.map((l) => l.id) || []);
    const invalidIds = linkIds.filter((id) => !validLinkIds.has(id));

    // Mark invalid links as failed
    for (const id of invalidIds) {
      results.push({ id, success: false, error: 'Link not found or access denied' });
    }

    const validIds = linkIds.filter((id) => validLinkIds.has(id));

    if (validIds.length === 0) {
      return success({ success: true, affected: 0, results });
    }

    switch (action) {
      case 'delete': {
        const { error } = await supabase
          .from('link_instances')
          .delete()
          .eq('user_id', user.id)
          .in('id', validIds);

        if (error) throw error;

        for (const id of validIds) {
          results.push({ id, success: true });
          affected++;
        }
        break;
      }

      case 'addTag': {
        if (!body.tagName) {
          throw new ValidationError('tagName is required for addTag action');
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
          const { data: newTag, error: createError } = await supabase
            .from('tags')
            .insert({ user_id: user.id, name: body.tagName })
            .select('id')
            .single();

          if (createError) throw createError;
          tagId = newTag.id;
        }

        // Add tag to all links (upsert to handle duplicates)
        for (const linkId of validIds) {
          const { error } = await supabase
            .from('link_tags')
            .upsert(
              { link_instance_id: linkId, tag_id: tagId },
              { onConflict: 'link_instance_id,tag_id' }
            );

          if (error) {
            results.push({ id: linkId, success: false, error: error.message });
          } else {
            results.push({ id: linkId, success: true });
            affected++;
          }
        }
        break;
      }

      case 'removeTag': {
        if (!body.tagId) {
          throw new ValidationError('tagId is required for removeTag action');
        }

        const { error } = await supabase
          .from('link_tags')
          .delete()
          .eq('tag_id', body.tagId)
          .in('link_instance_id', validIds);

        if (error) throw error;

        for (const id of validIds) {
          results.push({ id, success: true });
          affected++;
        }
        break;
      }

      case 'move': {
        if (!body.folderId) {
          throw new ValidationError('folderId is required for move action');
        }

        // Verify folder belongs to user (by short_id)
        const { data: folder, error: folderError } = await supabase
          .from('folders')
          .select('id')
          .eq('short_id', body.folderId)
          .eq('user_id', user.id)
          .single();

        if (folderError || !folder) {
          throw new NotFoundError('Target folder not found');
        }

        const { error } = await supabase
          .from('link_instances')
          .update({ folder_id: folder.id, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .in('id', validIds);

        if (error) throw error;

        for (const id of validIds) {
          results.push({ id, success: true });
          affected++;
        }
        break;
      }

      case 'favorite': {
        const { error } = await supabase
          .from('link_instances')
          .update({ is_favorite: true, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .in('id', validIds);

        if (error) throw error;

        for (const id of validIds) {
          results.push({ id, success: true });
          affected++;
        }
        break;
      }

      case 'unfavorite': {
        const { error } = await supabase
          .from('link_instances')
          .update({ is_favorite: false, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .in('id', validIds);

        if (error) throw error;

        for (const id of validIds) {
          results.push({ id, success: true });
          affected++;
        }
        break;
      }

      default:
        throw new ValidationError(`Unknown action: ${action}`);
    }

    return success({ success: true, affected, results });
  } catch (err) {
    return handleError(err);
  }
}
