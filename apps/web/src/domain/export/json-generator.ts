/**
 * JSON Export Generator
 *
 * Generates structured JSON export with full metadata.
 */

import type { ExportData } from './html-generator';

/**
 * Generate JSON export
 */
export function generateJsonExport(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}
