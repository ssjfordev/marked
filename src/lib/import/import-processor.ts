/**
 * Import Processor
 *
 * Handles the processing of parsed bookmarks:
 * 1. Creates folder structure
 * 2. Creates link canonicals (deduplication by url_key)
 * 3. Creates link instances in appropriate folders
 * 4. Queues enrichment jobs
 */

import { createServiceClient } from '@/lib/supabase/server';
import { parseChromeBooksmarks, flattenFolders, type ParseResult } from '@/domain/import';
import { canonicalizeUrl } from '@/domain/url';
import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createServiceClient>;

export interface ImportProgress {
  status: 'running' | 'succeeded' | 'failed';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  lastError?: string;
}

export interface ImportResult {
  success: boolean;
  foldersCreated: number;
  linksCreated: number;
  linksSkipped: number; // Already existed
  errors: string[];
}

/**
 * Process an import job
 */
export async function processImportJob(
  jobId: string,
  userId: string,
  htmlContent: string,
  onProgress?: (progress: ImportProgress) => Promise<void>
): Promise<ImportResult> {
  const supabase = createServiceClient();

  // Parse the HTML
  const parseResult = parseChromeBooksmarks(htmlContent);

  const totalItems = parseResult.stats.totalBookmarks;
  let processedItems = 0;
  let failedItems = 0;
  const errors: string[] = [];

  // Update job to running
  await updateJobStatus(supabase, jobId, {
    status: 'running',
    total_items: totalItems,
    started_at: new Date().toISOString(),
  });

  try {
    // Step 1: Create folder structure
    const folderMap = await createFolders(supabase, userId, parseResult);

    // Step 2: Process bookmarks in batches
    const BATCH_SIZE = 50;
    const bookmarks = parseResult.bookmarks;

    let linksCreated = 0;
    let linksSkipped = 0;

    for (let i = 0; i < bookmarks.length; i += BATCH_SIZE) {
      const batch = bookmarks.slice(i, i + BATCH_SIZE);

      for (const bookmark of batch) {
        try {
          const result = await processBookmark(supabase, userId, bookmark, folderMap);
          if (result.created) {
            linksCreated++;
          } else {
            linksSkipped++;
          }
          processedItems++;
        } catch (err) {
          failedItems++;
          processedItems++;
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`Failed to import ${bookmark.url}: ${errorMsg}`);
        }
      }

      // Report progress
      if (onProgress) {
        await onProgress({
          status: 'running',
          totalItems,
          processedItems,
          failedItems,
        });
      }

      // Update job progress in DB
      await updateJobStatus(supabase, jobId, {
        processed_items: processedItems,
        failed_items: failedItems,
      });
    }

    // Mark job as succeeded
    await updateJobStatus(supabase, jobId, {
      status: 'succeeded',
      processed_items: processedItems,
      failed_items: failedItems,
      finished_at: new Date().toISOString(),
    });

    return {
      success: true,
      foldersCreated: Object.keys(folderMap).length,
      linksCreated,
      linksSkipped,
      errors,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';

    // Mark job as failed
    await updateJobStatus(supabase, jobId, {
      status: 'failed',
      processed_items: processedItems,
      failed_items: failedItems,
      last_error: errorMsg,
      finished_at: new Date().toISOString(),
    });

    return {
      success: false,
      foldersCreated: 0,
      linksCreated: 0,
      linksSkipped: 0,
      errors: [errorMsg, ...errors],
    };
  }
}

/**
 * Create folder structure from parsed folders
 * Returns a map of folder path (joined) -> folder ID
 */
async function createFolders(
  supabase: SupabaseClient,
  userId: string,
  parseResult: ParseResult
): Promise<Map<string, string>> {
  const folderMap = new Map<string, string>();
  const flatFolders = flattenFolders(parseResult.folders);

  // Sort by path length to ensure parents are created before children
  flatFolders.sort((a, b) => a.path.length - b.path.length);

  for (const folder of flatFolders) {
    const pathKey = folder.path.join('/');
    const parentPathKey = folder.parentPath.join('/');
    const parentId = parentPathKey ? folderMap.get(parentPathKey) : null;

    // Check if folder already exists
    let query = supabase.from('folders').select('id').eq('user_id', userId).eq('name', folder.name);

    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      folderMap.set(pathKey, existing.id);
    } else {
      // Get max position
      let posQuery = supabase.from('folders').select('position').eq('user_id', userId);

      if (parentId) {
        posQuery = posQuery.eq('parent_id', parentId);
      } else {
        posQuery = posQuery.is('parent_id', null);
      }

      const { data: maxPosData } = await posQuery
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      const position = (maxPosData?.position ?? -1) + 1;

      // Create folder
      const { data: newFolder, error } = await supabase
        .from('folders')
        .insert({
          user_id: userId,
          name: folder.name,
          parent_id: parentId,
          position,
        })
        .select('id')
        .single();

      if (error) throw error;
      folderMap.set(pathKey, newFolder.id);
    }
  }

  return folderMap;
}

/**
 * Process a single bookmark
 */
async function processBookmark(
  supabase: SupabaseClient,
  userId: string,
  bookmark: { url: string; title: string; folderPath: string[] },
  folderMap: Map<string, string>
): Promise<{ created: boolean }> {
  const { urlKey, domain } = canonicalizeUrl(bookmark.url);

  // Get target folder ID
  const folderPathKey = bookmark.folderPath.join('/');
  let folderId = folderMap.get(folderPathKey);

  // If no folder found, create a root-level "Imported" folder
  if (!folderId) {
    const importedFolderId = await getOrCreateImportedFolder(supabase, userId);
    folderId = importedFolderId;
  }

  // Check if canonical already exists
  const { data: existingCanonical } = await supabase
    .from('link_canonicals')
    .select('id')
    .eq('url_key', urlKey)
    .maybeSingle();

  let canonicalId: string;

  if (existingCanonical) {
    canonicalId = existingCanonical.id;
  } else {
    // Create new canonical
    const { data: newCanonical, error } = await supabase
      .from('link_canonicals')
      .insert({
        url_key: urlKey,
        original_url: bookmark.url,
        domain,
        title: bookmark.title, // Use bookmark title as initial
      })
      .select('id')
      .single();

    if (error) throw error;
    canonicalId = newCanonical.id;

    // Queue enrichment job
    await supabase
      .from('enrichment_jobs')
      .insert({
        link_canonical_id: canonicalId,
        status: 'queued',
      })
      .select()
      .maybeSingle(); // Ignore if already exists (UNIQUE constraint)
  }

  // Check if instance already exists in this folder
  const { data: existingInstance } = await supabase
    .from('link_instances')
    .select('id')
    .eq('user_id', userId)
    .eq('link_canonical_id', canonicalId)
    .eq('folder_id', folderId)
    .maybeSingle();

  if (existingInstance) {
    return { created: false };
  }

  // Get max position in folder
  const { data: maxPosData } = await supabase
    .from('link_instances')
    .select('position')
    .eq('user_id', userId)
    .eq('folder_id', folderId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (maxPosData?.position ?? -1) + 1;

  // Create link instance
  await supabase.from('link_instances').insert({
    user_id: userId,
    link_canonical_id: canonicalId,
    folder_id: folderId,
    user_title: bookmark.title,
    position,
  });

  return { created: true };
}

/**
 * Get or create the "Imported" folder for orphan bookmarks
 */
async function getOrCreateImportedFolder(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const IMPORTED_FOLDER_NAME = 'Imported';

  const { data: existing } = await supabase
    .from('folders')
    .select('id')
    .eq('user_id', userId)
    .eq('name', IMPORTED_FOLDER_NAME)
    .is('parent_id', null)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  const { data: maxPosData } = await supabase
    .from('folders')
    .select('position')
    .eq('user_id', userId)
    .is('parent_id', null)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (maxPosData?.position ?? -1) + 1;

  const { data: newFolder, error } = await supabase
    .from('folders')
    .insert({
      user_id: userId,
      name: IMPORTED_FOLDER_NAME,
      parent_id: null,
      position,
    })
    .select('id')
    .single();

  if (error) throw error;
  return newFolder.id;
}

/**
 * Update import job status
 */
async function updateJobStatus(
  supabase: SupabaseClient,
  jobId: string,
  updates: Partial<Database['public']['Tables']['import_jobs']['Update']>
): Promise<void> {
  await supabase.from('import_jobs').update(updates).eq('id', jobId);
}
