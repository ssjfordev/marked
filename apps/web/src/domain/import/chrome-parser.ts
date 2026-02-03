/**
 * Chrome Bookmarks HTML Parser
 *
 * Parses Chrome's exported bookmarks HTML file and extracts:
 * - Folder structure (nested)
 * - Bookmark URLs, titles, and add dates
 *
 * Chrome bookmarks HTML format:
 * <DL><p>
 *   <DT><H3>Folder Name</H3>
 *   <DL><p>
 *     <DT><A HREF="url" ADD_DATE="timestamp">Title</A>
 *   </DL><p>
 * </DL><p>
 */

export interface ParsedBookmark {
  url: string;
  title: string;
  addDate: Date | null;
  folderPath: string[]; // Path from root, e.g. ['Bookmarks Bar', 'Tech', 'React']
  icon: string | null; // ICON attribute from bookmark (usually data:image/png;base64,...)
}

export interface ParsedFolder {
  name: string;
  path: string[]; // Full path including this folder
  children: ParsedFolder[];
}

export interface ParseResult {
  bookmarks: ParsedBookmark[];
  folders: ParsedFolder[];
  stats: {
    totalBookmarks: number;
    totalFolders: number;
    skippedUrls: number; // Invalid or unsupported URLs
  };
}

// Skip these special Chrome folders (they're virtual or top-level containers)
const SKIP_FOLDERS = new Set([
  'Bookmarks',
  'Bookmarks Bar',
  '북마크 바',
  '북마크바',
  'Other Bookmarks',
  '기타 북마크',
  'Mobile Bookmarks',
  '모바일 북마크',
]);

// Only allow http/https URLs
const VALID_URL_PATTERN = /^https?:\/\//i;

/**
 * Parse Chrome bookmarks HTML string
 */
export function parseChromeBooksmarks(html: string): ParseResult {
  const bookmarks: ParsedBookmark[] = [];
  const folders: ParsedFolder[] = [];
  let skippedUrls = 0;

  // Use regex-based parsing since we're in a non-DOM environment
  // This is a simple state machine approach

  const lines = html.split('\n');
  const folderStack: string[] = [];
  const folderTree: ParsedFolder[] = [];
  const folderStackNodes: ParsedFolder[][] = [folderTree];

  for (const line of lines) {
    const trimmed = line.trim();

    // Folder start: <DT><H3 ...>Folder Name</H3>
    const folderMatch = trimmed.match(/<DT><H3[^>]*>([^<]+)<\/H3>/i);
    if (folderMatch) {
      const folderName = decodeHtmlEntities(folderMatch[1]!);

      // Skip special Chrome folders but still process their contents
      if (!SKIP_FOLDERS.has(folderName)) {
        folderStack.push(folderName);

        // Path excludes __SKIP__ markers
        const cleanPath = folderStack.filter((f) => f !== '__SKIP__');
        const newFolder: ParsedFolder = {
          name: folderName,
          path: cleanPath,
          children: [],
        };

        // Add to parent's children
        const currentLevel = folderStackNodes[folderStackNodes.length - 1];
        currentLevel?.push(newFolder);

        // Push new level for children
        folderStackNodes.push(newFolder.children);
        folders.push(newFolder);
      } else {
        // Skip this folder but keep children at current level
        // Push the same current level so children go to parent
        folderStack.push('__SKIP__');
        const currentLevel = folderStackNodes[folderStackNodes.length - 1];
        folderStackNodes.push(currentLevel || []);
      }
      continue;
    }

    // Bookmark: <DT><A HREF="url" ADD_DATE="timestamp" ICON="..." ...>Title</A>
    const bookmarkMatch = trimmed.match(
      /<DT><A\s+HREF="([^"]+)"(?:\s+ADD_DATE="(\d+)")?[^>]*>([^<]*)<\/A>/i
    );
    if (bookmarkMatch) {
      const url = decodeHtmlEntities(bookmarkMatch[1]!);
      const addDateStr = bookmarkMatch[2];
      const title = decodeHtmlEntities(bookmarkMatch[3] || '');

      // Extract ICON attribute (usually data:image/png;base64,...)
      const iconMatch = trimmed.match(/ICON="([^"]+)"/i);
      const icon = iconMatch ? iconMatch[1]! : null;

      // Validate URL
      if (!VALID_URL_PATTERN.test(url)) {
        skippedUrls++;
        continue;
      }

      // Parse add date (Chrome uses seconds since epoch)
      let addDate: Date | null = null;
      if (addDateStr) {
        const timestamp = parseInt(addDateStr, 10);
        if (!isNaN(timestamp)) {
          // Chrome timestamps are in microseconds in newer versions, seconds in older
          // If timestamp is > 10 billion, it's microseconds
          const ms = timestamp > 10000000000 ? timestamp / 1000 : timestamp * 1000;
          addDate = new Date(ms);
        }
      }

      // Get folder path (excluding __SKIP__ markers)
      const folderPath = folderStack.filter((f) => f !== '__SKIP__');

      bookmarks.push({
        url,
        title: title || url, // Use URL as fallback title
        addDate,
        folderPath,
        icon,
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

/**
 * Flatten folder tree to a list with parent relationships
 */
export function flattenFolders(
  folders: ParsedFolder[],
  parentPath: string[] = []
): Array<{ name: string; path: string[]; parentPath: string[] }> {
  const result: Array<{ name: string; path: string[]; parentPath: string[] }> = [];

  for (const folder of folders) {
    result.push({
      name: folder.name,
      path: folder.path,
      parentPath,
    });

    if (folder.children.length > 0) {
      result.push(...flattenFolders(folder.children, folder.path));
    }
  }

  return result;
}
