/**
 * Raindrop.io Bookmarks Parser
 *
 * Supports both HTML and CSV export formats from Raindrop.io
 *
 * Raindrop CSV columns:
 * id, title, note, excerpt, url, folder, tags, created, cover, highlights, favorite
 *
 * Raindrop HTML uses standard Netscape Bookmark format
 */

import type { ParsedBookmark, ParsedFolder, ParseResult } from './chrome-parser';

// Only allow http/https URLs
const VALID_URL_PATTERN = /^https?:\/\//i;

/**
 * Parse Raindrop CSV export
 */
export function parseRaindropCsv(content: string): ParseResult {
  const bookmarks: ParsedBookmark[] = [];
  const folderMap = new Map<string, ParsedFolder>();
  let skippedUrls = 0;

  const lines = content.split('\n');
  if (lines.length < 2) {
    return {
      bookmarks: [],
      folders: [],
      stats: { totalBookmarks: 0, totalFolders: 0, skippedUrls: 0 },
    };
  }

  // Parse header
  const header = parseCSVLine(lines[0]!);
  const columnMap = createRaindropColumnMap(header);

  if (columnMap.url === -1) {
    throw new Error('Raindrop CSV must have a "url" column');
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;

    const values = parseCSVLine(line);

    const url = columnMap.url >= 0 ? values[columnMap.url] || '' : '';
    const title = columnMap.title >= 0 ? values[columnMap.title] || '' : '';
    const folder = columnMap.folder >= 0 ? values[columnMap.folder] || '' : '';
    const created = columnMap.created >= 0 ? values[columnMap.created] : '';

    // Validate URL
    if (!url || !VALID_URL_PATTERN.test(url)) {
      skippedUrls++;
      continue;
    }

    // Parse folder path - Raindrop uses " / " (space-slash-space) for hierarchy
    const folderPath = folder
      ? folder
          .split(/\s*\/\s*/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    // Register folders
    registerFolderPath(folderPath, folderMap);

    // Parse created date
    let addDate: Date | null = null;
    if (created) {
      const parsed = new Date(created);
      if (!isNaN(parsed.getTime())) {
        addDate = parsed;
      }
    }

    bookmarks.push({
      url,
      title: title || url,
      addDate,
      folderPath,
      icon: null,
    });
  }

  // Build folder tree
  const folders = buildFolderTree(folderMap);

  return {
    bookmarks,
    folders,
    stats: {
      totalBookmarks: bookmarks.length,
      totalFolders: folderMap.size,
      skippedUrls,
    },
  };
}

/**
 * Parse Raindrop HTML export (same as Chrome format)
 */
export function parseRaindropHtml(html: string): ParseResult {
  // Raindrop HTML uses standard Netscape Bookmark format
  // We can use similar logic to Chrome parser
  const bookmarks: ParsedBookmark[] = [];
  const folders: ParsedFolder[] = [];
  let skippedUrls = 0;

  const lines = html.split('\n');
  const folderStack: string[] = [];
  const folderTree: ParsedFolder[] = [];
  const folderStackNodes: ParsedFolder[][] = [folderTree];

  // Raindrop doesn't use special folder names like Chrome
  // So we don't need to skip any folders

  for (const line of lines) {
    const trimmed = line.trim();

    // Folder start: <DT><H3 ...>Folder Name</H3>
    const folderMatch = trimmed.match(/<DT><H3[^>]*>([^<]+)<\/H3>/i);
    if (folderMatch) {
      const folderName = decodeHtmlEntities(folderMatch[1]!);
      folderStack.push(folderName);

      const newFolder: ParsedFolder = {
        name: folderName,
        path: [...folderStack],
        children: [],
      };

      // Add to parent's children
      const currentLevel = folderStackNodes[folderStackNodes.length - 1];
      currentLevel?.push(newFolder);

      // Push new level for children
      folderStackNodes.push(newFolder.children);
      folders.push(newFolder);
      continue;
    }

    // Bookmark: <DT><A HREF="url" ADD_DATE="timestamp" ...>Title</A>
    const bookmarkMatch = trimmed.match(
      /<DT><A\s+HREF="([^"]+)"(?:\s+ADD_DATE="(\d+)")?[^>]*>([^<]*)<\/A>/i
    );
    if (bookmarkMatch) {
      const url = decodeHtmlEntities(bookmarkMatch[1]!);
      const addDateStr = bookmarkMatch[2];
      const title = decodeHtmlEntities(bookmarkMatch[3] || '');

      // Validate URL
      if (!VALID_URL_PATTERN.test(url)) {
        skippedUrls++;
        continue;
      }

      // Parse add date
      let addDate: Date | null = null;
      if (addDateStr) {
        const timestamp = parseInt(addDateStr, 10);
        if (!isNaN(timestamp)) {
          const ms = timestamp > 10000000000 ? timestamp / 1000 : timestamp * 1000;
          addDate = new Date(ms);
        }
      }

      bookmarks.push({
        url,
        title: title || url,
        addDate,
        folderPath: [...folderStack],
        icon: null,
      });
      continue;
    }

    // Folder end: </DL>
    if (trimmed.match(/<\/DL>/i)) {
      if (folderStack.length > 0) {
        folderStack.pop();
        folderStackNodes.pop();
      }
    }
  }

  return {
    bookmarks,
    folders: folderTree,
    stats: {
      totalBookmarks: bookmarks.length,
      totalFolders: folders.length,
      skippedUrls,
    },
  };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

interface RaindropColumnMap {
  id: number;
  title: number;
  note: number;
  excerpt: number;
  url: number;
  folder: number;
  tags: number;
  created: number;
  cover: number;
  highlights: number;
  favorite: number;
}

/**
 * Create column index map from Raindrop CSV header
 */
function createRaindropColumnMap(header: string[]): RaindropColumnMap {
  const map: RaindropColumnMap = {
    id: -1,
    title: -1,
    note: -1,
    excerpt: -1,
    url: -1,
    folder: -1,
    tags: -1,
    created: -1,
    cover: -1,
    highlights: -1,
    favorite: -1,
  };

  header.forEach((col, index) => {
    const normalized = col.toLowerCase().trim();
    if (normalized in map) {
      map[normalized as keyof RaindropColumnMap] = index;
    }
  });

  return map;
}

/**
 * Register a folder path in the folder map
 */
function registerFolderPath(path: string[], folderMap: Map<string, ParsedFolder>): void {
  for (let i = 1; i <= path.length; i++) {
    const currentPath = path.slice(0, i);
    const key = currentPath.join('/');

    if (!folderMap.has(key)) {
      folderMap.set(key, {
        name: currentPath[currentPath.length - 1]!,
        path: currentPath,
        children: [],
      });
    }
  }
}

/**
 * Build folder tree from flat map
 */
function buildFolderTree(folderMap: Map<string, ParsedFolder>): ParsedFolder[] {
  const rootFolders: ParsedFolder[] = [];

  const sortedFolders = Array.from(folderMap.entries()).sort(
    (a, b) => a[1].path.length - b[1].path.length
  );

  for (const [, folder] of sortedFolders) {
    if (folder.path.length === 1) {
      rootFolders.push(folder);
    } else {
      const parentPath = folder.path.slice(0, -1).join('/');
      const parent = folderMap.get(parentPath);
      if (parent) {
        parent.children.push(folder);
      }
    }
  }

  return rootFolders;
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}
