/**
 * Generic CSV Bookmarks Parser
 *
 * Parses CSV files with the following format:
 * url,title,description,folder,tags
 *
 * - folder: Uses slash (/) for hierarchy, e.g., "Work/Projects"
 * - tags: Uses pipe (|) for separation, e.g., "tag1|tag2"
 */

import type { ParsedBookmark, ParsedFolder, ParseResult } from './chrome-parser';

// Only allow http/https URLs
const VALID_URL_PATTERN = /^https?:\/\//i;

interface CsvRow {
  url: string;
  title: string;
  description?: string;
  folder?: string;
  tags?: string;
}

/**
 * Parse CSV bookmarks file
 */
export function parseCsvBookmarks(content: string): ParseResult {
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
  const columnMap = createColumnMap(header);

  if (columnMap.url === -1) {
    throw new Error('CSV must have a "url" column');
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row = extractRow(values, columnMap);

    // Validate URL
    if (!row.url || !VALID_URL_PATTERN.test(row.url)) {
      skippedUrls++;
      continue;
    }

    // Parse folder path
    const folderPath = row.folder
      ? row.folder
          .split('/')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    // Register folders
    registerFolderPath(folderPath, folderMap);

    bookmarks.push({
      url: row.url,
      title: row.title || row.url,
      addDate: null,
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
        // Escaped quote
        current += '"';
        i++;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ',') {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  // Don't forget the last field
  result.push(current.trim());

  return result;
}

interface ColumnMap {
  url: number;
  title: number;
  description: number;
  folder: number;
  tags: number;
}

/**
 * Create column index map from header
 */
function createColumnMap(header: string[]): ColumnMap {
  const map: ColumnMap = {
    url: -1,
    title: -1,
    description: -1,
    folder: -1,
    tags: -1,
  };

  header.forEach((col, index) => {
    const normalized = col.toLowerCase().trim();
    if (normalized === 'url' || normalized === 'link') {
      map.url = index;
    } else if (normalized === 'title' || normalized === 'name') {
      map.title = index;
    } else if (normalized === 'description' || normalized === 'desc' || normalized === 'note') {
      map.description = index;
    } else if (normalized === 'folder' || normalized === 'category' || normalized === 'path') {
      map.folder = index;
    } else if (normalized === 'tags' || normalized === 'labels') {
      map.tags = index;
    }
  });

  return map;
}

/**
 * Extract row data based on column map
 */
function extractRow(values: string[], map: ColumnMap): CsvRow {
  return {
    url: map.url >= 0 ? values[map.url] || '' : '',
    title: map.title >= 0 ? values[map.title] || '' : '',
    description: map.description >= 0 ? values[map.description] : undefined,
    folder: map.folder >= 0 ? values[map.folder] : undefined,
    tags: map.tags >= 0 ? values[map.tags] : undefined,
  };
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

  // Sort by path length to process parents first
  const sortedFolders = Array.from(folderMap.entries()).sort(
    (a, b) => a[1].path.length - b[1].path.length
  );

  for (const [, folder] of sortedFolders) {
    if (folder.path.length === 1) {
      // Root level folder
      rootFolders.push(folder);
    } else {
      // Find parent
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
 * Parse tags from pipe-separated string
 */
export function parseTags(tagString: string | undefined): string[] {
  if (!tagString) return [];
  return tagString
    .split('|')
    .map((t) => t.trim())
    .filter(Boolean);
}
