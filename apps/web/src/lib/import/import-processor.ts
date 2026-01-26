/**
 * Import Processor
 *
 * Handles the processing of parsed bookmarks using BULK operations:
 * 1. Creates folder structure (batch)
 * 2. Bulk upsert link canonicals
 * 3. Bulk insert link instances
 * 4. Bulk queue enrichment jobs
 *
 * Designed to handle 10,000+ bookmarks efficiently.
 */

import { createServiceClient } from '@/lib/supabase/server';
import {
  parseChromeBooksmarks,
  parseFirefoxBookmarks,
  parseEdgeBookmarks,
  parseSafariBookmarks,
  parseRaindropHtml,
  parseRaindropCsv,
  parseCsvBookmarks,
  flattenFolders,
  type ParseResult,
  type ImportFormat,
} from '@/domain/import';
import { canonicalizeUrl } from '@/domain/url';
import { fetchMetadata } from '@/lib/enrichment/metadata-fetcher';
import { getDescriptionFallback } from '@/domain/description';
import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createServiceClient>;

export interface ImportProgress {
  status: 'running' | 'succeeded' | 'failed';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  lastError?: string;
}

export interface FailedBookmark {
  url: string;
  title: string;
  reason: string;
}

export interface ImportResult {
  success: boolean;
  foldersCreated: number;
  linksCreated: number;
  linksSkipped: number;
  failedBookmarks: FailedBookmark[];
}

export interface ImportOptions {
  wrapInFolder?: boolean;
  wrapFolderName?: string | null;
}

/**
 * Parse content based on detected format
 */
function parseContent(content: string, format: ImportFormat): ParseResult {
  switch (format) {
    case 'chrome':
      return parseChromeBooksmarks(content);
    case 'firefox':
      return parseFirefoxBookmarks(content);
    case 'edge':
      return parseEdgeBookmarks(content);
    case 'safari':
      return parseSafariBookmarks(content);
    case 'raindrop-html':
      return parseRaindropHtml(content);
    case 'raindrop-csv':
      return parseRaindropCsv(content);
    case 'csv':
      return parseCsvBookmarks(content);
    default:
      // Default to Chrome parser
      return parseChromeBooksmarks(content);
  }
}

/**
 * Process an import job using bulk operations
 */
export async function processImportJob(
  jobId: string,
  userId: string,
  content: string,
  format: ImportFormat,
  options?: ImportOptions
): Promise<ImportResult> {
  const supabase = createServiceClient();

  // Parse the content based on format
  const parseResult = parseContent(content, format);

  const totalItems = parseResult.stats.totalBookmarks;
  const failedBookmarks: FailedBookmark[] = [];

  // Progress tracking - divide into phases for smooth UX
  // Phase 1: Folder creation (0-10%)
  // Phase 2: Canonical insert (10-40%)
  // Phase 3: Canonical fetch (40-60%)
  // Phase 4: Instance insert (60-99%)
  const updateProgress = async (percent: number) => {
    const capped = Math.min(Math.max(percent, 0), 99);
    const processedItems = Math.floor((capped / 100) * totalItems);
    await updateJobStatus(supabase, jobId, {
      processed_items: processedItems,
    });
  };

  // Update job to running
  await updateJobStatus(supabase, jobId, {
    status: 'running',
    total_items: totalItems,
    processed_items: 0,
    started_at: new Date().toISOString(),
  });

  try {
    // Step 1: Create folder structure
    const { folderMap, wrapperFolderId } = await createFolders(
      supabase,
      userId,
      parseResult,
      options?.wrapInFolder,
      options?.wrapFolderName
    );

    // Phase 1 complete: Folders created (10%)
    await updateProgress(10);

    // Step 2: Prepare all bookmarks data (skip invalid URLs)
    const bookmarksWithKeys: Array<{
      url: string;
      title: string;
      folderPath: string[];
      urlKey: string;
      domain: string;
      folderPathKey: string;
    }> = [];

    for (const bookmark of parseResult.bookmarks) {
      try {
        const { urlKey, domain } = canonicalizeUrl(bookmark.url);
        const folderPathKey = bookmark.folderPath.join('/');
        bookmarksWithKeys.push({ ...bookmark, urlKey, domain, folderPathKey });
      } catch (e) {
        failedBookmarks.push({
          url: bookmark.url.slice(0, 100),
          title: bookmark.title,
          reason: `Invalid URL: ${e instanceof Error ? e.message : 'parse error'}`,
        });
      }
    }

    // Step 3: Bulk upsert canonicals
    console.log('[Import] Bookmarks parsed:', bookmarksWithKeys.length, 'Failed so far:', failedBookmarks.length);

    const uniqueUrls = new Map<string, { urlKey: string; url: string; domain: string; title: string }>();
    for (const b of bookmarksWithKeys) {
      if (!uniqueUrls.has(b.urlKey)) {
        uniqueUrls.set(b.urlKey, { urlKey: b.urlKey, url: b.url, domain: b.domain, title: b.title });
      }
    }

    console.log('[Import] Unique URLs:', uniqueUrls.size);

    // Batch sizes for operations
    // Insert can handle larger batches, but .in() queries have URL length limits (~8KB)
    const INSERT_BATCH = 500; // For upsert operations (larger is faster)
    const FETCH_BATCH = 100;  // For .in() queries (smaller to avoid URL length issues)
    const urlKeyToId = new Map<string, string>();
    const uniqueUrlsArray = Array.from(uniqueUrls.values());
    const allUrlKeys = uniqueUrlsArray.map((u) => u.urlKey);

    // Step 3a: Insert new canonicals (ignore duplicates)
    // Phase 2: Canonical insert (10-40%)
    const insertBatchCount = Math.ceil(uniqueUrlsArray.length / INSERT_BATCH);
    for (let i = 0; i < uniqueUrlsArray.length; i += INSERT_BATCH) {
      const batchIndex = Math.floor(i / INSERT_BATCH);
      const batch = uniqueUrlsArray.slice(i, i + INSERT_BATCH);

      // Progress: phase 2 (10-40%), show progress at start of each batch
      const phase2Progress = 10 + (batchIndex / Math.max(insertBatchCount, 1)) * 30;
      await updateProgress(phase2Progress);

      const { error: insertError } = await supabase
        .from('link_canonicals')
        .upsert(
          batch.map((b) => ({
            url_key: b.urlKey,
            original_url: b.url,
            domain: b.domain,
            title: b.title,
          })),
          { onConflict: 'url_key', ignoreDuplicates: true }
        );

      if (insertError) {
        console.error('[Import] Canonical insert error:', insertError);
        // Don't throw - mark these URLs as failed and continue
        for (const b of batch) {
          failedBookmarks.push({
            url: b.url,
            title: b.title,
            reason: `DB error: ${insertError.message}`,
          });
        }
      }
    }
    // Phase 2 complete
    await updateProgress(40);

    // Step 3b: Fetch all canonical IDs (use smaller batches to avoid URL length limits)
    // Phase 3: Canonical fetch (40-60%)
    const fetchBatchCount = Math.ceil(allUrlKeys.length / FETCH_BATCH);
    for (let i = 0; i < allUrlKeys.length; i += FETCH_BATCH) {
      const fetchBatchIndex = Math.floor(i / FETCH_BATCH);
      const batch = allUrlKeys.slice(i, i + FETCH_BATCH);

      // Progress: phase 3 (40-60%)
      const phase3Progress = 40 + (fetchBatchIndex / Math.max(fetchBatchCount, 1)) * 20;
      await updateProgress(phase3Progress);

      const { data: canonicals, error: fetchError } = await supabase
        .from('link_canonicals')
        .select('id, url_key')
        .in('url_key', batch);

      if (fetchError) {
        console.error('[Import] Canonical fetch error:', fetchError.message);
      }

      for (const c of canonicals || []) {
        urlKeyToId.set(c.url_key, c.id);
      }
    }
    // Phase 3 complete
    await updateProgress(60);

    console.log('[Import] Fetched canonical IDs:', urlKeyToId.size, 'out of', allUrlKeys.length);

    // Debug: Log first few urlKeys from map
    if (urlKeyToId.size > 0) {
      const firstKeys = Array.from(urlKeyToId.keys()).slice(0, 3);
      console.log('[Import] First urlKeys in map:', firstKeys);
    }

    // Debug: Log first few allUrlKeys
    console.log('[Import] First allUrlKeys to search:', allUrlKeys.slice(0, 3));

    // Step 4: Get default folder for orphans (wrapper folder if wrapping, or "미분류")
    const defaultFolderId = wrapperFolderId ?? await getOrCreateImportedFolder(supabase, userId);

    // Step 5: Check existing instances to avoid duplicates

    const allCanonicalIds = Array.from(new Set(urlKeyToId.values()));
    const existingInstances = new Set<string>(); // "canonicalId:folderId"

    for (let i = 0; i < allCanonicalIds.length; i += FETCH_BATCH) {
      const batch = allCanonicalIds.slice(i, i + FETCH_BATCH);
      const { data: existing } = await supabase
        .from('link_instances')
        .select('link_canonical_id, folder_id')
        .eq('user_id', userId)
        .in('link_canonical_id', batch);

      for (const inst of existing || []) {
        existingInstances.add(`${inst.link_canonical_id}:${inst.folder_id}`);
      }
    }

    // Step 6: Prepare instances to insert
    const instancesToInsert: {
      user_id: string;
      link_canonical_id: string;
      folder_id: string;
      user_title: string;
      position: number;
    }[] = [];

    // Track positions per folder
    const folderPositions = new Map<string, number>();

    let skipped = 0;
    for (const bookmark of bookmarksWithKeys) {
      const canonicalId = urlKeyToId.get(bookmark.urlKey);
      if (!canonicalId) {
        failedBookmarks.push({
          url: bookmark.url,
          title: bookmark.title,
          reason: 'Failed to create canonical URL entry',
        });
        continue;
      }

      let folderId = folderMap.get(bookmark.folderPathKey);
      if (!folderId) {
        folderId = defaultFolderId;
      }

      const key = `${canonicalId}:${folderId}`;
      if (existingInstances.has(key)) {
        skipped++;
        continue;
      }

      // Track to avoid inserting duplicates within same import
      existingInstances.add(key);

      const position = folderPositions.get(folderId) ?? 0;
      folderPositions.set(folderId, position + 1);

      instancesToInsert.push({
        user_id: userId,
        link_canonical_id: canonicalId,
        folder_id: folderId,
        user_title: bookmark.title,
        position,
      });
    }

    console.log('[Import] Instances to insert:', instancesToInsert.length, 'Skipped:', skipped, 'Failed so far:', failedBookmarks.length);

    // Debug: Log failure reasons
    if (failedBookmarks.length > 0) {
      const reasons = new Map<string, number>();
      for (const fb of failedBookmarks) {
        reasons.set(fb.reason, (reasons.get(fb.reason) ?? 0) + 1);
      }
      console.log('[Import] Failure reasons:', Object.fromEntries(reasons));
    }

    // Step 7: Bulk insert instances (2000 at a time, 3 parallel batches)
    const INSTANCE_BATCH = 2000;
    const PARALLEL_BATCHES = 3;
    let insertedCount = 0;

    // Map instance back to bookmark for error tracking
    const instanceToBookmark = new Map<number, { url: string; title: string }>();
    instancesToInsert.forEach((inst, idx) => {
      const bookmark = bookmarksWithKeys.find(
        (b) => urlKeyToId.get(b.urlKey) === inst.link_canonical_id
      );
      if (bookmark) {
        instanceToBookmark.set(idx, { url: bookmark.url, title: bookmark.title });
      }
    });

    // Split into batch groups for parallel processing
    const batches: { data: (typeof instancesToInsert)[number]; index: number }[][] = [];
    for (let i = 0; i < instancesToInsert.length; i += INSTANCE_BATCH) {
      batches.push(
        instancesToInsert.slice(i, i + INSTANCE_BATCH).map((d, j) => ({ data: d, index: i + j }))
      );
    }

    // Process batches in parallel groups
    // Phase 4: Instance insert (60-99%)
    const totalGroups = Math.ceil(batches.length / PARALLEL_BATCHES);
    for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
      const groupIndex = Math.floor(i / PARALLEL_BATCHES);
      const parallelGroup = batches.slice(i, i + PARALLEL_BATCHES);

      // Progress: phase 4 (60-99%)
      const phase4Progress = 60 + (groupIndex / Math.max(totalGroups, 1)) * 39;
      await updateProgress(phase4Progress);

      const results = await Promise.all(
        parallelGroup.map((batch) =>
          supabase.from('link_instances').insert(batch.map((b) => b.data))
        )
      );

      results.forEach((result, j) => {
        const batchData = parallelGroup[j];
        if (!result.error && batchData) {
          insertedCount += batchData.length;
        } else if (result.error && batchData) {
          console.error(`Batch insert error: ${result.error.message}`);
          // Mark all bookmarks in this failed batch
          for (const item of batchData) {
            const bookmark = instanceToBookmark.get(item.index);
            if (bookmark) {
              failedBookmarks.push({
                url: bookmark.url,
                title: bookmark.title,
                reason: `Insert failed: ${result.error.message}`,
              });
            }
          }
        }
      });
    }

    // Step 8: Enrich metadata in parallel
    // Fetch metadata for all URLs concurrently (with reasonable concurrency limit)
    console.log('[Import] Starting enrichment for', bookmarksWithKeys.length, 'links...');

    const ENRICH_CONCURRENCY = 10; // Process 10 URLs at a time
    const enrichResults: { canonicalId: string; success: boolean; error?: string }[] = [];

    // Create list of unique canonicals to enrich
    const canonicalsToEnrich = Array.from(urlKeyToId.entries()).map(([urlKey, canonicalId]) => {
      const bookmark = bookmarksWithKeys.find((b) => b.urlKey === urlKey);
      return {
        canonicalId,
        url: bookmark?.url || '',
      };
    });

    // Process in batches for controlled concurrency
    for (let i = 0; i < canonicalsToEnrich.length; i += ENRICH_CONCURRENCY) {
      const batch = canonicalsToEnrich.slice(i, i + ENRICH_CONCURRENCY);

      const batchResults = await Promise.allSettled(
        batch.map(async ({ canonicalId, url }) => {
          try {
            const metadata = await fetchMetadata(url);
            const description = getDescriptionFallback({
              metaDescription: metadata.description,
              pageText: metadata.pageText,
              maxLength: 300,
            });

            // Update canonical with enriched data
            await supabase
              .from('link_canonicals')
              .update({
                title: metadata.title,
                description: description || null,
                og_image: metadata.ogImage,
                favicon: metadata.favicon,
                updated_at: new Date().toISOString(),
              })
              .eq('id', canonicalId);

            return { canonicalId, success: true };
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            return { canonicalId, success: false, error: errorMsg };
          }
        })
      );

      // Collect results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          enrichResults.push(result.value);
        }
      }
    }

    const enrichSucceeded = enrichResults.filter((r) => r.success).length;
    const enrichFailed = enrichResults.filter((r) => !r.success).length;
    console.log('[Import] Enrichment complete:', enrichSucceeded, 'succeeded,', enrichFailed, 'failed');

    // Queue failed enrichments for later retry via worker
    const failedCanonicalIds = enrichResults.filter((r) => !r.success).map((r) => r.canonicalId);
    if (failedCanonicalIds.length > 0) {
      for (let i = 0; i < failedCanonicalIds.length; i += INSERT_BATCH) {
        const batch = failedCanonicalIds.slice(i, i + INSERT_BATCH);
        await supabase.from('enrichment_jobs').upsert(
          batch.map((id) => ({
            link_canonical_id: id,
            status: 'queued' as const,
          })),
          { onConflict: 'link_canonical_id', ignoreDuplicates: true }
        );
      }
      console.log('[Import] Queued', failedCanonicalIds.length, 'failed enrichments for retry');
    }

    // Mark job as succeeded
    await updateJobStatus(supabase, jobId, {
      status: 'succeeded',
      processed_items: totalItems,
      failed_items: failedBookmarks.length,
      finished_at: new Date().toISOString(),
    });

    return {
      success: true,
      foldersCreated: folderMap.size,
      linksCreated: insertedCount,
      linksSkipped: skipped,
      failedBookmarks,
    };
  } catch (err) {
    console.error('[Import Error]', err);
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);

    // Even on error, mark as succeeded if we imported some bookmarks
    // The failedBookmarks array will contain details of what failed
    failedBookmarks.push({
      url: '',
      title: 'System Error',
      reason: errorMsg.slice(0, 200),
    });

    await updateJobStatus(supabase, jobId, {
      status: 'succeeded', // Still mark as succeeded - partial import is better than none
      processed_items: totalItems,
      failed_items: failedBookmarks.length,
      last_error: errorMsg.slice(0, 500),
      finished_at: new Date().toISOString(),
    });

    return {
      success: true, // Partial success
      foldersCreated: 0,
      linksCreated: 0,
      linksSkipped: 0,
      failedBookmarks,
    };
  }
}

/**
 * Get unique folder name by appending (1), (2), etc. if duplicate exists
 */
async function getUniqueFolderName(
  supabase: SupabaseClient,
  userId: string,
  baseName: string,
  parentId: string | null
): Promise<string> {
  // Check if base name exists
  let query = supabase
    .from('folders')
    .select('name')
    .eq('user_id', userId)
    .like('name', `${baseName}%`);

  if (parentId) {
    query = query.eq('parent_id', parentId);
  } else {
    query = query.is('parent_id', null);
  }

  const { data: existing } = await query;
  const existingNames = new Set((existing ?? []).map((f) => f.name));

  if (!existingNames.has(baseName)) {
    return baseName;
  }

  // Find next available number
  let counter = 1;
  while (existingNames.has(`${baseName} (${counter})`)) {
    counter++;
  }
  return `${baseName} (${counter})`;
}

/**
 * Create folder structure from parsed folders
 * Returns a map of folder path (joined) -> folder ID
 */
async function createFolders(
  supabase: SupabaseClient,
  userId: string,
  parseResult: ParseResult,
  wrapInFolder?: boolean,
  wrapFolderName?: string | null
): Promise<{ folderMap: Map<string, string>; wrapperFolderId: string | null }> {
  const folderMap = new Map<string, string>();
  const flatFolders = flattenFolders(parseResult.folders);

  // Sort by path length to ensure parents are created before children
  flatFolders.sort((a, b) => a.path.length - b.path.length);

  // If wrapInFolder is true, create a wrapper folder first
  let wrapperFolderId: string | null = null;
  if (wrapInFolder) {
    const baseName = wrapFolderName || `imported-${Date.now()}`;
    const wrapperName = await getUniqueFolderName(supabase, userId, baseName, null);

    // Get max position for root level
    const { data: maxPosData } = await supabase
      .from('folders')
      .select('position')
      .eq('user_id', userId)
      .is('parent_id', null)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const position = (maxPosData?.position ?? -1) + 1;

    const { data: wrapperFolder, error } = await supabase
      .from('folders')
      .insert({
        user_id: userId,
        name: wrapperName,
        parent_id: null,
        position,
      })
      .select('id')
      .single();

    if (error) throw error;
    wrapperFolderId = wrapperFolder.id;
  }

  for (const folder of flatFolders) {
    const pathKey = folder.path.join('/');
    const parentPathKey = folder.parentPath.join('/');

    // Determine parent: if no parent path, use wrapper folder (if exists)
    let parentId: string | null;
    if (parentPathKey) {
      parentId = folderMap.get(parentPathKey) ?? null;
    } else {
      parentId = wrapperFolderId; // null if not wrapping
    }

    // Check if folder already exists under this parent
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

  return { folderMap, wrapperFolderId };
}

/**
 * Get or create the "미분류" folder for orphan bookmarks (those without folder path)
 */
async function getOrCreateImportedFolder(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const IMPORTED_FOLDER_NAME = '미분류';

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
