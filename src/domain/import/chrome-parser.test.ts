import { describe, it, expect } from 'vitest';
import { parseChromeBooksmarks, flattenFolders } from './chrome-parser';

const SAMPLE_BOOKMARKS_HTML = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1609459200" LAST_MODIFIED="1609459200">Bookmarks Bar</H3>
    <DL><p>
        <DT><A HREF="https://example.com" ADD_DATE="1609459200">Example Site</A>
        <DT><H3 ADD_DATE="1609459200">Tech</H3>
        <DL><p>
            <DT><A HREF="https://react.dev" ADD_DATE="1609459200">React</A>
            <DT><A HREF="https://nextjs.org" ADD_DATE="1609459200">Next.js</A>
            <DT><H3 ADD_DATE="1609459200">Tutorials</H3>
            <DL><p>
                <DT><A HREF="https://tutorial.example.com" ADD_DATE="1609459200">Tutorial Site</A>
            </DL><p>
        </DL><p>
        <DT><H3 ADD_DATE="1609459200">Work</H3>
        <DL><p>
            <DT><A HREF="https://work.example.com" ADD_DATE="1609459200">Work Site</A>
        </DL><p>
    </DL><p>
    <DT><H3 ADD_DATE="1609459200">Other Bookmarks</H3>
    <DL><p>
        <DT><A HREF="https://other.example.com" ADD_DATE="1609459200">Other Site</A>
    </DL><p>
</DL><p>`;

describe('parseChromeBooksmarks', () => {
  it('parses bookmarks from HTML', () => {
    const result = parseChromeBooksmarks(SAMPLE_BOOKMARKS_HTML);

    expect(result.bookmarks.length).toBe(6);
    expect(result.stats.totalBookmarks).toBe(6);
  });

  it('extracts bookmark URLs and titles', () => {
    const result = parseChromeBooksmarks(SAMPLE_BOOKMARKS_HTML);

    const exampleBookmark = result.bookmarks.find((b) => b.url === 'https://example.com');
    expect(exampleBookmark).toBeDefined();
    expect(exampleBookmark?.title).toBe('Example Site');
  });

  it('preserves folder structure in paths', () => {
    const result = parseChromeBooksmarks(SAMPLE_BOOKMARKS_HTML);

    // React is in Bookmarks Bar > Tech
    const reactBookmark = result.bookmarks.find((b) => b.url === 'https://react.dev');
    expect(reactBookmark?.folderPath).toEqual(['Bookmarks Bar', 'Tech']);

    // Tutorial is in Bookmarks Bar > Tech > Tutorials
    const tutorialBookmark = result.bookmarks.find((b) => b.url === 'https://tutorial.example.com');
    expect(tutorialBookmark?.folderPath).toEqual(['Bookmarks Bar', 'Tech', 'Tutorials']);
  });

  it('parses folder tree', () => {
    const result = parseChromeBooksmarks(SAMPLE_BOOKMARKS_HTML);

    // Should have Bookmarks Bar at root
    expect(result.folders.length).toBeGreaterThan(0);

    // Flatten and check
    const flattened = flattenFolders(result.folders);
    const folderNames = flattened.map((f) => f.name);

    expect(folderNames).toContain('Bookmarks Bar');
    expect(folderNames).toContain('Tech');
    expect(folderNames).toContain('Tutorials');
    expect(folderNames).toContain('Work');
  });

  it('skips invalid URLs', () => {
    const htmlWithInvalidUrls = `
      <DL><p>
        <DT><A HREF="https://valid.com">Valid</A>
        <DT><A HREF="javascript:void(0)">Invalid JS</A>
        <DT><A HREF="file:///local/file">Invalid File</A>
        <DT><A HREF="chrome://settings">Invalid Chrome</A>
      </DL><p>
    `;

    const result = parseChromeBooksmarks(htmlWithInvalidUrls);

    expect(result.bookmarks.length).toBe(1);
    expect(result.bookmarks[0]?.url).toBe('https://valid.com');
    expect(result.stats.skippedUrls).toBe(3);
  });

  it('decodes HTML entities in titles', () => {
    const htmlWithEntities = `
      <DL><p>
        <DT><A HREF="https://example.com">Tom &amp; Jerry&#39;s &quot;Show&quot;</A>
      </DL><p>
    `;

    const result = parseChromeBooksmarks(htmlWithEntities);

    expect(result.bookmarks[0]?.title).toBe('Tom & Jerry\'s "Show"');
  });

  it('handles empty bookmark file', () => {
    const result = parseChromeBooksmarks('');

    expect(result.bookmarks).toEqual([]);
    expect(result.folders).toEqual([]);
    expect(result.stats.totalBookmarks).toBe(0);
  });

  it('uses URL as fallback title when title is empty', () => {
    const htmlWithEmptyTitle = `
      <DL><p>
        <DT><A HREF="https://example.com"></A>
      </DL><p>
    `;

    const result = parseChromeBooksmarks(htmlWithEmptyTitle);

    expect(result.bookmarks[0]?.title).toBe('https://example.com');
  });
});

describe('flattenFolders', () => {
  it('flattens nested folder structure', () => {
    const result = parseChromeBooksmarks(SAMPLE_BOOKMARKS_HTML);
    const flattened = flattenFolders(result.folders);

    // Check parent relationships
    const techFolder = flattened.find((f) => f.name === 'Tech');
    expect(techFolder?.parentPath).toEqual(['Bookmarks Bar']);

    const tutorialsFolder = flattened.find((f) => f.name === 'Tutorials');
    expect(tutorialsFolder?.parentPath).toEqual(['Bookmarks Bar', 'Tech']);
  });
});
