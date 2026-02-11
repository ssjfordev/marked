/**
 * Marked Extension Popup
 *
 * A polished bookmark saving experience with:
 * - Instant URL display with loading state
 * - Tree-based folder selection
 * - Tag input with autocomplete
 * - Memo/notes support
 * - Editable title & description
 */

import type { SaveLinkPayload, ExistingLinkInfo } from '@marked/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/** Derive YouTube thumbnail URL from video ID in URL (immune to SPA stale meta tags) */
function getYouTubeThumbnail(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') videoId = u.searchParams.get('v');
      else {
        const m = u.pathname.match(/^\/(shorts|embed)\/([^/?]+)/);
        if (m) videoId = m[2];
      }
    } else if (u.hostname === 'youtu.be') {
      videoId = u.pathname.slice(1).split('/')[0] || null;
    }
    return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
  } catch {
    return null;
  }
}

// Folder with hierarchy support
interface FolderNode {
  id: string;
  name: string;
  icon?: string;
  children: FolderNode[];
  depth: number;
}

interface PageInfo {
  url: string;
  title: string;
  description: string;
  favicon: string;
  ogImage: string;
}

interface State {
  // Auth
  authenticated: boolean;

  // Page info
  page: PageInfo;

  // Form state
  title: string;
  description: string;
  selectedFolderId: string;
  tags: string[];
  tagInput: string;
  memo: string;

  // Existing link (if saved before)
  existingLink: ExistingLinkInfo | null;

  // Data
  folders: FolderNode[];
  allTags: string[];

  // UI state
  phase: 'init' | 'loading' | 'ready' | 'saving' | 'saved' | 'error';
  errorMessage: string;
  folderTreeOpen: boolean;
}

const state: State = {
  authenticated: false,
  page: { url: '', title: '', description: '', favicon: '', ogImage: '' },
  title: '',
  description: '',
  selectedFolderId: '',
  tags: [],
  tagInput: '',
  memo: '',
  existingLink: null,
  folders: [],
  allTags: [],
  phase: 'init',
  errorMessage: '',
  folderTreeOpen: false,
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  await applyTheme();
  await init();
});

async function applyTheme() {
  const result = await chrome.storage.local.get('theme');
  const theme = result.theme || 'dark';
  if (theme === 'light') {
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
  }
}

async function init() {
  const app = document.getElementById('app');
  if (!app) return;

  // Step 1: Get current tab info immediately (this is fast)
  const tabInfo = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB' });
  state.page.url = tabInfo.url || '';
  state.page.title = tabInfo.title || '';
  state.page.description = tabInfo.description || '';
  state.page.ogImage = tabInfo.ogImage || '';
  state.page.favicon = tabInfo.favicon || '';
  state.title = tabInfo.title || '';
  state.description = tabInfo.description || '';

  // YouTube SPA: og:image meta tag is stale after client-side navigation.
  // Derive thumbnail from video ID in URL (always correct).
  // Description is now read from actual page DOM in background.ts (not stale meta tags).
  const ytOgImage = getYouTubeThumbnail(state.page.url);
  if (ytOgImage) {
    state.page.ogImage = ytOgImage;
  }

  // Render immediately with URL visible
  state.phase = 'loading';
  render();

  // Step 2: Check auth (parallel with other requests)
  const [authStatus, foldersResult, tagsResult] = await Promise.all([
    chrome.runtime.sendMessage({ type: 'AUTH_STATUS' }),
    chrome.runtime.sendMessage({ type: 'GET_FOLDERS' }),
    chrome.runtime.sendMessage({ type: 'GET_TAGS' }),
  ]);

  if (!authStatus.authenticated) {
    state.authenticated = false;
    state.phase = 'ready';
    renderLoginView();
    return;
  }

  state.authenticated = true;

  // Process folders into tree structure
  if (foldersResult.success && foldersResult.folders) {
    state.folders = foldersResult.folders;
  }

  // Load user's existing tags for autocomplete
  if (tagsResult.success && tagsResult.tags) {
    state.allTags = tagsResult.tags;
  }

  // Step 3: Check if link exists & get page metadata
  const checkResult = await chrome.runtime.sendMessage({
    type: 'CHECK_LINK',
    payload: { url: state.page.url },
  });

  if (checkResult.exists && checkResult.link) {
    state.existingLink = checkResult.link;
    // Pre-fill from existing data
    state.title =
      checkResult.link.userTitle || checkResult.link.canonical?.title || state.page.title;
    state.description =
      checkResult.link.userDescription || checkResult.link.canonical?.description || '';
    state.selectedFolderId = checkResult.link.folderId || '';
    state.tags = checkResult.link.tags || [];
    state.memo = checkResult.link.memo || '';
  }

  state.phase = 'ready';
  render();
}

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.authenticated && state.phase !== 'loading') {
    renderLoginView();
    return;
  }

  app.innerHTML = `
    <div class="popup">
      ${renderHeader()}
      ${renderPagePreview()}
      ${state.phase === 'loading' ? renderLoadingState() : renderForm()}
      ${renderFooter()}
    </div>
  `;

  attachEventListeners();
}

function renderHeader(): string {
  const isEdit = !!state.existingLink;
  return `
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <img src="icons/icon32.png" width="20" height="20" alt="Marked" />
        </div>
        <span class="header-title">Marked</span>
        ${isEdit ? '<span class="badge badge-saved">Saved</span>' : ''}
      </div>
      <a href="${API_BASE_URL}/dashboard" target="_blank" class="header-action" title="Open Marked">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
    </header>
  `;
}

function renderPagePreview(): string {
  const favicon =
    state.page.favicon ||
    `https://www.google.com/s2/favicons?domain=${new URL(state.page.url || 'https://example.com').hostname}&sz=32`;
  const displayUrl = truncateUrl(state.page.url, 50);
  const hasOgImage = state.page.ogImage && state.page.ogImage.length > 0;

  if (hasOgImage) {
    return `
      <div class="page-card">
        <div class="page-card-image">
          <img src="${state.page.ogImage}" alt="" onerror="this.parentElement.style.display='none'">
        </div>
        <div class="page-card-content">
          <div class="page-card-site">
            <img src="${favicon}" class="page-favicon" alt="" onerror="this.style.display='none'">
            <span class="page-url">${escapeHtml(displayUrl)}</span>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="page-preview">
      <img src="${favicon}" class="page-favicon" alt="" onerror="this.style.display='none'">
      <div class="page-info">
        <div class="page-url" title="${escapeHtml(state.page.url)}">${escapeHtml(displayUrl)}</div>
      </div>
    </div>
  `;
}

function renderLoadingState(): string {
  return `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <span class="loading-text">Loading page info...</span>
    </div>
  `;
}

function renderForm(): string {
  const errorHtml =
    state.phase === 'error' && state.errorMessage
      ? `<div class="error-message">${escapeHtml(state.errorMessage)}</div>`
      : '';

  return `
    ${errorHtml}
    <div class="form">
      ${renderTitleInput()}
      ${renderDescriptionInput()}
      ${renderFolderSelect()}
      ${renderTagsInput()}
      ${renderMemoInput()}
      ${renderActions()}
    </div>
  `;
}

function renderTitleInput(): string {
  return `
    <div class="form-field">
      <label class="form-label">Title</label>
      <input
        type="text"
        id="title-input"
        class="form-input"
        value="${escapeHtml(state.title)}"
        placeholder="Enter title..."
      >
    </div>
  `;
}

function renderDescriptionInput(): string {
  return `
    <div class="form-field">
      <label class="form-label">Description</label>
      <textarea
        id="description-input"
        class="form-textarea"
        placeholder="Add a description..."
        rows="2"
      >${escapeHtml(state.description)}</textarea>
    </div>
  `;
}

function renderFolderSelect(): string {
  const selectedFolder = findFolderById(state.folders, state.selectedFolderId);
  const displayName = selectedFolder ? selectedFolder.name : 'Select folder...';

  return `
    <div class="form-field">
      <label class="form-label">Folder</label>
      <div class="folder-select" id="folder-select">
        <button class="folder-trigger" id="folder-trigger" type="button">
          <span class="folder-trigger-text">${escapeHtml(displayName)}</span>
          <svg class="folder-trigger-icon ${state.folderTreeOpen ? 'open' : ''}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        ${state.folderTreeOpen ? renderFolderTree() : ''}
      </div>
    </div>
  `;
}

function renderFolderTree(): string {
  const renderNode = (folder: FolderNode): string => {
    const isSelected = folder.id === state.selectedFolderId;
    const indent = folder.depth * 16;
    const icon = folder.icon || '📁';

    return `
      <div
        class="folder-item ${isSelected ? 'selected' : ''}"
        data-folder-id="${folder.id}"
        style="padding-left: ${12 + indent}px"
      >
        <span class="folder-icon">${icon}</span>
        <span class="folder-name">${escapeHtml(folder.name)}</span>
        ${isSelected ? '<svg class="folder-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
      </div>
      ${folder.children.map((child) => renderNode(child)).join('')}
    `;
  };

  return `
    <div class="folder-dropdown">
      <div class="folder-item ${!state.selectedFolderId ? 'selected' : ''}" data-folder-id="">
        <span class="folder-icon">📂</span>
        <span class="folder-name">No folder</span>
        ${!state.selectedFolderId ? '<svg class="folder-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
      </div>
      ${state.folders.map((folder) => renderNode(folder)).join('')}
    </div>
  `;
}

function renderTagsInput(): string {
  const tagsHtml = state.tags
    .map(
      (tag) => `
    <span class="tag">
      ${escapeHtml(tag)}
      <button class="tag-remove" data-tag="${escapeHtml(tag)}" type="button">&times;</button>
    </span>
  `
    )
    .join('');

  // Filter suggestions: match input, exclude already-added tags
  const suggestions =
    state.tagInput.length > 0
      ? state.allTags.filter(
          (t) => t.toLowerCase().includes(state.tagInput.toLowerCase()) && !state.tags.includes(t)
        )
      : [];

  const suggestionsHtml =
    suggestions.length > 0
      ? `<div class="tag-suggestions">${suggestions
          .map(
            (s) => `<div class="tag-suggestion" data-tag="${escapeHtml(s)}">${escapeHtml(s)}</div>`
          )
          .join('')}</div>`
      : '';

  return `
    <div class="form-field">
      <label class="form-label">Tags</label>
      <div class="tags-wrapper">
        <div class="tags-container">
          ${tagsHtml}
          <input
            type="text"
            id="tag-input"
            class="tag-input"
            value="${escapeHtml(state.tagInput)}"
            placeholder="${state.tags.length ? '' : 'Add tags...'}"
            autocomplete="off"
          >
        </div>
        ${suggestionsHtml}
      </div>
    </div>
  `;
}

function renderMemoInput(): string {
  return `
    <div class="form-field">
      <label class="form-label">Memo</label>
      <textarea
        id="memo-input"
        class="form-textarea"
        placeholder="Add a personal note..."
        rows="2"
      >${escapeHtml(state.memo)}</textarea>
    </div>
  `;
}

function renderActions(): string {
  const isEdit = !!state.existingLink;
  const isSaving = state.phase === 'saving';
  const isSaved = state.phase === 'saved';

  if (isSaved) {
    return `
      <div class="actions">
        <button class="btn btn-success btn-full" disabled>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Saved!
        </button>
      </div>
    `;
  }

  if (isEdit) {
    return `
      <div class="actions actions-split">
        <button id="delete-btn" class="btn btn-danger" ${isSaving ? 'disabled' : ''}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
        <button id="save-btn" class="btn btn-primary btn-flex" ${isSaving ? 'disabled' : ''}>
          ${isSaving ? '<span class="btn-spinner"></span>' : ''}
          ${isSaving ? 'Updating...' : 'Update'}
        </button>
      </div>
    `;
  }

  return `
    <div class="actions">
      <button id="save-btn" class="btn btn-primary btn-full" ${isSaving || !state.selectedFolderId ? 'disabled' : ''}>
        ${isSaving ? '<span class="btn-spinner"></span>' : ''}
        ${isSaving ? 'Saving...' : 'Save to Marked'}
      </button>
    </div>
  `;
}

function renderFooter(): string {
  return `
    <footer class="footer">
      <span class="footer-hint">⌘+Enter to save</span>
    </footer>
  `;
}

function renderLoginView() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="popup login-popup">
      <div class="login-content">
        <div class="login-logo">
          <img src="icons/icon128.png" width="48" height="48" alt="Marked" />
        </div>
        <h1 class="login-title">Marked</h1>
        <p class="login-subtitle">Smart Bookmark Manager</p>
        <button id="login-btn" class="btn btn-primary btn-full">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
        <p class="login-hint">Sign in on the web, then come back here</p>
      </div>
    </div>
  `;

  document.getElementById('login-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${API_BASE_URL}/login?extension=true` });
  });
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function attachEventListeners() {
  // Title input
  document.getElementById('title-input')?.addEventListener('input', (e) => {
    state.title = (e.target as HTMLInputElement).value;
  });

  // Description input
  document.getElementById('description-input')?.addEventListener('input', (e) => {
    state.description = (e.target as HTMLTextAreaElement).value;
  });

  // Folder trigger — toggle dropdown without full re-render
  document.getElementById('folder-trigger')?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.folderTreeOpen = !state.folderTreeOpen;
    toggleFolderDropdown();
  });

  // Folder items (if dropdown is already open on initial render)
  attachFolderItemListeners();

  // Close folder dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const folderSelect = document.getElementById('folder-select');
    if (folderSelect && !folderSelect.contains(e.target as Node) && state.folderTreeOpen) {
      state.folderTreeOpen = false;
      toggleFolderDropdown();
    }
  });

  // Tag container click to focus input
  const tagsContainer = document.querySelector('.tags-container');
  tagsContainer?.addEventListener('click', () => {
    const input = document.getElementById('tag-input') as HTMLInputElement;
    input?.focus();
  });

  // Tag input — use patching instead of full re-render
  const tagInput = document.getElementById('tag-input') as HTMLInputElement;
  tagInput?.addEventListener('keydown', handleTagKeydown);
  tagInput?.addEventListener('input', handleTagInput);

  // Tag suggestion clicks
  document.querySelectorAll('.tag-suggestion').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = (e.currentTarget as HTMLElement).dataset.tag;
      if (tag && !state.tags.includes(tag)) {
        state.tags.push(tag);
        state.tagInput = '';
        patchTagsContainer();
      }
    });
  });

  // Tag remove buttons
  document.querySelectorAll('.tag-remove').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = (e.currentTarget as HTMLElement).dataset.tag;
      state.tags = state.tags.filter((t) => t !== tag);
      patchTagsContainer();
    });
  });

  // Memo input
  document.getElementById('memo-input')?.addEventListener('input', (e) => {
    state.memo = (e.target as HTMLTextAreaElement).value;
  });

  // Save button
  document.getElementById('save-btn')?.addEventListener('click', handleSave);

  // Delete button
  document.getElementById('delete-btn')?.addEventListener('click', handleDelete);

  // Keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSave();
    }
  });
}

async function handleSave() {
  if (state.phase === 'saving') return;
  if (!state.existingLink && !state.selectedFolderId) return;

  hideErrorMessage();
  state.phase = 'saving';
  patchSaveArea();

  try {
    let response;

    if (state.existingLink) {
      // Update existing link
      response = await chrome.runtime.sendMessage({
        type: 'UPDATE_LINK',
        payload: {
          linkId: state.existingLink.id,
          folderId: state.selectedFolderId,
          userTitle: state.title,
          userDescription: state.description,
          tags: state.tags,
          memo: state.memo,
          pageTitle: state.page.title,
          pageDescription: state.page.description,
          ogImage: state.page.ogImage,
        },
      });
    } else {
      // Create new link
      response = await chrome.runtime.sendMessage({
        type: 'SAVE_LINK',
        payload: {
          url: state.page.url,
          title: state.title,
          description: state.description,
          folderId: state.selectedFolderId,
          tags: state.tags,
          memo: state.memo,
          ogImage: state.page.ogImage,
          pageTitle: state.page.title,
          pageDescription: state.page.description,
        } as SaveLinkPayload,
      });
    }

    if (response.success) {
      state.phase = 'saved';
      patchSaveArea();
      setTimeout(() => window.close(), 1200);
    } else {
      state.phase = 'error';
      state.errorMessage = response.error || 'Failed to save';
      patchSaveArea();
      showErrorMessage();
    }
  } catch {
    state.phase = 'error';
    state.errorMessage = 'Something went wrong';
    patchSaveArea();
    showErrorMessage();
  }
}

async function handleDelete() {
  if (!state.existingLink) return;
  if (!confirm('Remove this bookmark?')) return;

  hideErrorMessage();
  state.phase = 'saving';
  patchSaveArea();

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'DELETE_LINK',
      payload: { linkId: state.existingLink.id },
    });

    if (response.success) {
      state.existingLink = null;
      state.phase = 'ready';
      render();
    } else {
      state.phase = 'error';
      state.errorMessage = response.error || 'Failed to delete';
      patchSaveArea();
      showErrorMessage();
    }
  } catch {
    state.phase = 'error';
    state.errorMessage = 'Something went wrong';
    patchSaveArea();
    showErrorMessage();
  }
}

// ============================================================================
// DOM PATCHING HELPERS (avoid full re-render)
// ============================================================================

/** Toggle folder dropdown open/close without re-rendering the whole page */
function toggleFolderDropdown() {
  const folderSelect = document.getElementById('folder-select');
  if (!folderSelect) return;

  const existing = folderSelect.querySelector('.folder-dropdown');
  const icon = folderSelect.querySelector('.folder-trigger-icon');

  if (state.folderTreeOpen) {
    // Open: insert dropdown
    if (!existing) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderFolderTree();
      const dropdown = wrapper.firstElementChild;
      if (dropdown) {
        folderSelect.appendChild(dropdown);
        attachFolderItemListeners();
      }
    }
    icon?.classList.add('open');
  } else {
    // Close: remove dropdown
    existing?.remove();
    icon?.classList.remove('open');
  }
}

/** Attach click listeners to folder items currently in the DOM */
function attachFolderItemListeners() {
  document.querySelectorAll('.folder-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const folderId = (e.currentTarget as HTMLElement).dataset.folderId || '';
      state.selectedFolderId = folderId;
      state.folderTreeOpen = false;

      // Update trigger text
      const triggerText = document.querySelector('.folder-trigger-text');
      if (triggerText) {
        const selectedFolder = findFolderById(state.folders, folderId);
        triggerText.textContent = selectedFolder ? selectedFolder.name : 'Select folder...';
      }

      // Remove dropdown
      toggleFolderDropdown();

      // Enable/disable save button
      const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
      if (saveBtn && !state.existingLink) {
        saveBtn.disabled = !folderId;
      }
    });
  });
}

/** Update tags container without full re-render */
function patchTagsContainer() {
  const wrapper = document.querySelector('.tags-wrapper');
  if (!wrapper) return;

  const temp = document.createElement('div');
  temp.innerHTML = renderTagsInput();
  const newField = temp.querySelector('.tags-wrapper');
  if (newField) {
    wrapper.innerHTML = newField.innerHTML;
  }

  // Re-attach tag-specific listeners
  const tagsContainer = document.querySelector('.tags-container');
  tagsContainer?.addEventListener('click', () => {
    const input = document.getElementById('tag-input') as HTMLInputElement;
    input?.focus();
  });

  const tagInput = document.getElementById('tag-input') as HTMLInputElement;
  tagInput?.addEventListener('keydown', handleTagKeydown);
  tagInput?.addEventListener('input', handleTagInput);

  document.querySelectorAll('.tag-remove').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = (e.currentTarget as HTMLElement).dataset.tag;
      state.tags = state.tags.filter((t) => t !== tag);
      patchTagsContainer();
    });
  });

  document.querySelectorAll('.tag-suggestion').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = (e.currentTarget as HTMLElement).dataset.tag;
      if (tag && !state.tags.includes(tag)) {
        state.tags.push(tag);
        state.tagInput = '';
        patchTagsContainer();
      }
    });
  });
}

function handleTagKeydown(e: KeyboardEvent) {
  const tagInput = e.target as HTMLInputElement;
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const tag = tagInput.value.trim().replace(/,/g, '');
    if (tag && !state.tags.includes(tag)) {
      state.tags.push(tag);
      state.tagInput = '';
      patchTagsContainer();
    }
  } else if (e.key === 'Backspace' && !tagInput.value && state.tags.length) {
    state.tags.pop();
    patchTagsContainer();
  }
}

function handleTagInput(e: Event) {
  state.tagInput = (e.target as HTMLInputElement).value;
  patchTagsContainer();
  const newInput = document.getElementById('tag-input') as HTMLInputElement;
  if (newInput) {
    newInput.focus();
    newInput.setSelectionRange(newInput.value.length, newInput.value.length);
  }
}

/** Patch only the save/actions area without full re-render */
function patchSaveArea() {
  const actionsEl = document.querySelector('.actions');
  if (!actionsEl) return;

  if (state.phase === 'saved') {
    actionsEl.className = 'actions';
    actionsEl.innerHTML = `
      <div class="save-success">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <polyline class="checkmark-draw" points="6 12 10 16 18 8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Saved!
      </div>
    `;
    return;
  }

  const temp = document.createElement('div');
  temp.innerHTML = renderActions();
  const newActions = temp.querySelector('.actions');
  if (newActions) {
    actionsEl.className = newActions.className;
    actionsEl.innerHTML = newActions.innerHTML;
  }
  document.getElementById('save-btn')?.addEventListener('click', handleSave);
  document.getElementById('delete-btn')?.addEventListener('click', handleDelete);
}

/** Show error message above form without full re-render */
function showErrorMessage() {
  hideErrorMessage();
  if (!state.errorMessage) return;
  const form = document.querySelector('.form');
  if (form && form.parentElement) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = state.errorMessage;
    form.parentElement.insertBefore(errorDiv, form);
  }
}

/** Remove error message */
function hideErrorMessage() {
  document.querySelector('.error-message')?.remove();
}

// ============================================================================
// UTILITIES
// ============================================================================

function findFolderById(folders: FolderNode[], id: string): FolderNode | null {
  for (const folder of folders) {
    if (folder.id === id) return folder;
    const found = findFolderById(folder.children, id);
    if (found) return found;
  }
  return null;
}

function truncateUrl(url: string, maxLength: number): string {
  try {
    const parsed = new URL(url);
    let display = parsed.hostname + parsed.pathname;
    if (display.length > maxLength) {
      display = display.slice(0, maxLength - 3) + '...';
    }
    return display;
  } catch {
    return url.slice(0, maxLength);
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
