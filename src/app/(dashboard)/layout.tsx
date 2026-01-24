import { requireUser } from '@/lib/auth/actions';
import { createServiceClient } from '@/lib/supabase/server';
import { signOut } from '@/lib/auth/actions';
import { SidebarFolders } from '@/components/sidebar-folders';

type SubscriptionData = {
  plan: 'free' | 'pro' | 'ai_pro';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
};

interface FolderRow {
  id: string;
  name: string;
  parent_id: string | null;
  position: number;
}

function buildFolderTree(folders: FolderRow[]) {
  const folderMap = new Map<string, FolderRow & { children: FolderRow[] }>();
  const roots: (FolderRow & { children: FolderRow[] })[] = [];

  // Initialize all folders with empty children array
  for (const folder of folders) {
    folderMap.set(folder.id, { ...folder, children: [] });
  }

  // Build tree
  for (const folder of folders) {
    const node = folderMap.get(folder.id)!;
    if (folder.parent_id && folderMap.has(folder.parent_id)) {
      folderMap.get(folder.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort by position
  const sortByPosition = (a: FolderRow, b: FolderRow) => a.position - b.position;
  roots.sort(sortByPosition);
  for (const node of folderMap.values()) {
    node.children.sort(sortByPosition);
  }

  return roots;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const supabase = createServiceClient();

  const { data: subscriptionData } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: foldersData } = await supabase
    .from('folders')
    .select('id, name, parent_id, position')
    .eq('user_id', user.id)
    .order('position');

  const subscription = subscriptionData as SubscriptionData | null;
  const plan = subscription?.plan ?? 'free';
  const status = subscription?.status ?? 'active';
  const folders = buildFolderTree((foldersData as FolderRow[]) ?? []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold">Marked</h1>
        </div>

        {/* Folder tree */}
        <nav className="space-y-2">
          <SidebarFolders folders={folders} />
        </nav>

        <div className="absolute bottom-4 left-4 right-4 max-w-56">
          <div className="mb-2 truncate text-sm text-gray-600">{user.email}</div>
          <div className="mb-2 text-xs text-gray-400">
            Plan: {plan} ({status})
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
