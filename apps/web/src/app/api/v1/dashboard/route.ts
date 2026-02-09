/**
 * Dashboard API - Get dashboard data for the authenticated user
 *
 * GET /api/v1/dashboard - Returns counts, recent links, and favorite links
 */

import { createServiceClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError } from '@/lib/api';

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = createServiceClient();

    // Single RPC call for all dashboard data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dashData } = await (supabase.rpc as any)('get_dashboard_data', {
      p_user_id: user.id,
    });

    const raw = (dashData as Record<string, unknown>) ?? {};

    const recentInstances = (raw.recent_instances ?? []) as Array<{
      id: string;
      user_title: string | null;
      user_description: string | null;
      position: number;
      is_favorite: boolean | null;
      created_at: string;
      link_canonical_id: string;
    }>;
    const favoriteInstances = (raw.favorite_instances ?? []) as typeof recentInstances;
    const totalLinks = Number(raw.total_links ?? 0);
    const totalFolders = Number(raw.total_folders ?? 0);
    const totalFavorites = Number(raw.total_favorites ?? 0);
    const canonicals = (raw.canonicals ?? []) as Array<{
      id: string;
      url_key: string;
      original_url: string;
      domain: string;
      title: string | null;
      description: string | null;
      og_image: string | null;
      favicon: string | null;
    }>;
    const tags = (raw.tags ?? []) as Array<{
      link_instance_id: string;
      tag_id: string;
      tag_name: string;
    }>;

    const canonicalMap = new Map(canonicals.map((c) => [c.id, c]));

    const instanceTagsMap = new Map<string, { id: string; name: string }[]>();
    for (const t of tags) {
      const existing = instanceTagsMap.get(t.link_instance_id) ?? [];
      existing.push({ id: t.tag_id, name: t.tag_name });
      instanceTagsMap.set(t.link_instance_id, existing);
    }

    const transformInstances = (instances: typeof recentInstances) => {
      return instances
        .map((instance) => {
          const canonical = canonicalMap.get(instance.link_canonical_id);
          if (!canonical) return null;
          return {
            id: instance.id,
            user_title: instance.user_title,
            user_description: instance.user_description,
            position: instance.position,
            is_favorite: instance.is_favorite ?? false,
            created_at: instance.created_at,
            canonical: {
              id: canonical.id,
              url_key: canonical.url_key,
              original_url: canonical.original_url,
              domain: canonical.domain,
              title: canonical.title,
              description: canonical.description,
              og_image: canonical.og_image,
              favicon: canonical.favicon,
            },
            tags: instanceTagsMap.get(instance.id) ?? [],
          };
        })
        .filter((l): l is NonNullable<typeof l> => l !== null);
    };

    return success({
      totalLinks,
      totalFolders,
      totalFavorites,
      recentLinks: transformInstances(recentInstances),
      favoriteLinks: transformInstances(favoriteInstances),
      email: user.email ?? '',
    });
  } catch (err) {
    return handleError(err);
  }
}
