import Link from 'next/link';
import { requireUser } from '@/lib/auth/actions';
import { createServiceClient } from '@/lib/supabase/server';
import { FolderManager } from './FolderManager';

interface DbFolder {
  id: string; // UUID (internal)
  short_id: string; // public ID
  name: string;
  icon: string | null;
  parent_id: string | null; // UUID reference
  position: number;
}

interface Folder {
  id: string; // short_id
  name: string;
  icon: string | null;
  parent_id: string | null; // parent's short_id
  position: number;
  children?: Folder[];
}

// Build tree structure from flat list using short_id
function buildFolderTree(dbFolders: DbFolder[]): Folder[] {
  // Map UUID -> short_id for parent resolution
  const uuidToShortId = new Map<string, string>();
  for (const folder of dbFolders) {
    uuidToShortId.set(folder.id, folder.short_id);
  }

  const folderMap = new Map<string, Folder>();
  const roots: Folder[] = [];

  // Create map of all folders using short_id as id
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

  // Build tree structure
  for (const folder of dbFolders) {
    const node = folderMap.get(folder.short_id)!;
    if (folder.parent_id) {
      const parentShortId = uuidToShortId.get(folder.parent_id);
      const parent = parentShortId ? folderMap.get(parentShortId) : null;
      if (parent) {
        parent.children = parent.children ?? [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  // Sort by position
  const sortByPosition = (a: Folder, b: Folder) => a.position - b.position;
  roots.sort(sortByPosition);
  for (const folder of folderMap.values()) {
    if (folder.children) {
      folder.children.sort(sortByPosition);
    }
  }

  return roots;
}

export default async function FolderManagePage() {
  const user = await requireUser();
  const supabase = createServiceClient();

  const { data: folders } = await supabase
    .from('folders')
    .select('id, short_id, name, icon, parent_id, position')
    .eq('user_id', user.id)
    .order('position');

  const folderTree = buildFolderTree((folders as DbFolder[]) ?? []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors mb-4"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          대시보드
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Manage Folders</h1>
        <p className="text-foreground-muted">Create, rename, reorder, and organize your folders.</p>
      </div>

      <FolderManager initialFolders={folderTree} />
    </div>
  );
}
