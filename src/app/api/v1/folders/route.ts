/**
 * Folders API - List and Create
 *
 * GET /api/v1/folders - Get folder tree for authenticated user
 * POST /api/v1/folders - Create a new folder
 */

import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError, validateRequest, createFolderSchema } from '@/lib/api';
import type { Folder, FolderWithChildren } from '@/types/api';

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createServerClient();

    const { data: folders, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Build tree structure
    const tree = buildFolderTree(folders ?? []);

    return success(tree);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await validateRequest(request, createFolderSchema);
    const supabase = await createServerClient();

    // Get max position in parent folder
    const parentId = body.parentId ?? null;
    let query = supabase.from('folders').select('position').eq('user_id', user.id);

    if (parentId === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', parentId);
    }

    const { data: maxPosData } = await query
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newPosition = (maxPosData?.position ?? -1) + 1;

    const { data: folder, error } = await supabase
      .from('folders')
      .insert({
        user_id: user.id,
        name: body.name,
        parent_id: body.parentId ?? null,
        position: newPosition,
      })
      .select()
      .single();

    if (error) throw error;

    return success(folder, 201);
  } catch (err) {
    return handleError(err);
  }
}

/**
 * Build a tree structure from flat folder list
 */
function buildFolderTree(folders: Folder[]): FolderWithChildren[] {
  const folderMap = new Map<string, FolderWithChildren>();
  const roots: FolderWithChildren[] = [];

  // First pass: create map
  for (const folder of folders) {
    folderMap.set(folder.id, { ...folder, children: [] });
  }

  // Second pass: build tree
  for (const folder of folders) {
    const node = folderMap.get(folder.id)!;
    if (folder.parent_id) {
      const parent = folderMap.get(folder.parent_id);
      if (parent) {
        parent.children = parent.children ?? [];
        parent.children.push(node);
      } else {
        // Orphan folder (parent deleted) - add to root
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}
