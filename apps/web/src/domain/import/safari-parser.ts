/**
 * Safari Bookmarks HTML Parser
 *
 * Parses Safari's exported bookmarks HTML file.
 * Safari uses the Netscape Bookmark format but may:
 * - Not include ADD_DATE attributes
 * - Use different folder names (Reading List, Favorites, etc.)
 */

import type { ParsedBookmark, ParsedFolder, ParseResult } from './chrome-parser';

// Only allow http/https URLs
const VALID_URL_PATTERN = /^https?:\/\//i;

// Skip Safari's special folders
const SKIP_FOLDERS = new Set([
  'Bookmarks',
  '북마크',
  'Bookmarks Menu',
  '북마크 메뉴',
  'Favorites',
  '즐겨찾기',
  '즐겨찾기 막대',
  'Favorites Bar',
  'Reading List',
  '읽기 목록',
]);

/**
 * Parse Safari bookmarks HTML string
 */
export function parseSafariBookmarks(html: string): ParseResult {
  const bookmarks: ParsedBookmark[] = [];
  const folders: ParsedFolder[] = [];
  let skippedUrls = 0;

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

      // Skip special Safari folders but process their contents
      if (SKIP_FOLDERS.has(folderName)) {
        folderStack.push('__SKIP__');
        const currentLevel = folderStackNodes[folderStackNodes.length - 1];
        folderStackNodes.push(currentLevel || []);
      } else {
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
      }
      continue;
    }

    // Bookmark: <DT><A HREF="url" ...>Title</A>
    // Safari may not have ADD_DATE, so we make it more flexible
    const bookmarkMatch = trimmed.match(
      /<DT><A\s+HREF="([^"]+)"(?:\s+ADD_DATE="(\d+)")?[^>]*>([^<]*)<\/A>/i
    );
    if (bookmarkMatch) {
      const url = decodeHtmlEntities(bookmarkMatch[1]!);
      const addDateStr = bookmarkMatch[2];
      const title = decodeHtmlEntities(bookmarkMatch[3] || '');

      // Extract ICON attribute
      const iconMatch = trimmed.match(/ICON="([^"]+)"/i);
      const icon = iconMatch ? iconMatch[1]! : null;

      // Validate URL
      if (!VALID_URL_PATTERN.test(url)) {
        skippedUrls++;
        continue;
      }

      // Parse add date if present
      let addDate: Date | null = null;
      if (addDateStr) {
        const timestamp = parseInt(addDateStr, 10);
        if (!isNaN(timestamp)) {
          // Handle various timestamp formats
          const ms = timestamp > 10000000000 ? timestamp / 1000 : timestamp * 1000;
          addDate = new Date(ms);
        }
      }

      // Get folder path (excluding __SKIP__ markers)
      const folderPath = folderStack.filter((f) => f !== '__SKIP__');

      bookmarks.push({
        url,
        title: title || url,
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
