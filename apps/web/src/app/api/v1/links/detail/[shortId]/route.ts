/**
 * Link Detail API - Full asset page data by canonical short_id
 *
 * GET /api/v1/links/detail/[shortId] - Get all data needed for the asset page
 */

import { createServiceClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError, NotFoundError } from '@/lib/api';
import { canAccessAssetPage, canAccessMemo } from '@/domain/entitlement/checker';
import type { SubscriptionPlan, SubscriptionStatus } from '@/domain/entitlement/checker';

interface RouteParams {
  params: Promise<{ shortId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { shortId } = await params;
    const supabase = createServiceClient();

    // Fetch canonical by short_id
    const { data: canonical } = await supabase
      .from('link_canonicals')
      .select('*')
      .eq('short_id', shortId)
      .single();

    if (!canonical) {
      throw new NotFoundError('Link not found');
    }

    // Run remaining queries in parallel
    const [instanceResult, subscriptionResult, marksResult] = await Promise.all([
      supabase
        .from('link_instances')
        .select('id, user_title, user_description, folder_id')
        .eq('link_canonical_id', canonical.id)
        .eq('user_id', user.id)
        .limit(1)
        .single(),
      supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('marks')
        .select('*')
        .eq('link_canonical_id', canonical.id)
        .eq('user_id', user.id)
        .order('position'),
    ]);

    const instance = instanceResult.data;
    if (!instance) {
      throw new NotFoundError('Link not found');
    }

    const subscription = subscriptionResult.data;
    const entitlement = subscription
      ? {
          plan: subscription.plan as SubscriptionPlan,
          status: subscription.status as SubscriptionStatus,
        }
      : null;

    const hasAssetPageAccess = canAccessAssetPage(entitlement);
    const hasMemoAccess = canAccessMemo(entitlement);

    // Parallel: folder, tags, memo
    const [folderResult, linkTagsResult, memoResult] = await Promise.all([
      instance.folder_id
        ? supabase.from('folders').select('short_id, name').eq('id', instance.folder_id).single()
        : Promise.resolve({ data: null }),
      supabase.from('link_tags').select('tag_id').eq('link_instance_id', instance.id),
      hasMemoAccess
        ? supabase
            .from('memos')
            .select('*')
            .eq('link_canonical_id', canonical.id)
            .eq('user_id', user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    // Resolve tags
    let tags: { id: string; name: string }[] = [];
    const linkTags = linkTagsResult.data;
    if (linkTags && linkTags.length > 0) {
      const tagIds = linkTags.map((lt) => lt.tag_id);
      const { data: tagData } = await supabase.from('tags').select('id, name').in('id', tagIds);
      tags = tagData ?? [];
    }

    const folder = folderResult.data
      ? { id: folderResult.data.short_id, name: folderResult.data.name }
      : null;

    return success({
      canonical: {
        ...canonical,
        id: canonical.short_id,
      },
      instance: {
        id: instance.id,
        user_title: instance.user_title,
        user_description: instance.user_description,
      },
      folder,
      tags,
      marks: marksResult.data ?? [],
      memo: memoResult.data,
      hasAssetPageAccess,
      hasMemoAccess,
    });
  } catch (err) {
    return handleError(err);
  }
}
