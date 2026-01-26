import { requireUser } from '@/lib/auth/actions';
import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { canAccessAssetPage, canAccessMemo } from '@/domain/entitlement/checker';
import { AssetPageClient } from './AssetPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssetPage({ params }: PageProps) {
  const user = await requireUser();
  const { id: shortId } = await params;
  const supabase = createServiceClient();

  // Fetch link canonical by short_id
  const { data: canonical } = await supabase
    .from('link_canonicals')
    .select('*')
    .eq('short_id', shortId)
    .single();

  if (!canonical) {
    notFound();
  }

  // Fetch link instances for this user using canonical UUID
  const { data: instances } = await supabase
    .from('link_instances')
    .select('id, user_title, user_description, folder_id')
    .eq('link_canonical_id', canonical.id)
    .eq('user_id', user.id);

  const instance = instances?.[0];
  if (!instance) {
    notFound();
  }

  // Fetch folder if present (return short_id as id)
  let folder: { id: string; name: string } | null = null;
  if (instance.folder_id) {
    const { data: folderData } = await supabase
      .from('folders')
      .select('short_id, name')
      .eq('id', instance.folder_id)
      .single();
    if (folderData) {
      folder = { id: folderData.short_id, name: folderData.name };
    }
  }

  // Get user's subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .maybeSingle();

  const entitlement = subscription
    ? {
        plan: subscription.plan as 'free' | 'pro' | 'lifetime',
        status: subscription.status as 'active' | 'trialing' | 'past_due' | 'canceled',
      }
    : null;

  const hasAssetPageAccess = canAccessAssetPage(entitlement);
  const hasMemoAccess = canAccessMemo(entitlement);

  // Fetch marks for this canonical (using canonical UUID)
  const { data: marks } = await supabase
    .from('marks')
    .select('*')
    .eq('link_canonical_id', canonical.id)
    .eq('user_id', user.id)
    .order('position');

  // Fetch memo if user has access
  let memo = null;
  if (hasMemoAccess) {
    const { data: memoData } = await supabase
      .from('memos')
      .select('*')
      .eq('link_canonical_id', canonical.id)
      .eq('user_id', user.id)
      .maybeSingle();
    memo = memoData;
  }

  // Fetch tags for the instance
  const { data: linkTags } = await supabase
    .from('link_tags')
    .select('tag_id')
    .eq('link_instance_id', instance.id);

  let tags: { id: string; name: string }[] = [];
  if (linkTags && linkTags.length > 0) {
    const tagIds = linkTags.map((lt) => lt.tag_id);
    const { data: tagData } = await supabase
      .from('tags')
      .select('id, name')
      .in('id', tagIds);
    tags = tagData ?? [];
  }

  // Transform canonical to use short_id as public id
  const canonicalWithShortId = {
    ...canonical,
    id: canonical.short_id, // Use short_id as public id
  };

  return (
    <AssetPageClient
      canonical={canonicalWithShortId}
      instance={{
        id: instance.id,
        user_title: instance.user_title,
        user_description: instance.user_description,
      }}
      folder={folder}
      tags={tags}
      marks={marks ?? []}
      memo={memo}
      hasAssetPageAccess={hasAssetPageAccess}
      hasMemoAccess={hasMemoAccess}
    />
  );
}
