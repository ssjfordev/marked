/**
 * Marked Extension - Export to Chrome Bookmarks
 *
 * Opened via context menu "Export to Chrome bookmarks".
 * Scans Marked links, compares with Chrome bookmarks,
 * and exports new links to Chrome bookmark folders.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- i18n helper ---

function t(key: string, ...subs: string[]): string {
  return chrome.i18n.getMessage(key, subs) || key;
}

// --- Types ---

interface MarkedLink {
  url: string;
  title: string;
  folderPath: string[];
}

interface ChromeFolder {
  id: string;
  title: string;
  children: ChromeFolder[];
  depth: number;
}

interface State {
  phase: 'loading' | 'login' | 'scan' | 'ready' | 'exporting' | 'complete';
  markedLinks: MarkedLink[];
  newLinks: MarkedLink[];
  totalMarked: number;
  chromeFolders: ChromeFolder[];
  // Options
  locationMode: 'bookmarks-bar' | 'custom';
  selectedFolderId: string;
  structureMode: 'keep' | 'flat';
  // Backup
  backupDone: boolean;
  backupError: string;
  backupInProgress: boolean;
  // Progress
  exportedCount: number;
  failedCount: number;
  // Error
  errorMessage: string;
}

const state: State = {
  phase: 'loading',
  markedLinks: [],
  newLinks: [],
  totalMarked: 0,
  chromeFolders: [],
  locationMode: 'bookmarks-bar',
  selectedFolderId: '1', // Bookmarks Bar default
  structureMode: 'keep',
  backupDone: false,
  backupError: '',
  backupInProgress: false,
  exportedCount: 0,
  failedCount: 0,
  errorMessage: '',
};

// --- Init ---

document.addEventListener('DOMContentLoaded', async () => {
  await applyTheme();
  render();
  await init();
});

async function applyTheme() {
  const result = await chrome.storage.local.get('theme');
  // Use stored theme, fall back to OS preference
  const theme =
    result.theme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  if (theme === 'light') {
    document.body.classList.add('light');
  }
}

async function init() {
  const authStatus = await chrome.runtime.sendMessage({ type: 'AUTH_STATUS' });
  if (!authStatus.authenticated) {
    state.phase = 'login';
    render();
    return;
  }

  state.phase = 'scan';
  render();

  try {
    // Fetch Marked links and Chrome bookmarks in parallel
    const [markedResult, chromeTree] = await Promise.all([
      fetchMarkedLinks(),
      chrome.bookmarks.getTree(),
    ]);

    state.markedLinks = markedResult.links;
    state.totalMarked = markedResult.totalCount;

    // Build Chrome URL set
    const chromeUrls = new Set<string>();
    collectChromeUrls(chromeTree, chromeUrls);

    // Filter new links
    state.newLinks = state.markedLinks.filter((l) => !chromeUrls.has(l.url));

    // Build Chrome folder tree for custom location selection
    state.chromeFolders = buildChromeFolderTree(chromeTree);

    state.phase = 'ready';
  } catch (err) {
    state.errorMessage = String(err);
    state.phase = 'ready';
  }

  render();
}

async function fetchMarkedLinks(): Promise<{ links: MarkedLink[]; totalCount: number }> {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/links/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

async function getAuthToken(): Promise<string> {
  const result = await chrome.storage.local.get(['authToken']);
  if (!result.authToken) throw new Error('Not authenticated');
  return result.authToken;
}

function collectChromeUrls(nodes: chrome.bookmarks.BookmarkTreeNode[], urls: Set<string>) {
  for (const node of nodes) {
    if (node.url) urls.add(node.url);
    if (node.children) collectChromeUrls(node.children, urls);
  }
}

function buildChromeFolderTree(tree: chrome.bookmarks.BookmarkTreeNode[]): ChromeFolder[] {
  const result: ChromeFolder[] = [];

  function walk(nodes: chrome.bookmarks.BookmarkTreeNode[], depth: number) {
    for (const node of nodes) {
      if (node.children) {
        const folder: ChromeFolder = {
          id: node.id,
          title:
            node.title ||
            (node.id === '1'
              ? t('exportBookmarksBar')
              : node.id === '2'
                ? t('exportOtherBookmarks')
                : 'Folder'),
          children: [],
          depth,
        };
        result.push(folder);
        walk(node.children, depth + 1);
      }
    }
  }

  if (tree[0]?.children) {
    walk(tree[0].children, 0);
  }

  return result;
}

// --- Render ---

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (state.phase === 'loading' || state.phase === 'scan') {
    app.innerHTML = `
      <div class="export-page">
        ${renderHeader()}
        <div class="ep-loading">
          <div class="loading-spinner"></div>
          <span class="loading-text">${state.phase === 'scan' ? t('exportScanning') : t('exportLoading')}</span>
        </div>
      </div>
    `;
    return;
  }

  if (state.phase === 'login') {
    app.innerHTML = `
      <div class="export-page">
        ${renderHeader()}
        <div class="ep-login">
          <p class="ep-login-text">${t('exportSignInPrompt')}</p>
          <button id="login-btn" class="btn btn-primary">${t('exportSignIn')}</button>
        </div>
      </div>
    `;
    document.getElementById('login-btn')?.addEventListener('click', () => {
      chrome.tabs.create({ url: API_BASE_URL + '/dashboard' });
      window.close();
    });
    return;
  }

  if (state.phase === 'complete') {
    app.innerHTML = `
      <div class="export-page">
        ${renderHeader()}
        ${renderResult()}
      </div>
    `;
    attachHeaderListeners();
    return;
  }

  if (state.phase === 'exporting') {
    app.innerHTML = `
      <div class="export-page">
        ${renderHeader()}
        ${renderProgress()}
      </div>
    `;
    attachHeaderListeners();
    return;
  }

  // ready phase
  if (state.newLinks.length === 0 && !state.errorMessage) {
    app.innerHTML = `
      <div class="export-page">
        ${renderHeader()}
        ${renderScanStats()}
        <div class="ep-empty">
          <div class="ep-empty-icon">&#10003;</div>
          <div class="ep-empty-title">${t('exportAllSynced')}</div>
          <div class="ep-empty-desc">${t('exportAllSyncedDesc')}</div>
        </div>
        <div class="ep-footer">
          <span></span>
          <button id="close-done-btn" class="btn btn-primary">${t('exportDone')}</button>
        </div>
      </div>
    `;
    attachHeaderListeners();
    document.getElementById('close-done-btn')?.addEventListener('click', () => window.close());
    return;
  }

  app.innerHTML = `
    <div class="export-page">
      ${renderHeader()}
      ${state.errorMessage ? `<div class="error-message">${escapeHtml(state.errorMessage)}</div>` : ''}
      ${renderScanStats()}
      ${renderInfo()}
      ${renderOptions()}
      ${renderBackup()}
      ${renderFooter()}
    </div>
  `;

  attachEventListeners();
}

function renderHeader(): string {
  return `
    <div class="ep-header">
      <div class="ep-header-left">
        <div class="ep-logo">
          <img src="icons/icon32.png" width="28" height="28" alt="Marked" />
        </div>
        <h1 class="ep-title">${t('exportTitle')}</h1>
      </div>
      <button id="close-btn" class="ep-close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        ${t('exportClose')}
      </button>
    </div>
  `;
}

function renderScanStats(): string {
  return `
    <div class="ep-scan-stats">
      <div class="ep-stat-row">
        <span class="ep-stat-label">${t('exportTotalLinks')}</span>
        <span class="ep-stat-value">${state.totalMarked}</span>
      </div>
      <div class="ep-stat-row">
        <span class="ep-stat-label">${t('exportNewLinks')}</span>
        <span class="ep-stat-value highlight">${state.newLinks.length}</span>
      </div>
    </div>
  `;
}

function renderInfo(): string {
  const checkSvg =
    '<svg class="ep-info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  return `
    <div class="ep-info">
      <div class="ep-info-item">
        ${checkSvg}
        <span>${t('exportInfoExport')}</span>
      </div>
      <div class="ep-info-item">
        ${checkSvg}
        <span>${t('exportInfoSkip')}</span>
      </div>
      <div class="ep-info-item">
        ${checkSvg}
        <span>${t('exportInfoSafe')}</span>
      </div>
    </div>
  `;
}

function renderOptions(): string {
  return `
    <div class="ep-options">
      <div class="ep-section-label">${t('exportLocationLabel')}</div>
      <div class="ep-option-group">
        <label class="ep-option">
          <input type="radio" name="location" value="bookmarks-bar" ${state.locationMode === 'bookmarks-bar' ? 'checked' : ''} />
          <div class="ep-option-content">
            <div class="ep-option-title">${t('exportLocationBar')}</div>
            <div class="ep-option-desc">${t('exportLocationBarDesc')}</div>
          </div>
        </label>
        <label class="ep-option">
          <input type="radio" name="location" value="custom" ${state.locationMode === 'custom' ? 'checked' : ''} />
          <div class="ep-option-content">
            <div class="ep-option-title">${t('exportLocationCustom')}</div>
            <div class="ep-option-desc">${t('exportLocationCustomDesc')}</div>
          </div>
        </label>
      </div>
      ${state.locationMode === 'custom' ? renderChromeFolderTree() : ''}

      <div class="ep-section-label">${t('exportStructureLabel')}</div>
      <div class="ep-option-group">
        <label class="ep-option">
          <input type="radio" name="structure" value="keep" ${state.structureMode === 'keep' ? 'checked' : ''} />
          <div class="ep-option-content">
            <div class="ep-option-title">${t('exportStructureKeep')}</div>
            <div class="ep-option-desc">${t('exportStructureKeepDesc')}</div>
          </div>
        </label>
        <label class="ep-option">
          <input type="radio" name="structure" value="flat" ${state.structureMode === 'flat' ? 'checked' : ''} />
          <div class="ep-option-content">
            <div class="ep-option-title">${t('exportStructureFlat')}</div>
            <div class="ep-option-desc">${t('exportStructureFlatDesc')}</div>
          </div>
        </label>
      </div>
    </div>
  `;
}

function renderChromeFolderTree(): string {
  const items = state.chromeFolders
    .map((f) => {
      const indent = f.depth * 16;
      const isSelected = f.id === state.selectedFolderId;
      return `
        <div class="ep-folder-item ${isSelected ? 'selected' : ''}" data-folder-id="${f.id}" style="padding-left: ${12 + indent}px">
          <span class="ep-folder-icon">&#128193;</span>
          <span class="ep-folder-name">${escapeHtml(f.title)}</span>
          ${isSelected ? '<svg class="ep-folder-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
        </div>
      `;
    })
    .join('');

  return `<div class="ep-folder-tree">${items}</div>`;
}

function renderBackup(): string {
  let statusHtml = '';
  if (state.backupDone) {
    statusHtml = `
      <div class="ep-backup-status success">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        ${t('exportBackupDone')}
      </div>
    `;
  } else if (state.backupError) {
    statusHtml = `
      <div class="ep-backup-status error">${escapeHtml(state.backupError)}</div>
    `;
  }

  return `
    <div class="ep-backup">
      <div class="ep-backup-title">${t('exportBackupTitle')}</div>
      <div class="ep-backup-desc">${t('exportBackupDesc')}</div>
      <div class="ep-backup-actions">
        <button id="backup-btn" class="btn btn-secondary btn-sm" ${state.backupInProgress ? 'disabled' : ''}>
          ${state.backupInProgress ? '<span class="btn-spinner"></span>' : '&#128190;'}
          ${state.backupInProgress ? t('exportBackupInProgress') : t('exportBackupDownload')}
        </button>
      </div>
      ${statusHtml}
    </div>
  `;
}

function renderFooter(): string {
  const count = String(state.newLinks.length);
  return `
    <div class="ep-footer">
      <span class="ep-footer-info">${t('exportFooterInfo', count)}</span>
      <button id="export-btn" class="btn btn-primary">
        ${t('exportStartButton', count)}
      </button>
    </div>
  `;
}

function renderProgress(): string {
  const total = state.newLinks.length;
  const done = state.exportedCount + state.failedCount;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return `
    <div class="ep-progress">
      <div class="ep-progress-bar">
        <div class="ep-progress-fill" style="width: ${pct}%"></div>
      </div>
      <div class="ep-progress-text">${done} / ${total}</div>
    </div>
  `;
}

function renderResult(): string {
  const total = state.exportedCount + state.failedCount;
  const allSuccess = state.failedCount === 0;
  const iconClass = allSuccess ? 'success' : 'partial';

  const iconSvg = allSuccess
    ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'
    : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

  const title = allSuccess
    ? t('exportResultSuccess', String(state.exportedCount))
    : t('exportResultPartial', String(state.exportedCount), String(state.failedCount));

  return `
    <div class="ep-result">
      <div class="ep-result-icon ${iconClass}">${iconSvg}</div>
      <div class="ep-result-title">${title}</div>
      <div class="ep-result-detail">${t('exportResultProcessed', String(total))}</div>
      <button id="close-result-btn" class="btn btn-primary" style="margin-top: 8px;">${t('exportDone')}</button>
    </div>
  `;
}

// --- Event Listeners ---

function attachHeaderListeners() {
  document.getElementById('close-btn')?.addEventListener('click', () => window.close());
  document.getElementById('close-result-btn')?.addEventListener('click', () => window.close());
}

function attachEventListeners() {
  attachHeaderListeners();

  // Location radio
  document.querySelectorAll('input[name="location"]').forEach((el) => {
    el.addEventListener('change', (e) => {
      state.locationMode = (e.target as HTMLInputElement).value as 'bookmarks-bar' | 'custom';
      if (state.locationMode === 'custom') {
        state.selectedFolderId = '1';
      }
      render();
    });
  });

  // Structure radio
  document.querySelectorAll('input[name="structure"]').forEach((el) => {
    el.addEventListener('change', (e) => {
      state.structureMode = (e.target as HTMLInputElement).value as 'keep' | 'flat';
    });
  });

  // Chrome folder selection
  attachFolderListeners();

  // Backup button
  document.getElementById('backup-btn')?.addEventListener('click', handleBackup);

  // Export button
  document.getElementById('export-btn')?.addEventListener('click', handleExport);
}

function attachFolderListeners() {
  document.querySelectorAll('.ep-folder-item').forEach((el) => {
    el.addEventListener('click', () => {
      state.selectedFolderId = (el as HTMLElement).dataset.folderId || '1';
      const tc = document.querySelector('.ep-folder-tree');
      if (tc) {
        tc.outerHTML = renderChromeFolderTree();
        attachFolderListeners();
      }
    });
  });
}

// --- Backup ---

async function handleBackup() {
  state.backupInProgress = true;
  state.backupError = '';
  state.backupDone = false;
  patchBackup();

  try {
    const tree = await chrome.bookmarks.getTree();
    const html = generateBookmarkHTML(tree);

    // 1. Local download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    a.href = url;
    a.download = `chrome-bookmarks-backup-${dateStr}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // 2. Cloud backup (best-effort, don't block on failure)
    try {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('file', new Blob([html], { type: 'text/html' }), `backup-${dateStr}.html`);

      await fetch(`${API_BASE_URL}/api/v1/bookmarks/backup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    } catch {
      // Cloud backup failure is non-critical
    }

    state.backupDone = true;
  } catch (err) {
    state.backupError = String(err);
  } finally {
    state.backupInProgress = false;
    patchBackup();
  }
}

function generateBookmarkHTML(tree: chrome.bookmarks.BookmarkTreeNode[]): string {
  let html = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n';
  html += '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n';
  html += '<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n';
  html += renderBookmarkNodes(tree[0].children || [], 1);
  html += '</DL><p>\n';
  return html;
}

function renderBookmarkNodes(nodes: chrome.bookmarks.BookmarkTreeNode[], depth: number): string {
  const indent = '    '.repeat(depth);
  let html = '';
  for (const node of nodes) {
    if (node.children) {
      html += `${indent}<DT><H3>${escapeHtmlAttr(node.title)}</H3>\n`;
      html += `${indent}<DL><p>\n`;
      html += renderBookmarkNodes(node.children, depth + 1);
      html += `${indent}</DL><p>\n`;
    } else if (node.url) {
      html += `${indent}<DT><A HREF="${escapeHtmlAttr(node.url)}">${escapeHtmlAttr(node.title)}</A>\n`;
    }
  }
  return html;
}

function patchBackup() {
  const section = document.querySelector('.ep-backup');
  if (!section) return;
  const temp = document.createElement('div');
  temp.innerHTML = renderBackup();
  const newSection = temp.querySelector('.ep-backup');
  if (newSection) {
    section.innerHTML = newSection.innerHTML;
  }
  document.getElementById('backup-btn')?.addEventListener('click', handleBackup);
}

// --- Export ---

async function handleExport() {
  if (state.newLinks.length === 0) return;

  state.phase = 'exporting';
  state.exportedCount = 0;
  state.failedCount = 0;
  render();

  try {
    // Determine parent folder
    let parentId: string;

    if (state.locationMode === 'bookmarks-bar') {
      // Create "Marked" folder in Bookmarks Bar (id="1")
      const markedFolder = await chrome.bookmarks.create({
        parentId: '1',
        title: 'Marked',
      });
      parentId = markedFolder.id;
    } else {
      parentId = state.selectedFolderId;
    }

    // Export in chunks of 50
    const CHUNK_SIZE = 50;
    const recreateStructure = state.structureMode === 'keep';
    const folderIdMap = new Map<string, string>();

    for (let i = 0; i < state.newLinks.length; i += CHUNK_SIZE) {
      const chunk = state.newLinks.slice(i, i + CHUNK_SIZE);

      for (const link of chunk) {
        try {
          let targetFolderId = parentId;

          if (recreateStructure && link.folderPath.length > 0) {
            // Create folder hierarchy
            let currentParent = parentId;
            for (let j = 0; j < link.folderPath.length; j++) {
              const subPath = link.folderPath.slice(0, j + 1).join('/');
              if (!folderIdMap.has(subPath)) {
                const folder = await chrome.bookmarks.create({
                  parentId: currentParent,
                  title: link.folderPath[j],
                });
                folderIdMap.set(subPath, folder.id);
              }
              currentParent = folderIdMap.get(subPath)!;
            }
            targetFolderId = currentParent;
          }

          await chrome.bookmarks.create({
            parentId: targetFolderId,
            title: link.title || link.url,
            url: link.url,
          });

          state.exportedCount++;
        } catch {
          state.failedCount++;
        }
      }

      // Update progress after each chunk
      patchProgress();
    }
  } catch (err) {
    state.errorMessage = String(err);
  }

  state.phase = 'complete';
  render();
}

function patchProgress() {
  const progressEl = document.querySelector('.ep-progress');
  if (!progressEl) return;
  const temp = document.createElement('div');
  temp.innerHTML = renderProgress();
  const newProgress = temp.querySelector('.ep-progress');
  if (newProgress) {
    progressEl.innerHTML = newProgress.innerHTML;
  }
}

// --- Utilities ---

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeHtmlAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
