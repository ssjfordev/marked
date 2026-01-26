/**
 * Import Format Detection
 *
 * Automatically detects the format of imported bookmark files
 * based on file extension and content analysis.
 */

export type ImportFormat =
  | 'chrome'
  | 'firefox'
  | 'safari'
  | 'edge'
  | 'raindrop-html'
  | 'raindrop-csv'
  | 'csv';

interface DetectionResult {
  format: ImportFormat;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Detect the import format from file content and filename
 */
export function detectFormat(content: string, filename: string): DetectionResult {
  const ext = filename.toLowerCase().split('.').pop() || '';

  // CSV files
  if (ext === 'csv') {
    return detectCsvFormat(content);
  }

  // HTML files
  if (ext === 'html' || ext === 'htm') {
    return detectHtmlFormat(content);
  }

  // Fallback: try to detect from content
  if (content.trim().startsWith('<!DOCTYPE NETSCAPE-Bookmark-file-1>') ||
      content.includes('<DL>') ||
      content.includes('<DT>')) {
    return detectHtmlFormat(content);
  }

  // Check if it looks like CSV
  const firstLine = content.split('\n')[0] || '';
  if (firstLine.includes(',') && (firstLine.toLowerCase().includes('url') || firstLine.toLowerCase().includes('title'))) {
    return detectCsvFormat(content);
  }

  // Default to Chrome HTML parser
  return { format: 'chrome', confidence: 'low' };
}

/**
 * Detect CSV format (Raindrop vs Generic)
 */
function detectCsvFormat(content: string): DetectionResult {
  const lines = content.split('\n');
  const header = lines[0]?.toLowerCase() || '';

  // Raindrop CSV has specific columns: url, folder, title, note, tags, created
  // Also sometimes: "id,title,note,excerpt,url,folder,tags,created,cover,highlights,favorite"
  if (
    header.includes('folder') &&
    (header.includes('note') || header.includes('excerpt')) &&
    header.includes('created')
  ) {
    return { format: 'raindrop-csv', confidence: 'high' };
  }

  // Generic CSV with our format: url,title,description,folder,tags
  return { format: 'csv', confidence: 'high' };
}

/**
 * Detect HTML bookmark format (Chrome/Firefox/Safari/Edge/Raindrop)
 */
function detectHtmlFormat(content: string): DetectionResult {
  const lowerContent = content.toLowerCase();
  const first2000 = content.substring(0, 2000).toLowerCase();

  // Check for Netscape Bookmark format
  if (!lowerContent.includes('<!doctype netscape-bookmark-file-1>') &&
      !lowerContent.includes('<dl>')) {
    // Not a standard bookmark file, try Chrome anyway
    return { format: 'chrome', confidence: 'low' };
  }

  // Raindrop exports have specific patterns
  if (lowerContent.includes('raindrop') ||
      lowerContent.includes('<!-- raindrop.io -->')) {
    return { format: 'raindrop-html', confidence: 'high' };
  }

  // Safari exports have specific markers
  // Safari uses "<!DOCTYPE NETSCAPE-Bookmark-file-1>" but often doesn't include ADD_DATE
  // and may include Safari-specific folder names
  if (
    first2000.includes('safari') ||
    lowerContent.includes('reading list') ||
    lowerContent.includes('즐겨찾기') // Korean Safari
  ) {
    return { format: 'safari', confidence: 'high' };
  }

  // Edge uses similar format to Chrome but may have Edge-specific folders
  if (
    first2000.includes('edge') ||
    lowerContent.includes('favorites bar') ||
    lowerContent.includes('other favorites')
  ) {
    return { format: 'edge', confidence: 'high' };
  }

  // Firefox detection - look for Firefox-specific folder names or patterns
  // Firefox uses similar format to Chrome, often with "Bookmarks Menu" or "Bookmarks Toolbar"
  if (
    first2000.includes('firefox') ||
    lowerContent.includes('bookmarks menu') ||
    lowerContent.includes('bookmarks toolbar') ||
    lowerContent.includes('unfiled bookmarks') ||
    lowerContent.includes('북마크 메뉴') || // Korean Firefox
    lowerContent.includes('북마크 도구모음')
  ) {
    return { format: 'firefox', confidence: 'high' };
  }

  // Chrome detection - look for Chrome-specific patterns
  if (
    first2000.includes('chrome') ||
    lowerContent.includes('bookmarks bar') ||
    lowerContent.includes('other bookmarks') ||
    lowerContent.includes('mobile bookmarks') ||
    lowerContent.includes('북마크 바') || // Korean Chrome
    lowerContent.includes('기타 북마크') ||
    lowerContent.includes('모바일 북마크')
  ) {
    return { format: 'chrome', confidence: 'high' };
  }

  // Default to Chrome format (most common)
  return { format: 'chrome', confidence: 'medium' };
}

/**
 * Get human-readable format name
 */
export function getFormatDisplayName(format: ImportFormat): string {
  const names: Record<ImportFormat, string> = {
    chrome: 'Chrome',
    firefox: 'Firefox',
    safari: 'Safari',
    edge: 'Microsoft Edge',
    'raindrop-html': 'Raindrop (HTML)',
    'raindrop-csv': 'Raindrop (CSV)',
    csv: 'CSV',
  };
  return names[format];
}

/**
 * Get file extensions supported by a format
 */
export function getSupportedExtensions(format: ImportFormat): string[] {
  if (format === 'csv' || format === 'raindrop-csv') {
    return ['.csv'];
  }
  return ['.html', '.htm'];
}

/**
 * Check if a file extension is valid for import
 */
export function isValidImportExtension(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return ext === 'html' || ext === 'htm' || ext === 'csv';
}
