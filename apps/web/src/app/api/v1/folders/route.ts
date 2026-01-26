/**
 * Folders API - List and Create
 *
 * GET /api/v1/folders - Get folder tree for authenticated user
 * POST /api/v1/folders - Create a new folder
 */

import { createServiceClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError, validateRequest, createFolderSchema, NotFoundError } from '@/lib/api';
import type { Folder, FolderWithChildren } from '@/types/api';

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = createServiceClient();

    const { data: folders, error } = await supabase
      .from('folders')
      .select('id, short_id, user_id, name, icon, parent_id, position, created_at, updated_at')
      .eq('user_id', user.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Build tree structure using short_id
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
    const supabase = createServiceClient();

    // Resolve parent short_id to UUID if provided
    let parentUuid: string | null = null;
    if (body.parentId) {
      const { data: parent, error: parentError } = await supabase
        .from('folders')
        .select('id')
        .eq('short_id', body.parentId)
        .eq('user_id', user.id)
        .single();

      if (parentError || !parent) {
        throw new NotFoundError('Parent folder not found');
      }
      parentUuid = parent.id;
    }

    // Get max position in parent folder
    let query = supabase.from('folders').select('position').eq('user_id', user.id);

    if (parentUuid === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', parentUuid);
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
        parent_id: parentUuid,
        position: newPosition,
      })
      .select('id, short_id, user_id, name, icon, parent_id, position, created_at, updated_at')
      .single();

    if (error) throw error;

    // Return with short_id as id
    return success(transformFolder(folder), 201);
  } catch (err) {
    return handleError(err);
  }
}

/**
 * Transform folder to use short_id as id
 */
interface DbFolder {
  id: string;
  short_id: string;
  user_id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

function transformFolder(folder: DbFolder): Folder {
  return {
    id: folder.short_id,
    name: folder.name,
    icon: folder.icon,
    parent_id: null, // Will be set by buildFolderTree
    position: folder.position,
    created_at: folder.created_at,
    updated_at: folder.updated_at,
  };
}

/**
 * Build a tree structure from flat folder list
 * Uses short_id as the public identifier
 */
function buildFolderTree(folders: DbFolder[]): FolderWithChildren[] {
  // Create map: UUID -> short_id for parent resolution
  const uuidToShortId = new Map<string, string>();
  for (const folder of folders) {
    uuidToShortId.set(folder.id, folder.short_id);
  }

  const folderMap = new Map<string, FolderWithChildren>();
  const roots: FolderWithChildren[] = [];

  // First pass: create map using short_id
  for (const folder of folders) {
    const parentShortId = folder.parent_id ? uuidToShortId.get(folder.parent_id) ?? null : null;
    folderMap.set(folder.short_id, {
      id: folder.short_id,
      name: folder.name,
      icon: folder.icon,
      parent_id: parentShortId,
      position: folder.position,
      created_at: folder.created_at,
      updated_at: folder.updated_at,
      children: [],
    });
  }

  // Second pass: build tree
  for (const folder of folders) {
    const node = folderMap.get(folder.short_id)!;
    if (folder.parent_id) {
      const parentShortId = uuidToShortId.get(folder.parent_id);
      const parent = parentShortId ? folderMap.get(parentShortId) : null;
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
