import { getUser } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { SidebarFolders } from '@/components/SidebarFolders';
import { Header } from '@/components/Header';
import Image from 'next/image';
import Link from 'next/link';
import { createT } from '@/i18n';
import { ExtensionAuthSync } from '@/components/ExtensionAuthSync';

type SubscriptionData = {
  plan: 'free' | 'pro' | 'ai_pro';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
};

interface DbFolderRow {
  id: string; // UUID (internal)
  short_id: string; // public ID
  name: string;
  icon: string | null;
  parent_id: string | null; // UUID reference
  position: number;
}

interface SidebarFolder {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  position: number;
  children?: SidebarFolder[];
}

function buildFolderTree(dbFolders: DbFolderRow[]): SidebarFolder[] {
  // Map UUID -> short_id for parent resolution
  const uuidToShortId = new Map<string, string>();
  for (const folder of dbFolders) {
    uuidToShortId.set(folder.id, folder.short_id);
  }

  const folderMap = new Map<string, SidebarFolder>();
  const roots: SidebarFolder[] = [];

  // Initialize all folders with empty children array, using short_id as id
  for (const folder of dbFolders) {
    const parentShortId = folder.parent_id ? (uuidToShortId.get(folder.parent_id) ?? null) : null;
    folderMap.set(folder.short_id, {
      id: folder.short_id,
      name: folder.name,
      icon: folder.icon,
      parent_id: parentShortId,
      position: folder.position,
      children: [],
    });
  }

  // Build tree using short_ids
  for (const folder of dbFolders) {
    const node = folderMap.get(folder.short_id)!;
    if (folder.parent_id) {
      const parentShortId = uuidToShortId.get(folder.parent_id);
      if (parentShortId && folderMap.has(parentShortId)) {
        folderMap.get(parentShortId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  // Sort by position
  const sortByPosition = (a: SidebarFolder, b: SidebarFolder) => a.position - b.position;
  roots.sort(sortByPosition);
  for (const node of folderMap.values()) {
    if (node.children) {
      node.children.sort(sortByPosition);
    }
  }

  return roots;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) {
    redirect('/');
  }
  const supabase = createServiceClient();
  const { t } = await createT();

  // Run all queries in parallel to avoid sequential DB roundtrips
  const [{ data: subscriptionData }, { data: foldersData }, { data: linkCountsData }] =
    await Promise.all([
      supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('folders')
        .select('id, short_id, name, icon, parent_id, position')
        .eq('user_id', user.id)
        .order('position'),
      supabase.from('link_instances').select('folder_id').eq('user_id', user.id),
    ]);

  // Create UUID -> short_id mapping for link counts
  const uuidToShortId = new Map<string, string>();
  for (const folder of (foldersData as DbFolderRow[]) ?? []) {
    uuidToShortId.set(folder.id, folder.short_id);
  }

  // Build folder link counts map using short_id as key
  const folderLinkCounts = new Map<string, number>();
  for (const link of linkCountsData ?? []) {
    if (link.folder_id) {
      const shortId = uuidToShortId.get(link.folder_id);
      if (shortId) {
        folderLinkCounts.set(shortId, (folderLinkCounts.get(shortId) ?? 0) + 1);
      }
    }
  }

  const subscription = subscriptionData as SubscriptionData | null;
  const plan = subscription?.plan ?? 'free';
  const status = subscription?.status ?? 'active';
  const folders = buildFolderTree((foldersData as DbFolderRow[]) ?? []);

  const totalLinks = linkCountsData?.length ?? 0;
  const totalFolders = foldersData?.length ?? 0;

  const tips = [
    t('tips.searchShortcut'),
    t('tips.dragFolders'),
    t('tips.importBookmarks'),
    t('tips.starLinks'),
    t('tips.shareFolders'),
  ];
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-bg flex flex-col overflow-hidden">
        {/* Logo */}
        <div className="h-14 flex items-center px-3 border-b border-border">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logos/marked-logo-full.png"
              alt="Marked"
              width={108}
              height={27}
              unoptimized
              className="dark:hidden h-6 w-auto"
            />
            <Image
              src="/logos/marked-logo-full-white.png"
              alt="Marked"
              width={108}
              height={27}
              unoptimized
              className="hidden dark:block h-6 w-auto"
            />
            {process.env.ENV !== 'production' && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/15 text-amber-500 border border-amber-500/25">
                Dev
              </span>
            )}
          </Link>
        </div>

        {/* Folder tree */}
        <nav className="flex-1 px-1.5 py-2 overflow-y-auto">
          {/* Folders header with edit button */}
          <div className="flex items-center justify-between px-1.5 mb-1">
            <span className="text-[11px] font-medium text-foreground-faint uppercase tracking-wider">
              {t('sidebar.folders')}
            </span>
            <Link
              href="/folders/manage"
              className="p-1 rounded text-foreground-faint hover:text-foreground-muted hover:bg-hover transition-colors"
              title={t('sidebar.manageFolders')}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </Link>
          </div>
          <SidebarFolders folders={folders} linkCounts={Object.fromEntries(folderLinkCounts)} />
        </nav>

        {/* Info box */}
        <div className="px-3 py-3 border-t border-border space-y-2.5">
          <div className="text-[11px] text-foreground-faint">
            {t('sidebar.linksFolders', { links: totalLinks, folders: totalFolders })}
          </div>
          <div className="text-[11px] text-foreground-faint">💡 {randomTip}</div>
          {plan === 'free' && (
            <Link
              href="/settings"
              className="block text-[11px] font-medium text-primary-light bg-primary/10 hover:bg-primary/15 rounded px-2 py-1.5 text-center transition-colors"
            >
              {t('sidebar.upgradeToPro')}
            </Link>
          )}
        </div>

        {/* Bottom section with plan info */}
        <div className="px-2 py-2 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-semibold text-primary-light">
                {user.email?.slice(0, 1).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-foreground-muted truncate">{user.email}</div>
            </div>
            <span className="text-[9px] text-primary-light font-medium px-1.5 py-0.5 bg-primary/10 rounded">
              {plan === 'free' ? t('plan.free') : plan === 'pro' ? t('plan.pro') : t('plan.aiPro')}
            </span>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header user={{ email: user.email || '' }} plan={plan} status={status} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <ExtensionAuthSync />
    </div>
  );
}
