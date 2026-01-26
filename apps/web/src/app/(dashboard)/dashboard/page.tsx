import { requireUser } from '@/lib/auth/actions';
import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { DashboardContent } from './DashboardContent';

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = createServiceClient();

  // Fetch recent links (last 6)
  const { data: recentInstances } = await supabase
    .from('link_instances')
    .select('id, user_title, user_description, position, is_favorite, created_at, link_canonical_id, folder_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6);

  // Fetch favorite links (last 6)
  const { data: favoriteInstances } = await supabase
    .from('link_instances')
    .select('id, user_title, user_description, position, is_favorite, created_at, link_canonical_id, folder_id')
    .eq('user_id', user.id)
    .eq('is_favorite', true)
    .order('updated_at', { ascending: false })
    .limit(6);

  // Get total counts for stats
  const { count: totalLinks } = await supabase
    .from('link_instances')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: totalFolders } = await supabase
    .from('folders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: totalFavorites } = await supabase
    .from('link_instances')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_favorite', true);

  // Combine all instances and fetch canonicals
  const allInstances = [...(recentInstances ?? []), ...(favoriteInstances ?? [])];
  const uniqueCanonicalIds = [...new Set(allInstances.map((i) => i.link_canonical_id))];

  let canonicalMap = new Map<string, {
    id: string;
    url_key: string;
    original_url: string;
    domain: string;
    title: string | null;
    description: string | null;
    og_image: string | null;
    favicon: string | null;
  }>();

  if (uniqueCanonicalIds.length > 0) {
    const { data: canonicals } = await supabase
      .from('link_canonicals')
      .select('id, url_key, original_url, domain, title, description, og_image, favicon')
      .in('id', uniqueCanonicalIds);

    canonicalMap = new Map(canonicals?.map((c) => [c.id, c]) ?? []);
  }

  // Fetch tags for all instances
  const instanceIds = allInstances.map((i) => i.id);
  let instanceTagsMap = new Map<string, { id: string; name: string }[]>();

  if (instanceIds.length > 0) {
    const { data: linkTags } = await supabase
      .from('link_tags')
      .select('link_instance_id, tag_id')
      .in('link_instance_id', instanceIds);

    const tagIds = [...new Set(linkTags?.map((lt) => lt.tag_id) ?? [])];
    let tagMap = new Map<string, { id: string; name: string }>();

    if (tagIds.length > 0) {
      const { data: tags } = await supabase.from('tags').select('id, name').in('id', tagIds);
      tagMap = new Map(tags?.map((t) => [t.id, t]) ?? []);
    }

    for (const lt of linkTags ?? []) {
      const tag = tagMap.get(lt.tag_id);
      if (tag) {
        const existing = instanceTagsMap.get(lt.link_instance_id) ?? [];
        existing.push(tag);
        instanceTagsMap.set(lt.link_instance_id, existing);
      }
    }
  }

  // Transform instances to link data
  const transformInstances = (instances: typeof recentInstances) => {
    if (!instances) return [];
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

  const recentLinks = transformInstances(recentInstances);
  const favoriteLinks = transformInstances(favoriteInstances);
  const hasAnyLinks = (totalLinks ?? 0) > 0;

  // If no links at all, show empty state
  if (!hasAnyLinks) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Welcome back
          </h1>
          <p className="text-foreground-muted">
            {user.email}
          </p>
        </div>

        {/* Empty State */}
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-primary-light"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>

          <h2 className="text-lg font-medium text-foreground mb-2">
            No links yet
          </h2>
          <p className="text-foreground-muted mb-6 max-w-sm mx-auto">
            Import your existing bookmarks or save links with the browser extension to get started.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/import"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Bookmarks
            </Link>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground-secondary font-medium text-sm hover:bg-hover hover:border-border-hover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Get Extension
            </a>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-foreground mb-1">Organize with folders</h3>
            <p className="text-sm text-foreground-muted">
              Create folders to keep your links organized and easy to find.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="font-medium text-foreground mb-1">Tag for quick access</h3>
            <p className="text-sm text-foreground-muted">
              Add tags to links for faster searching and filtering.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-foreground mb-1">Search everything</h3>
            <p className="text-sm text-foreground-muted">
              Find any link instantly with powerful search across all your content.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Dashboard</h1>
        <p className="text-foreground-muted">{user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Link href="/links" className="p-5 rounded-xl border border-border bg-surface hover:border-border-hover hover:bg-hover transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{totalLinks ?? 0}</p>
              <p className="text-sm text-foreground-muted">Total Links</p>
            </div>
          </div>
        </Link>

        <Link href="/folders/manage" className="p-5 rounded-xl border border-border bg-surface hover:border-border-hover hover:bg-hover transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{totalFolders ?? 0}</p>
              <p className="text-sm text-foreground-muted">Folders</p>
            </div>
          </div>
        </Link>

        <Link href="/favorites" className="p-5 rounded-xl border border-border bg-surface hover:border-border-hover hover:bg-hover transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{totalFavorites ?? 0}</p>
              <p className="text-sm text-foreground-muted">Favorites</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Content Sections */}
      <DashboardContent recentLinks={recentLinks} favoriteLinks={favoriteLinks} />
    </div>
  );
}
