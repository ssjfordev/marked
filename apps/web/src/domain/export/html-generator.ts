/**
 * HTML Export Generator
 *
 * Generates Netscape Bookmark File Format that is compatible with
 * Chrome, Firefox, Safari, Edge, and other browsers.
 */

export interface ExportLink {
  url: string;
  title: string;
  description?: string | null;
  createdAt: string;
  isFavorite?: boolean;
  tags?: string[];
}

export interface ExportFolder {
  id: string;
  name: string;
  links: ExportLink[];
  children: ExportFolder[];
}

export interface ExportData {
  exportedAt: string;
  totalLinks: number;
  folders: ExportFolder[];
}

/**
 * Generate Netscape Bookmark HTML format
 */
export function generateHtmlExport(data: ExportData): string {
  const lines: string[] = [];

  // Header
  lines.push('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
  lines.push('<!-- This is an automatically generated file.');
  lines.push(`     Exported from Marked on ${data.exportedAt} -->`);
  lines.push('<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">');
  lines.push('<TITLE>Bookmarks</TITLE>');
  lines.push('<H1>Bookmarks</H1>');
  lines.push('<DL><p>');

  // Generate folder structure recursively
  for (const folder of data.folders) {
    generateFolderHtml(folder, lines, 1);
  }

  lines.push('</DL><p>');

  return lines.join('\n');
}

/**
 * Generate HTML for a single folder and its contents
 */
function generateFolderHtml(folder: ExportFolder, lines: string[], depth: number): void {
  const indent = '    '.repeat(depth);

  // Folder header
  const addDate = Math.floor(Date.now() / 1000);
  lines.push(`${indent}<DT><H3 ADD_DATE="${addDate}">${escapeHtml(folder.name)}</H3>`);
  lines.push(`${indent}<DL><p>`);

  // Links in this folder
  for (const link of folder.links) {
    const linkIndent = '    '.repeat(depth + 1);
    const timestamp = Math.floor(new Date(link.createdAt).getTime() / 1000);
    lines.push(
      `${linkIndent}<DT><A HREF="${escapeHtml(link.url)}" ADD_DATE="${timestamp}">${escapeHtml(link.title)}</A>`
    );
  }

  // Child folders
  for (const child of folder.children) {
    generateFolderHtml(child, lines, depth + 1);
  }

  lines.push(`${indent}</DL><p>`);
}

/**
 * Escape special HTML characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
