/**
 * CSV Export Generator
 *
 * Generates CSV file with bookmarks data.
 * Compatible with spreadsheet applications and re-import.
 */

import type { ExportData, ExportFolder, ExportLink } from './html-generator';

interface FlattenedLink extends ExportLink {
  folderPath: string;
}

/**
 * Generate CSV export
 */
export function generateCsvExport(data: ExportData): string {
  const lines: string[] = [];

  // Header row
  lines.push('url,title,description,folder,tags,created_at,is_favorite');

  // Flatten folder structure to get all links with paths
  const flatLinks = flattenFolders(data.folders, []);

  // Generate data rows
  for (const link of flatLinks) {
    const row = [
      escapeCsvField(link.url),
      escapeCsvField(link.title),
      escapeCsvField(link.description || ''),
      escapeCsvField(link.folderPath),
      escapeCsvField((link.tags || []).join('|')),
      escapeCsvField(link.createdAt),
      link.isFavorite ? 'true' : 'false',
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * Flatten folder structure to list of links with folder paths
 */
function flattenFolders(folders: ExportFolder[], parentPath: string[]): FlattenedLink[] {
  const result: FlattenedLink[] = [];

  for (const folder of folders) {
    const currentPath = [...parentPath, folder.name];
    const pathString = currentPath.join('/');

    // Add links from this folder
    for (const link of folder.links) {
      result.push({
        ...link,
        folderPath: pathString,
      });
    }

    // Process child folders
    if (folder.children.length > 0) {
      result.push(...flattenFolders(folder.children, currentPath));
    }
  }

  return result;
}

/**
 * Escape a field for CSV format
 */
function escapeCsvField(value: string): string {
  // If the field contains comma, newline, or quote, wrap in quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    // Escape quotes by doubling them
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return value;
}
