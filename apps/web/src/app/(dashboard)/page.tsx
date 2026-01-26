import { requireUser } from '@/lib/auth/actions';
import { createServiceClient } from '@/lib/supabase/server';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = createServiceClient();

  // Get onboarding status
  const { count: linkCount } = await supabase
    .from('link_instances')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: markCount } = await supabase
    .from('marks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Check if user has imported (has any links)
  const hasImported = (linkCount ?? 0) > 0;
  const hasFirstMark = (markCount ?? 0) > 0;

  // Get recent links
  const { data: recentLinks } = await supabase
    .from('link_instances')
    .select('id, user_title, created_at, link_canonical_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get canonicals for recent links
  let recentLinksWithCanonical: { id: string; title: string; domain: string; created_at: string }[] = [];
  if (recentLinks && recentLinks.length > 0) {
    const canonicalIds = recentLinks.map((l) => l.link_canonical_id);
    const { data: canonicals } = await supabase
      .from('link_canonicals')
      .select('id, title, domain')
      .in('id', canonicalIds);

    const canonicalMap = new Map(canonicals?.map((c) => [c.id, c]) ?? []);

    recentLinksWithCanonical = recentLinks.map((link) => {
      const canonical = canonicalMap.get(link.link_canonical_id);
      return {
        id: link.link_canonical_id,
        title: link.user_title || canonical?.title || canonical?.domain || 'Untitled',
        domain: canonical?.domain || '',
        created_at: link.created_at,
      };
    });
  }

  // Get folder count
  const { count: folderCount } = await supabase
    .from('folders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const firstName = user.email?.split('@')[0] || 'there';

  return (
    <div className="max-w-5xl">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white mb-1">
          Welcome back, <span className="text-[#10B981]">{firstName}</span>
        </h1>
        <p className="text-sm text-white/50">
          Here&apos;s what&apos;s happening with your bookmarks
        </p>
      </div>

      {/* Onboarding checklist */}
      <OnboardingChecklist
        hasExtension={false}
        hasImported={hasImported}
        hasFirstMark={hasFirstMark}
        hasFirstSearch={false}
      />

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#059669]/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{linkCount ?? 0}</div>
          <div className="text-xs text-white/40">Links saved</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{folderCount ?? 0}</div>
          <div className="text-xs text-white/40">Folders</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{markCount ?? 0}</div>
          <div className="text-xs text-white/40">Highlights</div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-medium text-white/70 mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/import"
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] hover:border-white/15 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#059669]/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Import Bookmarks</div>
                <div className="text-xs text-white/40">Chrome, Safari, Firefox</div>
              </div>
            </Link>
            <Link
              href="/search"
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] hover:border-white/15 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Search Links</div>
                <div className="text-xs text-white/40">Find anything you saved</div>
              </div>
            </Link>
            <Link
              href="/settings/billing"
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] hover:border-white/15 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Settings</div>
                <div className="text-xs text-white/40">Manage your account</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent links */}
        <div>
          <h2 className="text-sm font-medium text-white/70 mb-3">Recent Links</h2>
          {recentLinksWithCanonical.length > 0 ? (
            <div className="space-y-1">
              {recentLinksWithCanonical.map((link) => (
                <Link
                  key={link.id}
                  href={`/links/${link.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-6 h-6 rounded bg-white/[0.06] flex items-center justify-center text-[10px] font-medium text-white/40 flex-shrink-0">
                    {link.domain.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{link.title}</div>
                    <div className="text-xs text-white/30">{link.domain}</div>
                  </div>
                  <div className="text-[10px] text-white/20 flex-shrink-0">
                    {new Date(link.created_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 border-dashed p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <p className="text-sm text-white/40 mb-1">No links yet</p>
              <p className="text-xs text-white/25">Import or add your first link</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
