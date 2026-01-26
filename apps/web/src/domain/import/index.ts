// Chrome Parser (original)
export {
  parseChromeBooksmarks,
  flattenFolders,
  type ParsedBookmark,
  type ParsedFolder,
  type ParseResult,
} from './chrome-parser';

// Format Detection
export {
  detectFormat,
  getFormatDisplayName,
  getSupportedExtensions,
  isValidImportExtension,
  type ImportFormat,
} from './detect-format';

// CSV Parser
export { parseCsvBookmarks, parseTags } from './csv-parser';

// Raindrop Parser
export { parseRaindropCsv, parseRaindropHtml } from './raindrop-parser';

// Safari Parser
export { parseSafariBookmarks } from './safari-parser';

// Firefox/Edge use Chrome parser (same Netscape format)
export { parseChromeBooksmarks as parseFirefoxBookmarks } from './chrome-parser';
export { parseChromeBooksmarks as parseEdgeBookmarks } from './chrome-parser';
