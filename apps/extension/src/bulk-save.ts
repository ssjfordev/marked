/**
 * Marked Extension - Bulk Save Page
 *
 * Opened via context menu "Save all open tabs".
 * Shows all open tabs with checkboxes, folder selector,
 * and saves selected tabs in parallel with per-tab status.
 */

import type { SaveLinkPayload } from '@marked/shared';

// --- Types ---

interface FolderNode {
  id: string;
  name: string;
  icon?: string;
  children: FolderNode[];
  depth: number;
}

interface TabItem {
  url: string;
  title: string;
  favIconUrl: string;
  checked: boolean;
  status: 'pending' | 'saving' | 'done' | 'error';
  errorMsg?: string;
}

interface State {
  phase: 'loading' | 'login' | 'ready' | 'saving' | 'complete';
  tabs: TabItem[];
  folders: FolderNode[];
  selectedFolderId: string;
  folderTreeOpen: boolean;
  errorMessage: string;
  savedCount: number;
  failedCount: number;
}

const state: State = {
  phase: 'loading',
  tabs: [],
  folders: [],
  selectedFolderId: '',
  folderTreeOpen: false,
  errorMessage: '',
  savedCount: 0,
  failedCount: 0,
};

// --- Init ---

document.addEventListener('DOMContentLoaded', async () => {
  await applyTheme();
  render();
  await init();
});

async function applyTheme() {
  const result = await chrome.storage.local.get('theme');
  if ((result.theme || 'dark') === 'light') {
    document.body.classList.add('light');
  }
}

async function init() {
  // Check auth first
  const authStatus = await chrome.runtime.sendMessage({ type: 'AUTH_STATUS' });
  if (!authStatus.authenticated) {
    state.phase = 'login';
    render();
    return;
  }

  // Load tabs and folders in parallel
  const [tabsResult, foldersResult] = await Promise.all([
    chrome.runtime.sendMessage({ type: 'GET_OPEN_TABS' }),
    chrome.runtime.sendMessage({ type: 'GET_FOLDERS' }),
  ]);

  // Process tabs
  const bulkSaveUrl = chrome.runtime.getURL('bulk-save.html');
  const openTabs: Array<{ url: string; title: string; favIconUrl: string }> = tabsResult || [];
  state.tabs = openTabs
    .filter((t) => t.url !== bulkSaveUrl)
    .map((t) => ({
      url: t.url,
      title: t.title || t.url,
      favIconUrl: t.favIconUrl || '',
      checked: true,
      status: 'pending' as const,
    }));

  // Process folders
  if (foldersResult.success && foldersResult.folders) {
    state.folders = foldersResult.folders;
  }

  state.phase = 'ready';
  render();
}

// --- Render ---

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (state.phase === 'loading') {
    app.innerHTML = `
      <div class="bulk-save">
        ${renderHeader()}
        <div class="bs-loading">
          <div class="loading-spinner"></div>
          <span class="loading-text">Loading tabs...</span>
        </div>
      </div>
    `;
    return;
  }

  if (state.phase === 'login') {
    app.innerHTML = `
      <div class="bulk-save">
        ${renderHeader()}
        <div class="bs-login">
          <p class="bs-login-text">Please sign in to Marked first.</p>
          <button id="login-btn" class="btn btn-primary">Sign in</button>
        </div>
      </div>
    `;
    document.getElementById('login-btn')?.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('') + '/../' });
      // The popup.ts handles login redirect. Just open the web app login.
      window.close();
    });
    return;
  }

  if (state.phase === 'complete') {
    app.innerHTML = `
      <div class="bulk-save">
        ${renderHeader()}
        ${renderResult()}
      </div>
    `;
    attachHeaderListeners();
    return;
  }

  app.innerHTML = `
    <div class="bulk-save">
      ${renderHeader()}
      ${state.errorMessage ? `<div class="error-message">${escapeHtml(state.errorMessage)}</div>` : ''}
      ${renderFolderSection()}
      ${renderSelectControls()}
      ${renderTabList()}
      ${renderFooter()}
    </div>
  `;

  attachEventListeners();
}

function renderHeader(): string {
  return `
    <div class="bs-header">
      <div class="bs-header-left">
        <div class="bs-logo">
          <img src="icons/icon32.png" width="28" height="28" alt="Marked" />
        </div>
        <h1 class="bs-title">Save All Open Tabs</h1>
      </div>
      <button id="close-btn" class="bs-close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Close
      </button>
    </div>
  `;
}

function renderFolderSection(): string {
  const selectedFolder = findFolderById(state.folders, state.selectedFolderId);
  const displayName = selectedFolder ? selectedFolder.name : 'Select folder...';

  return `
    <div class="bs-folder-section">
      <div class="bs-section-label">Folder</div>
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
    const icon = folder.icon || '\u{1F4C1}';

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
        <span class="folder-icon">\u{1F4C2}</span>
        <span class="folder-name">No folder</span>
        ${!state.selectedFolderId ? '<svg class="folder-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
      </div>
      ${state.folders.map((folder) => renderNode(folder)).join('')}
    </div>
  `;
}

function renderSelectControls(): string {
  const checkedCount = state.tabs.filter((t) => t.checked).length;
  const totalCount = state.tabs.length;

  return `
    <div class="bs-select-controls">
      <button id="select-all-btn" class="bs-select-btn" ${checkedCount === totalCount ? 'disabled' : ''}>Select all</button>
      <span class="bs-select-divider">/</span>
      <button id="deselect-all-btn" class="bs-select-btn" ${checkedCount === 0 ? 'disabled' : ''}>Deselect all</button>
    </div>
  `;
}

function renderTabList(): string {
  if (state.tabs.length === 0) {
    return `
      <div class="bs-loading">
        <span class="loading-text">No saveable tabs found.</span>
      </div>
    `;
  }

  const items = state.tabs
    .map((tab, idx) => {
      const domain = getDomain(tab.url);
      const favicon = tab.favIconUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      const statusClass = tab.status !== 'pending' ? tab.status : '';
      const itemClass = !tab.checked && tab.status === 'pending' ? 'excluded' : statusClass;

      let statusHtml = '';
      if (tab.status === 'saving') {
        statusHtml = '<span class="bs-tab-status saving">Saving...</span>';
      } else if (tab.status === 'done') {
        statusHtml = `<span class="bs-tab-status done">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </span>`;
      } else if (tab.status === 'error') {
        statusHtml = `<span class="bs-tab-status error" title="${escapeHtml(tab.errorMsg || 'Failed')}">Failed</span>`;
      }

      const disabled = state.phase === 'saving' ? 'disabled' : '';

      return `
        <div class="bs-tab-item ${itemClass}" data-tab-idx="${idx}">
          <input
            type="checkbox"
            class="bs-tab-checkbox"
            data-tab-idx="${idx}"
            ${tab.checked ? 'checked' : ''}
            ${disabled}
          />
          <img src="${escapeHtml(favicon)}" class="bs-tab-favicon" alt="" onerror="this.style.display='none'" />
          <div class="bs-tab-info">
            <div class="bs-tab-title" title="${escapeHtml(tab.title)}">${escapeHtml(tab.title)}</div>
            <div class="bs-tab-domain">${escapeHtml(domain)}</div>
          </div>
          ${statusHtml}
        </div>
      `;
    })
    .join('');

  return `<div class="bs-tab-list">${items}</div>`;
}

function renderFooter(): string {
  const checkedCount = state.tabs.filter((t) => t.checked).length;
  const isSaving = state.phase === 'saving';
  const disabled = isSaving || checkedCount === 0;

  return `
    <div class="bs-footer">
      <span class="bs-tab-count">${checkedCount} tab${checkedCount !== 1 ? 's' : ''} selected</span>
      <button id="save-btn" class="btn btn-primary" ${disabled ? 'disabled' : ''}>
        ${isSaving ? '<span class="btn-spinner"></span>' : ''}
        ${isSaving ? 'Saving...' : `Save ${checkedCount} tab${checkedCount !== 1 ? 's' : ''}`}
      </button>
    </div>
  `;
}

function renderResult(): string {
  const total = state.savedCount + state.failedCount;
  const allSuccess = state.failedCount === 0;
  const iconClass = allSuccess ? 'success' : 'partial';

  const iconSvg = allSuccess
    ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'
    : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

  const title = allSuccess
    ? `${state.savedCount} tab${state.savedCount !== 1 ? 's' : ''} saved!`
    : `${state.savedCount} saved, ${state.failedCount} failed`;

  return `
    <div class="bs-result">
      <div class="bs-result-icon ${iconClass}">${iconSvg}</div>
      <div class="bs-result-title">${title}</div>
      <div class="bs-result-detail">${total} tab${total !== 1 ? 's' : ''} processed</div>
      <button id="close-result-btn" class="btn btn-primary" style="margin-top: 8px;">Done</button>
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

  // Folder trigger
  document.getElementById('folder-trigger')?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.folderTreeOpen = !state.folderTreeOpen;
    toggleFolderDropdown();
  });

  attachFolderItemListeners();

  // Close folder dropdown on outside click
  document.addEventListener('click', handleOutsideClick);

  // Checkboxes
  document.querySelectorAll('.bs-tab-checkbox').forEach((el) => {
    el.addEventListener('change', (e) => {
      const idx = Number((e.target as HTMLElement).dataset.tabIdx);
      if (!isNaN(idx) && state.tabs[idx]) {
        state.tabs[idx].checked = (e.target as HTMLInputElement).checked;
        patchFooter();
        patchSelectControls();
      }
    });
  });

  // Tab item row click → toggle checkbox
  document.querySelectorAll('.bs-tab-item').forEach((el) => {
    el.addEventListener('click', (e) => {
      // Don't toggle if clicking the checkbox itself
      if ((e.target as HTMLElement).classList.contains('bs-tab-checkbox')) return;
      if (state.phase === 'saving') return;
      const idx = Number((e.currentTarget as HTMLElement).dataset.tabIdx);
      if (!isNaN(idx) && state.tabs[idx]) {
        state.tabs[idx].checked = !state.tabs[idx].checked;
        const checkbox = el.querySelector('.bs-tab-checkbox') as HTMLInputElement;
        if (checkbox) checkbox.checked = state.tabs[idx].checked;
        el.classList.toggle('excluded', !state.tabs[idx].checked);
        patchFooter();
        patchSelectControls();
      }
    });
  });

  // Select all / deselect all
  document.getElementById('select-all-btn')?.addEventListener('click', () => {
    state.tabs.forEach((t) => (t.checked = true));
    document.querySelectorAll('.bs-tab-checkbox').forEach((el) => {
      (el as HTMLInputElement).checked = true;
    });
    document.querySelectorAll('.bs-tab-item').forEach((el) => {
      el.classList.remove('excluded');
    });
    patchFooter();
    patchSelectControls();
  });

  document.getElementById('deselect-all-btn')?.addEventListener('click', () => {
    state.tabs.forEach((t) => (t.checked = false));
    document.querySelectorAll('.bs-tab-checkbox').forEach((el) => {
      (el as HTMLInputElement).checked = false;
    });
    document.querySelectorAll('.bs-tab-item').forEach((el) => {
      el.classList.add('excluded');
    });
    patchFooter();
    patchSelectControls();
  });

  // Save button
  document.getElementById('save-btn')?.addEventListener('click', handleSave);
}

function handleOutsideClick(e: MouseEvent) {
  const folderSelect = document.getElementById('folder-select');
  if (folderSelect && !folderSelect.contains(e.target as Node) && state.folderTreeOpen) {
    state.folderTreeOpen = false;
    toggleFolderDropdown();
  }
}

// --- Folder Dropdown ---

function toggleFolderDropdown() {
  const folderSelect = document.getElementById('folder-select');
  if (!folderSelect) return;

  const existing = folderSelect.querySelector('.folder-dropdown');
  const icon = folderSelect.querySelector('.folder-trigger-icon');

  if (state.folderTreeOpen) {
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
    existing?.remove();
    icon?.classList.remove('open');
  }
}

function attachFolderItemListeners() {
  document.querySelectorAll('.folder-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const folderId = (e.currentTarget as HTMLElement).dataset.folderId || '';
      state.selectedFolderId = folderId;
      state.folderTreeOpen = false;

      const triggerText = document.querySelector('.folder-trigger-text');
      if (triggerText) {
        const selectedFolder = findFolderById(state.folders, folderId);
        triggerText.textContent = selectedFolder ? selectedFolder.name : 'Select folder...';
      }

      toggleFolderDropdown();
    });
  });
}

// --- Save ---

async function handleSave() {
  const selected = state.tabs.filter((t) => t.checked);
  if (selected.length === 0) return;

  state.phase = 'saving';
  state.errorMessage = '';
  state.savedCount = 0;
  state.failedCount = 0;

  // Disable checkboxes and update button
  patchFooter();
  document.querySelectorAll('.bs-tab-checkbox').forEach((el) => {
    (el as HTMLInputElement).disabled = true;
  });

  // Save all in parallel with per-tab status updates
  await Promise.all(
    state.tabs.map(async (tab, idx) => {
      if (!tab.checked) return;

      // Update status to saving
      tab.status = 'saving';
      patchTabStatus(idx);

      try {
        const payload: SaveLinkPayload = {
          url: tab.url,
          title: tab.title,
          folderId: state.selectedFolderId || undefined,
        };

        const result = await chrome.runtime.sendMessage({
          type: 'SAVE_LINK',
          payload,
        });

        if (result.success) {
          tab.status = 'done';
          state.savedCount++;
        } else {
          tab.status = 'error';
          tab.errorMsg = result.error || 'Failed';
          state.failedCount++;
        }
      } catch (err) {
        tab.status = 'error';
        tab.errorMsg = String(err);
        state.failedCount++;
      }

      patchTabStatus(idx);
    })
  );

  // Show result
  state.phase = 'complete';
  render();
}

// --- DOM Patching ---

function patchFooter() {
  const footer = document.querySelector('.bs-footer');
  if (!footer) return;

  const temp = document.createElement('div');
  temp.innerHTML = renderFooter();
  const newFooter = temp.querySelector('.bs-footer');
  if (newFooter) {
    footer.innerHTML = newFooter.innerHTML;
  }
  document.getElementById('save-btn')?.addEventListener('click', handleSave);
}

function patchSelectControls() {
  const controls = document.querySelector('.bs-select-controls');
  if (!controls) return;

  const temp = document.createElement('div');
  temp.innerHTML = renderSelectControls();
  const newControls = temp.querySelector('.bs-select-controls');
  if (newControls) {
    controls.innerHTML = newControls.innerHTML;
  }

  document.getElementById('select-all-btn')?.addEventListener('click', () => {
    state.tabs.forEach((t) => (t.checked = true));
    document.querySelectorAll('.bs-tab-checkbox').forEach((el) => {
      (el as HTMLInputElement).checked = true;
    });
    document.querySelectorAll('.bs-tab-item').forEach((el) => {
      el.classList.remove('excluded');
    });
    patchFooter();
    patchSelectControls();
  });

  document.getElementById('deselect-all-btn')?.addEventListener('click', () => {
    state.tabs.forEach((t) => (t.checked = false));
    document.querySelectorAll('.bs-tab-checkbox').forEach((el) => {
      (el as HTMLInputElement).checked = false;
    });
    document.querySelectorAll('.bs-tab-item').forEach((el) => {
      el.classList.add('excluded');
    });
    patchFooter();
    patchSelectControls();
  });
}

function patchTabStatus(idx: number) {
  const tab = state.tabs[idx];
  if (!tab) return;

  const item = document.querySelector(`.bs-tab-item[data-tab-idx="${idx}"]`);
  if (!item) return;

  // Update status element
  let statusEl = item.querySelector('.bs-tab-status');
  if (tab.status === 'saving') {
    if (!statusEl) {
      statusEl = document.createElement('span');
      item.appendChild(statusEl);
    }
    statusEl.className = 'bs-tab-status saving';
    statusEl.textContent = 'Saving...';
  } else if (tab.status === 'done') {
    if (!statusEl) {
      statusEl = document.createElement('span');
      item.appendChild(statusEl);
    }
    statusEl.className = 'bs-tab-status done';
    statusEl.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    item.classList.add('done');
  } else if (tab.status === 'error') {
    if (!statusEl) {
      statusEl = document.createElement('span');
      item.appendChild(statusEl);
    }
    statusEl.className = 'bs-tab-status error';
    statusEl.textContent = 'Failed';
    statusEl.setAttribute('title', tab.errorMsg || 'Failed');
    item.classList.add('error');
  }
}

// --- Utilities ---

function findFolderById(folders: FolderNode[], id: string): FolderNode | null {
  for (const folder of folders) {
    if (folder.id === id) return folder;
    const found = findFolderById(folder.children, id);
    if (found) return found;
  }
  return null;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
