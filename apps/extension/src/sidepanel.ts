/**
 * Sidepanel Script for Marked Extension
 * Displays folder tree and links for navigation
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  children?: Folder[];
}

interface LinkItem {
  id: string;
  user_title: string | null;
  canonical: {
    id: string;
    original_url: string;
    domain: string;
    title: string | null;
    favicon: string | null;
  };
}

interface State {
  folders: Folder[];
  linkCounts: Record<string, number>;
  selectedFolderId: string | null;
  links: LinkItem[];
  expandedFolders: Set<string>;
  searchQuery: string;
  loading: boolean;
}

const state: State = {
  folders: [],
  linkCounts: {},
  selectedFolderId: null,
  links: [],
  expandedFolders: new Set(),
  searchQuery: '',
  loading: true,
};

document.addEventListener('DOMContentLoaded', async () => {
  await initSidepanel();
});

async function initSidepanel() {
  const authStatus = await chrome.runtime.sendMessage({ type: 'AUTH_STATUS' });

  if (!authStatus.authenticated) {
    showLoginView();
    return;
  }

  showMainView();
  await loadFolders();
  await restoreLastPosition();
}

function showLoginView() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="login-view">
      <h1>Marked</h1>
      <p>Sign in to access your bookmarks</p>
      <button class="login-btn" id="login-btn">Sign in</button>
    </div>
  `;

  document.getElementById('login-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${API_BASE_URL}/login?extension=true` });
  });
}

function showMainView() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="header">
      <div class="header-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span>Marked</span>
      </div>
      <div class="header-actions">
        <button class="header-btn" id="refresh-btn" title="Refresh">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button class="header-btn" id="open-app-btn" title="Open Marked">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      </div>
    </div>
    <div class="search-container">
      <input type="text" class="search-input" id="search-input" placeholder="Search bookmarks..." />
    </div>
    <div class="content" id="content">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  `;

  document.getElementById('refresh-btn')?.addEventListener('click', async () => {
    state.loading = true;
    renderContent();
    await loadFolders();
    if (state.selectedFolderId) {
      await loadLinks(state.selectedFolderId);
    }
  });

  document.getElementById('open-app-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: API_BASE_URL });
  });

  document.getElementById('search-input')?.addEventListener('input', (e) => {
    state.searchQuery = (e.target as HTMLInputElement).value;
    renderContent();
  });
}

async function loadFolders() {
  try {
    const token = await getAuthToken();
    if (!token) return;

    const [foldersRes, countsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/v1/folders`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_BASE_URL}/api/v1/folders/link-counts`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (foldersRes.ok) {
      const data = await foldersRes.json();
      state.folders = data.data || data;
    }

    if (countsRes.ok) {
      const data = await countsRes.json();
      state.linkCounts = data.data || data;
    }

    state.loading = false;
    renderContent();
  } catch (error) {
    console.error('Failed to load folders:', error);
    state.loading = false;
    renderContent();
  }
}

async function loadLinks(folderId: string) {
  try {
    const token = await getAuthToken();
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/api/v1/folders/${folderId}/links`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      state.links = data.data || data;
      state.selectedFolderId = folderId;
      saveLastPosition(folderId);
      renderContent();
    }
  } catch (error) {
    console.error('Failed to load links:', error);
  }
}

function renderContent() {
  const content = document.getElementById('content');
  if (!content) return;

  if (state.loading) {
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    return;
  }

  if (state.selectedFolderId && state.links.length >= 0) {
    renderLinkList(content);
  } else {
    renderFolderList(content);
  }
}

function renderFolderList(container: HTMLElement) {
  const filteredFolders = filterFolders(state.folders, state.searchQuery);

  if (filteredFolders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <p>No folders found</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '<div class="folder-list">' + renderFolderTree(filteredFolders, 0) + '</div>';

  // Add event listeners
  container.querySelectorAll('.folder-item').forEach((el) => {
    el.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.folder-expand')) return;

      const folderId = (el as HTMLElement).dataset.folderId;
      if (folderId) {
        loadLinks(folderId);
      }
    });
  });

  container.querySelectorAll('.folder-expand').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const folderId = (el as HTMLElement).dataset.folderId;
      if (folderId) {
        if (state.expandedFolders.has(folderId)) {
          state.expandedFolders.delete(folderId);
        } else {
          state.expandedFolders.add(folderId);
        }
        renderContent();
      }
    });
  });
}

function renderFolderTree(folders: Folder[], depth: number): string {
  return folders.map((folder) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = state.expandedFolders.has(folder.id);
    const count = state.linkCounts[folder.id] || 0;
    const paddingLeft = 12 + depth * 16;

    let html = '<div class="folder-item" data-folder-id="' + folder.id + '" style="padding-left: ' + paddingLeft + 'px">';

    if (hasChildren) {
      html += '<button class="folder-expand ' + (isExpanded ? 'expanded' : '') + '" data-folder-id="' + folder.id + '">';
      html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
      html += '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg></button>';
    } else {
      html += '<span style="width: 20px"></span>';
    }

    html += '<svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
    html += '<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>';
    html += '<span class="folder-name">' + escapeHtml(folder.name) + '</span>';

    if (count > 0) {
      html += '<span class="folder-count">' + count + '</span>';
    }

    html += '</div>';

    if (hasChildren && isExpanded) {
      html += '<div class="folder-children">' + renderFolderTree(folder.children!, depth + 1) + '</div>';
    }

    return html;
  }).join('');
}

function renderLinkList(container: HTMLElement) {
  const folder = findFolder(state.folders, state.selectedFolderId!);
  const folderName = folder?.name || 'Links';

  const filteredLinks = state.searchQuery
    ? state.links.filter((link) => {
        const title = link.user_title || link.canonical.title || '';
        const url = link.canonical.original_url;
        const query = state.searchQuery.toLowerCase();
        return title.toLowerCase().includes(query) || url.toLowerCase().includes(query);
      })
    : state.links;

  let html = '<div class="link-list-container">';
  html += '<div class="link-list-header">';
  html += '<button class="link-list-back" id="back-btn">';
  html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
  html += '<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>Back</button>';
  html += '<span class="link-list-title">' + escapeHtml(folderName) + '</span></div>';
  html += '<div class="link-list">';

  if (filteredLinks.length === 0) {
    html += '<div class="empty-state">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">';
    html += '<path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>';
    html += '<p>No links in this folder</p></div>';
  } else {
    filteredLinks.forEach((link) => {
      html += '<a href="' + escapeHtml(link.canonical.original_url) + '" class="link-item" target="_blank" rel="noopener">';
      if (link.canonical.favicon) {
        html += '<img src="' + escapeHtml(link.canonical.favicon) + '" class="link-favicon" alt="" />';
      } else {
        html += '<div class="link-favicon-placeholder"></div>';
      }
      html += '<div class="link-info">';
      html += '<div class="link-title">' + escapeHtml(link.user_title || link.canonical.title || link.canonical.original_url) + '</div>';
      html += '<div class="link-url">' + escapeHtml(link.canonical.domain) + '</div>';
      html += '</div></a>';
    });
  }

  html += '</div></div>';
  container.innerHTML = html;

  document.getElementById('back-btn')?.addEventListener('click', () => {
    state.selectedFolderId = null;
    state.links = [];
    renderContent();
  });
}

function filterFolders(folders: Folder[], query: string): Folder[] {
  if (!query) return folders;

  const lowerQuery = query.toLowerCase();

  return folders.reduce((acc: Folder[], folder) => {
    const nameMatches = folder.name.toLowerCase().includes(lowerQuery);
    const filteredChildren = folder.children ? filterFolders(folder.children, query) : [];

    if (nameMatches || filteredChildren.length > 0) {
      acc.push({
        ...folder,
        children: filteredChildren.length > 0 ? filteredChildren : folder.children,
      });
    }

    return acc;
  }, []);
}

function findFolder(folders: Folder[], id: string): Folder | null {
  for (const folder of folders) {
    if (folder.id === id) return folder;
    if (folder.children) {
      const found = findFolder(folder.children, id);
      if (found) return found;
    }
  }
  return null;
}

async function saveLastPosition(folderId: string) {
  await chrome.storage.local.set({ lastFolderId: folderId });
}

async function restoreLastPosition() {
  const result = await chrome.storage.local.get('lastFolderId');
  if (result.lastFolderId) {
    // Expand parent folders
    expandParentFolders(state.folders, result.lastFolderId);
    await loadLinks(result.lastFolderId);
  }
}

function expandParentFolders(folders: Folder[], targetId: string, path: string[] = []): boolean {
  for (const folder of folders) {
    if (folder.id === targetId) {
      path.forEach((id) => state.expandedFolders.add(id));
      return true;
    }
    if (folder.children) {
      if (expandParentFolders(folder.children, targetId, [...path, folder.id])) {
        return true;
      }
    }
  }
  return false;
}

async function getAuthToken(): Promise<string | null> {
  const result = await chrome.storage.local.get('authToken');
  return result.authToken || null;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export {};
