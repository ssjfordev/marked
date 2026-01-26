/**
 * Export API - Export bookmarks in various formats
 *
 * POST /api/v1/export - Export bookmarks
 */

import { createServiceClient } from '@/lib/supabase/server';
import { requireAuth, handleError, ValidationError } from '@/lib/api';
import {
  generateHtmlExport,
  generateCsvExport,
  generateJsonExport,
  type ExportData,
  type ExportFolder,
  type ExportLink,
} from '@/domain/export';

type ExportFormat = 'html' | 'csv' | 'json';

interface ExportRequest {
  format: ExportFormat;
  folderIds: string[];
  includeSubfolders?: boolean;
}

interface DbFolder {
  id: string;
  name: string;
  parent_id: string | null;
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body: ExportRequest = await request.json();

    const { format, folderIds, includeSubfolders = true } = body;

    // Validate format
    if (!['html', 'csv', 'json'].includes(format)) {
      throw new ValidationError('Invalid format. Must be html, csv, or json.');
    }

    const supabase = createServiceClient();

    // Fetch all user's folders (include short_id)
    const { data: allFolders, error: foldersError } = await supabase
      .from('folders')
      .select('id, short_id, name, parent_id')
      .eq('user_id', user.id)
      .order('position');

    if (foldersError) throw foldersError;

    // Create mapping from short_id to UUID
    const shortIdToUuid = new Map<string, string>();
    for (const folder of allFolders || []) {
      shortIdToUuid.set(folder.short_id, folder.id);
    }

    // Determine which folders to include (convert short_ids to UUIDs)
    let targetFolderIds: Set<string>;
    if (folderIds.length === 0) {
      // Export all
      targetFolderIds = new Set((allFolders || []).map((f) => f.id));
    } else {
      // Convert input short_ids to UUIDs
      targetFolderIds = new Set(
        folderIds
          .map((shortId) => shortIdToUuid.get(shortId))
          .filter((uuid): uuid is string => uuid !== undefined)
      );

      // Include subfolders if requested
      if (includeSubfolders) {
        const addChildren = (parentId: string) => {
          for (const folder of allFolders || []) {
            if (folder.parent_id === parentId && !targetFolderIds.has(folder.id)) {
              targetFolderIds.add(folder.id);
              addChildren(folder.id);
            }
          }
        };

        for (const folderId of folderIds) {
          addChildren(folderId);
        }
      }
    }

    // Fetch all link instances in target folders
    const { data: linkInstances, error: linksError } = await supabase
      .from('link_instances')
      .select('id, folder_id, user_title, is_favorite, created_at, link_canonical_id')
      .eq('user_id', user.id)
      .in('folder_id', Array.from(targetFolderIds))
      .order('position');

    if (linksError) throw linksError;

    // Fetch canonicals for these instances
    const canonicalIds = [...new Set((linkInstances || []).map((i) => i.link_canonical_id))];

    const canonicalMap = new Map<string, { original_url: string; title: string | null; description: string | null }>();

    if (canonicalIds.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < canonicalIds.length; i += BATCH_SIZE) {
        const batch = canonicalIds.slice(i, i + BATCH_SIZE);
        const { data: canonicals } = await supabase
          .from('link_canonicals')
          .select('id, original_url, title, description')
          .in('id', batch);

        for (const c of canonicals || []) {
          canonicalMap.set(c.id, {
            original_url: c.original_url,
            title: c.title,
            description: c.description,
          });
        }
      }
    }

    // Fetch tags for these instances
    const instanceIds = (linkInstances || []).map((i) => i.id);
    const tagMap = new Map<string, string[]>();

    if (instanceIds.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < instanceIds.length; i += BATCH_SIZE) {
        const batch = instanceIds.slice(i, i + BATCH_SIZE);
        const { data: tagLinks } = await supabase
          .from('link_tags')
          .select('link_instance_id, tag_id')
          .in('link_instance_id', batch);

        // Get tag names
        const tagIds = [...new Set((tagLinks || []).map((tl) => tl.tag_id))];
        const tagNameMap = new Map<string, string>();

        if (tagIds.length > 0) {
          const { data: tags } = await supabase
            .from('tags')
            .select('id, name')
            .in('id', tagIds);

          for (const tag of tags || []) {
            tagNameMap.set(tag.id, tag.name);
          }
        }

        for (const tl of tagLinks || []) {
          const existing = tagMap.get(tl.link_instance_id) || [];
          const tagName = tagNameMap.get(tl.tag_id);
          if (tagName) {
            existing.push(tagName);
            tagMap.set(tl.link_instance_id, existing);
          }
        }
      }
    }

    // Build folder tree with links
    const folderMap = new Map<string, DbFolder>();
    for (const folder of allFolders || []) {
      if (targetFolderIds.has(folder.id)) {
        folderMap.set(folder.id, folder);
      }
    }

    // Group links by folder
    const linksByFolder = new Map<string, ExportLink[]>();
    for (const instance of linkInstances || []) {
      if (!linksByFolder.has(instance.folder_id)) {
        linksByFolder.set(instance.folder_id, []);
      }

      const canonical = canonicalMap.get(instance.link_canonical_id);
      const tags = tagMap.get(instance.id) || [];

      linksByFolder.get(instance.folder_id)!.push({
        url: canonical?.original_url || '',
        title: instance.user_title || canonical?.title || canonical?.original_url || '',
        description: canonical?.description,
        createdAt: instance.created_at,
        isFavorite: instance.is_favorite,
        tags,
      });
    }

    // Build folder tree
    const buildFolderTree = (parentId: string | null): ExportFolder[] => {
      const children: ExportFolder[] = [];

      for (const folder of allFolders || []) {
        if (folder.parent_id === parentId && targetFolderIds.has(folder.id)) {
          children.push({
            id: folder.id,
            name: folder.name,
            links: linksByFolder.get(folder.id) || [],
            children: buildFolderTree(folder.id),
          });
        }
      }

      return children;
    };

    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      totalLinks: (linkInstances || []).length,
      folders: buildFolderTree(null),
    };

    // Generate export content
    let content: string;
    let contentType: string;
    let fileExtension: string;

    switch (format) {
      case 'html':
        content = generateHtmlExport(exportData);
        contentType = 'text/html; charset=utf-8';
        fileExtension = 'html';
        break;
      case 'csv':
        content = generateCsvExport(exportData);
        contentType = 'text/csv; charset=utf-8';
        fileExtension = 'csv';
        break;
      case 'json':
        content = generateJsonExport(exportData);
        contentType = 'application/json; charset=utf-8';
        fileExtension = 'json';
        break;
      default:
        throw new ValidationError('Invalid format');
    }

    // Generate filename
    const date = new Date().toISOString().split('T')[0];
    const filename = `bookmarks-${date}.${fileExtension}`;

    // Return file download response
    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
