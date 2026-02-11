import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/actions';
import { canAccessNLSearch } from '@/domain/entitlement/checker';
import { generateEmbedding, embeddingCache } from '@/lib/ai';

interface HybridSearchResult {
  instance_id: string;
  canonical_id: string;
  original_url: string;
  domain: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  favicon: string | null;
  user_title: string | null;
  user_description: string | null;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
  similarity: number;
  keyword_match: boolean;
}

type SortOption = 'newest' | 'oldest' | 'relevance' | 'domain';
type TagMode = 'and' | 'or';

interface SearchParams {
  query: string;
  folderIds: string[];
  tagNames: string[];
  tagMode: TagMode;
  dateFrom: Date | null;
  dateTo: Date | null;
  favoriteOnly: boolean;
  sort: SortOption;
  mode: 'exact' | 'nl';
}

function parseSearchParams(searchParams: URLSearchParams): SearchParams {
  const query = searchParams.get('q') || '';

  // Support both single folder (legacy) and multiple folders
  const folderId = searchParams.get('folder');
  const foldersParam = searchParams.get('folders');
  const folderIds = foldersParam
    ? foldersParam.split(',').filter(Boolean)
    : folderId
      ? [folderId]
      : [];

  // Support both single tag (legacy) and multiple tags
  const tagName = searchParams.get('tag');
  const tagsParam = searchParams.get('tags');
  const tagNames = tagsParam ? tagsParam.split(',').filter(Boolean) : tagName ? [tagName] : [];

  const tagMode = (searchParams.get('tagMode') || 'or') as TagMode;

  const dateFromStr = searchParams.get('dateFrom');
  const dateToStr = searchParams.get('dateTo');
  const dateFrom = dateFromStr ? new Date(dateFromStr) : null;
  const dateTo = dateToStr ? new Date(dateToStr) : null;

  const favoriteOnly = searchParams.get('favorite') === 'true';
  const sort = (searchParams.get('sort') || 'newest') as SortOption;
  const mode = (searchParams.get('mode') || 'exact') as 'exact' | 'nl';

  return {
    query,
    folderIds,
    tagNames,
    tagMode,
    dateFrom,
    dateTo,
    favoriteOnly,
    sort,
    mode,
  };
}

// Resolve folder short_ids to UUIDs
async function resolveFolderIds(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  shortIds: string[]
): Promise<{ shortId: string; uuid: string }[]> {
  if (shortIds.length === 0) return [];

  const { data: folders } = await supabase
    .from('folders')
    .select('id, short_id')
    .eq('user_id', userId)
    .in('short_id', shortIds);

  return (folders ?? []).map((f) => ({ shortId: f.short_id, uuid: f.id }));
}

// GET search links
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const user = await requireUser();
  const supabase = createServiceClient();

  const params = parseSearchParams(request.nextUrl.searchParams);
  const { query } = params;

  // Resolve folder short_ids to UUIDs
  const folderMappings = await resolveFolderIds(supabase, user.id, params.folderIds);
  const folderUuids = folderMappings.map((f) => f.uuid);
  // Replace short_ids with UUIDs for filtering
  params.folderIds = folderUuids;

  // Check NL search entitlement - auto-enable for Pro users when there's a query
  if (query && query.trim().length > 0) {
    // DEV MODE: Skip entitlement check for testing
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      // In development, always use hybrid search if query exists
      return performHybridSearch(supabase, user.id, params, startTime);
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .maybeSingle();

    const entitlement = subscription
      ? {
          plan: subscription.plan as 'free' | 'pro' | 'lifetime',
          status: subscription.status as 'active' | 'trialing' | 'past_due' | 'canceled',
        }
      : null;

    // If user has NL search access, use hybrid search automatically
    if (canAccessNLSearch(entitlement)) {
      return performHybridSearch(supabase, user.id, params, startTime);
    }
  }

  // Exact search for free users or when no query
  return performExactSearch(supabase, user.id, params);
}

/**
 * Perform hybrid search (semantic + keyword)
 */
async function performHybridSearch(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  params: SearchParams,
  startTime: number
) {
  const { query, folderIds, tagNames, tagMode, dateFrom, dateTo, favoriteOnly, sort } = params;

  // Try to get cached embedding first
  let embedding = await embeddingCache.get(query);
  let tokensUsed: number | undefined;
  let cacheHit = false;

  if (embedding) {
    cacheHit = true;
    console.log('[Search] Cache HIT for query:', query);
  } else {
    // Generate embedding for search query
    const embeddingResult = await generateEmbedding(query);
    console.log(
      '[Search] Cache MISS, generated embedding:',
      embeddingResult.success,
      'length:',
      embeddingResult.embedding?.length
    );

    if (embeddingResult.success && embeddingResult.embedding) {
      embedding = embeddingResult.embedding;
      tokensUsed = embeddingResult.tokensUsed;
      // Cache the embedding (async, don't wait)
      embeddingCache.set(query, embedding).catch(() => {});
    }
  }

  if (!embedding) {
    // Fallback to exact search if embedding fails
    console.log('[Search] Embedding failed, falling back to exact search');
    return performExactSearch(supabase, userId, params);
  }

  // Hybrid search (semantic + keyword)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hybridResults, error } = await (supabase as any).rpc('search_links_hybrid', {
    query_embedding: embedding,
    query_text: query,
    user_id_input: userId,
    match_threshold: 0.25,
    match_count: 50,
  });

  if (error) {
    console.log('[Search] Hybrid search error:', error.message, error.code);
    // If the function doesn't exist (migration not applied), fallback to exact search
    if (error.message.includes('function') || error.code === '42883') {
      return performExactSearch(supabase, userId, params);
    }
    throw error;
  }

  // Post-process results: filter by folder/tag/date/favorite if specified
  let results = (hybridResults || []) as HybridSearchResult[];

  // Filter by folders if specified (OR logic - any of the selected folders)
  if (folderIds.length > 0) {
    const folderIdSet = new Set(folderIds);
    results = results.filter((r) => r.folder_id && folderIdSet.has(r.folder_id));
  }

  // Filter by date range
  if (dateFrom) {
    results = results.filter((r) => new Date(r.created_at) >= dateFrom);
  }
  if (dateTo) {
    results = results.filter((r) => new Date(r.created_at) <= dateTo);
  }

  // Filter by favorite
  if (favoriteOnly) {
    results = results.filter((r) => r.is_favorite);
  }

  // Filter by tags if specified
  if (tagNames.length > 0) {
    const instanceIds = results.map((r) => r.instance_id);

    // Get tag IDs for the specified tag names
    const { data: matchingTags } = await supabase
      .from('tags')
      .select('id, name')
      .eq('user_id', userId)
      .in('name', tagNames);

    if (matchingTags && matchingTags.length > 0) {
      const tagIdSet = new Set(matchingTags.map((t) => t.id));

      const { data: linkTags } = await supabase
        .from('link_tags')
        .select('link_instance_id, tag_id')
        .in('link_instance_id', instanceIds)
        .in('tag_id', [...tagIdSet]);

      // Group tags by instance
      const instanceTagCounts = new Map<string, Set<string>>();
      for (const lt of linkTags ?? []) {
        const existing = instanceTagCounts.get(lt.link_instance_id) ?? new Set();
        existing.add(lt.tag_id);
        instanceTagCounts.set(lt.link_instance_id, existing);
      }

      if (tagMode === 'and') {
        // AND mode: instance must have ALL specified tags
        results = results.filter((r) => {
          const instanceTags = instanceTagCounts.get(r.instance_id);
          return instanceTags && instanceTags.size >= tagIdSet.size;
        });
      } else {
        // OR mode: instance must have ANY of the specified tags
        results = results.filter((r) => instanceTagCounts.has(r.instance_id));
      }
    } else {
      results = [];
    }
  }

  // Fetch folders for results (include short_id)
  const resultFolderIds = [
    ...new Set(results.map((r) => r.folder_id).filter((id): id is string => id !== null)),
  ];
  let folderMap = new Map<string, { id: string; name: string }>();
  if (resultFolderIds.length > 0) {
    const { data: folders } = await supabase
      .from('folders')
      .select('id, short_id, name')
      .in('id', resultFolderIds);
    folderMap = new Map(folders?.map((f) => [f.id, { id: f.short_id, name: f.name }]) ?? []);
  }

  // Fetch canonical short_ids
  const canonicalIds = [...new Set(results.map((r) => r.canonical_id))];
  let canonicalShortIdMap = new Map<string, string>();
  if (canonicalIds.length > 0) {
    const { data: canonicals } = await supabase
      .from('link_canonicals')
      .select('id, short_id')
      .in('id', canonicalIds);
    canonicalShortIdMap = new Map(canonicals?.map((c) => [c.id, c.short_id]) ?? []);
  }

  // Fetch tags for results
  const instanceIds = results.map((r) => r.instance_id);
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

  const instanceTagsMap = new Map<string, { id: string; name: string }[]>();
  for (const lt of linkTags ?? []) {
    const tag = tagMap.get(lt.tag_id);
    if (tag) {
      const existing = instanceTagsMap.get(lt.link_instance_id) ?? [];
      existing.push(tag);
      instanceTagsMap.set(lt.link_instance_id, existing);
    }
  }

  // Sort results
  if (sort === 'oldest') {
    results.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else if (sort === 'newest') {
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sort === 'domain') {
    results.sort((a, b) => a.domain.localeCompare(b.domain));
  }
  // 'relevance' keeps the original order from hybrid search

  // Format results (use short_id for canonical and folder)
  const formattedResults = results.map((r) => ({
    id: r.instance_id,
    user_title: r.user_title,
    user_description: r.user_description,
    position: 0,
    created_at: r.created_at,
    updated_at: r.updated_at,
    is_favorite: r.is_favorite ?? false,
    canonical: {
      id: canonicalShortIdMap.get(r.canonical_id) || r.canonical_id,
      url_key: '',
      original_url: r.original_url,
      domain: r.domain,
      title: r.title,
      description: r.description,
      og_image: r.og_image,
      favicon: r.favicon,
    },
    folder: r.folder_id ? folderMap.get(r.folder_id) || null : null,
    tags: instanceTagsMap.get(r.instance_id) ?? [],
    similarity: r.similarity,
    keyword_match: r.keyword_match,
  }));

  return NextResponse.json({
    results: formattedResults,
    query,
    mode: 'nl',
    searchType: 'hybrid',
    cacheHit,
    tokensUsed,
    total: formattedResults.length,
    filters: {
      folders: folderIds,
      tags: tagNames,
      tagMode,
      dateRange:
        dateFrom || dateTo ? { from: dateFrom?.toISOString(), to: dateTo?.toISOString() } : null,
      favorite: favoriteOnly,
    },
    sort,
    latencyMs: Date.now() - startTime,
  });
}

/**
 * Perform exact (keyword) search via PostgreSQL RPC
 * ILIKE matching happens in the database — only matched rows are transferred.
 */
async function performExactSearch(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  params: SearchParams
) {
  const { query, folderIds, tagNames, tagMode, dateFrom, dateTo, favoriteOnly, sort } = params;

  const emptyResponse = {
    results: [],
    query,
    mode: 'exact' as const,
    total: 0,
    filters: {
      folders: folderIds,
      tags: tagNames,
      tagMode,
      dateRange:
        dateFrom || dateTo ? { from: dateFrom?.toISOString(), to: dateTo?.toISOString() } : null,
      favorite: favoriteOnly,
    },
    sort,
  };

  // Call PostgreSQL function — ILIKE matching + JOIN + sorting all in DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await (supabase as any).rpc('search_links_keyword', {
    user_id_input: userId,
    query_text: query || '',
    folder_ids: folderIds.length > 0 ? folderIds : null,
    favorite_only: favoriteOnly,
    date_from: dateFrom?.toISOString() ?? null,
    date_to: dateTo?.toISOString() ?? null,
    sort_by: sort,
    match_count: 50,
  });

  if (error) {
    console.error('[Search] Keyword search RPC error:', error.message);
    return NextResponse.json(emptyResponse);
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json(emptyResponse);
  }

  // Filter by tags if specified (post-filter since tag logic is complex)
  let matchedRows = rows as Array<{
    instance_id: string;
    user_title: string | null;
    user_description: string | null;
    position: number;
    created_at: string;
    updated_at: string;
    is_favorite: boolean;
    folder_id: string | null;
    canonical_id: string;
    short_id: string;
    url_key: string;
    original_url: string;
    domain: string;
    title: string | null;
    description: string | null;
    og_image: string | null;
    favicon: string | null;
  }>;

  if (tagNames.length > 0) {
    const instanceIds = matchedRows.map((r) => r.instance_id);

    const { data: matchingTags } = await supabase
      .from('tags')
      .select('id, name')
      .eq('user_id', userId)
      .in('name', tagNames);

    if (matchingTags && matchingTags.length > 0) {
      const tagIdSet = new Set(matchingTags.map((t) => t.id));

      const { data: linkTags } = await supabase
        .from('link_tags')
        .select('link_instance_id, tag_id')
        .in('link_instance_id', instanceIds)
        .in('tag_id', [...tagIdSet]);

      const instanceTagCounts = new Map<string, Set<string>>();
      for (const lt of linkTags ?? []) {
        const existing = instanceTagCounts.get(lt.link_instance_id) ?? new Set();
        existing.add(lt.tag_id);
        instanceTagCounts.set(lt.link_instance_id, existing);
      }

      if (tagMode === 'and') {
        matchedRows = matchedRows.filter((r) => {
          const tags = instanceTagCounts.get(r.instance_id);
          return tags && tags.size >= tagIdSet.size;
        });
      } else {
        matchedRows = matchedRows.filter((r) => instanceTagCounts.has(r.instance_id));
      }
    } else {
      return NextResponse.json(emptyResponse);
    }
  }

  // Fetch folders and tags for results (parallel)
  const matchedIds = matchedRows.map((r) => r.instance_id);
  const matchedFolderIds = [
    ...new Set(matchedRows.map((r) => r.folder_id).filter((id): id is string => id !== null)),
  ];

  const [foldersResult, linkTagsResult] = await Promise.all([
    matchedFolderIds.length > 0
      ? supabase.from('folders').select('id, short_id, name').in('id', matchedFolderIds)
      : Promise.resolve({ data: [] }),
    matchedIds.length > 0
      ? supabase
          .from('link_tags')
          .select('link_instance_id, tag_id')
          .in('link_instance_id', matchedIds)
      : Promise.resolve({ data: [] }),
  ]);

  const folderMap = new Map(
    (foldersResult.data ?? []).map((f: { id: string; short_id: string; name: string }) => [
      f.id,
      { id: f.short_id, name: f.name },
    ])
  );

  const tagIds = [
    ...new Set((linkTagsResult.data ?? []).map((lt: { tag_id: string }) => lt.tag_id)),
  ];
  let tagMap = new Map<string, { id: string; name: string }>();
  if (tagIds.length > 0) {
    const { data: tags } = await supabase.from('tags').select('id, name').in('id', tagIds);
    tagMap = new Map(tags?.map((t) => [t.id, t]) ?? []);
  }

  const instanceTagsMap = new Map<string, { id: string; name: string }[]>();
  for (const lt of linkTagsResult.data ?? []) {
    const tag = tagMap.get((lt as { tag_id: string }).tag_id);
    if (tag) {
      const key = (lt as { link_instance_id: string }).link_instance_id;
      const existing = instanceTagsMap.get(key) ?? [];
      existing.push(tag);
      instanceTagsMap.set(key, existing);
    }
  }

  // Format results
  const results = matchedRows.map((r) => ({
    id: r.instance_id,
    user_title: r.user_title,
    user_description: r.user_description,
    position: r.position,
    created_at: r.created_at,
    updated_at: r.updated_at,
    is_favorite: r.is_favorite,
    canonical: {
      id: r.short_id,
      url_key: r.url_key,
      original_url: r.original_url,
      domain: r.domain,
      title: r.title,
      description: r.description,
      og_image: r.og_image,
      favicon: r.favicon,
    },
    folder: r.folder_id ? (folderMap.get(r.folder_id) ?? null) : null,
    tags: instanceTagsMap.get(r.instance_id) ?? [],
  }));

  return NextResponse.json({
    results,
    query,
    mode: 'exact',
    total: results.length,
    filters: {
      folders: folderIds,
      tags: tagNames,
      tagMode,
      dateRange:
        dateFrom || dateTo ? { from: dateFrom?.toISOString(), to: dateTo?.toISOString() } : null,
      favorite: favoriteOnly,
    },
    sort,
  });
}
