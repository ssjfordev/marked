/**
 * Popup Script for Marked Extension
 */

import type { SaveLinkPayload, ExistingLinkInfo } from '@marked/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Folder {
  id: string;
  name: string;
}

interface State {
  url: string;
  title: string;
  existingLink: ExistingLinkInfo | null;
  folders: Folder[];
  loading: boolean;
}

const state: State = {
  url: '',
  title: '',
  existingLink: null,
  folders: [],
  loading: true,
};

document.addEventListener('DOMContentLoaded', async () => {
  await initPopup();
});

async function initPopup() {
  // Check auth status
  const authStatus = await chrome.runtime.sendMessage({ type: 'AUTH_STATUS' });

  if (!authStatus.authenticated) {
    showLoginView();
    return;
  }

  // Get current tab info
  const tabInfo = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB' });
  state.url = tabInfo.url || '';
  state.title = tabInfo.title || '';

  // Check if link already exists
  const checkResult = await chrome.runtime.sendMessage({
    type: 'CHECK_LINK',
    payload: { url: state.url },
  });

  if (checkResult.exists && checkResult.link) {
    state.existingLink = checkResult.link;
  }

  // Load folders
  const foldersResult = await chrome.runtime.sendMessage({ type: 'GET_FOLDERS' });
  if (foldersResult.success && foldersResult.folders) {
    state.folders = foldersResult.folders;
  }

  state.loading = false;
  render();
}

function showLoginView() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="login-view">
      <h1>Marked</h1>
      <p>Sign in to save and organize your bookmarks</p>
      <button id="login-btn" class="btn btn-primary">Sign in</button>
    </div>
  `;

  document.getElementById('login-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${API_BASE_URL}/login?extension=true` });
  });
}

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (state.loading) {
    app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    return;
  }

  if (state.existingLink) {
    renderEditView(app);
  } else {
    renderAddView(app);
  }
}

function renderAddView(app: HTMLElement) {
  const folderOptions = state.folders.map((f) =>
    '<option value="' + f.id + '">' + escapeHtml(f.name) + '</option>'
  ).join('');

  app.innerHTML = `
    <div class="main-view">
      <div class="view-header">
        <span class="view-badge add">New</span>
        <span class="view-title">Add Bookmark</span>
      </div>

      <div class="current-page">
        <div class="page-title">${escapeHtml(state.title || 'Untitled')}</div>
        <div class="page-url">${escapeHtml(state.url)}</div>
      </div>

      <div class="form-group">
        <label for="folder-select">Save to folder</label>
        <select id="folder-select">
          <option value="">Select folder...</option>
          ${folderOptions}
        </select>
      </div>

      <button id="save-btn" class="btn btn-primary btn-full">Save</button>

      <div class="actions">
        <a href="${API_BASE_URL}" target="_blank" class="link">Open Marked</a>
      </div>
    </div>
  `;

  document.getElementById('save-btn')?.addEventListener('click', handleSaveLink);
}

function renderEditView(app: HTMLElement) {
  const link = state.existingLink!;
  const currentFolderId = link.folderId || '';

  const folderOptions = state.folders.map((f) => {
    const selected = f.id === currentFolderId ? ' selected' : '';
    return '<option value="' + f.id + '"' + selected + '>' + escapeHtml(f.name) + '</option>';
  }).join('');

  app.innerHTML = `
    <div class="main-view">
      <div class="view-header">
        <span class="view-badge edit">Saved</span>
        <span class="view-title">Edit Bookmark</span>
      </div>

      <div class="current-page">
        <div class="page-title">${escapeHtml(state.title || 'Untitled')}</div>
        <div class="page-url">${escapeHtml(state.url)}</div>
      </div>

      <div class="form-group">
        <label for="folder-select">Folder</label>
        <select id="folder-select">
          <option value="">No folder</option>
          ${folderOptions}
        </select>
      </div>

      <div class="button-group">
        <button id="update-btn" class="btn btn-primary btn-flex">Update</button>
        <button id="delete-btn" class="btn btn-danger">Delete</button>
      </div>

      <div class="actions">
        <a href="${API_BASE_URL}/links/${link.id}" target="_blank" class="link">View in Marked</a>
      </div>
    </div>
  `;

  document.getElementById('update-btn')?.addEventListener('click', handleUpdateLink);
  document.getElementById('delete-btn')?.addEventListener('click', handleDeleteLink);
}

async function handleSaveLink() {
  const select = document.getElementById('folder-select') as HTMLSelectElement;
  const button = document.getElementById('save-btn') as HTMLButtonElement;

  if (!select.value) {
    showError('Please select a folder');
    return;
  }

  button.disabled = true;
  button.textContent = 'Saving...';

  const payload: SaveLinkPayload = {
    url: state.url,
    title: state.title,
    folderId: select.value,
  };

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SAVE_LINK',
      payload,
    });

    if (response.success) {
      button.textContent = 'Saved!';
      button.classList.add('btn-success');
      setTimeout(() => window.close(), 800);
    } else {
      showError(response.error || 'Failed to save');
      button.textContent = 'Save';
      button.disabled = false;
    }
  } catch (error) {
    showError('Failed to save');
    button.textContent = 'Save';
    button.disabled = false;
  }
}

async function handleUpdateLink() {
  const select = document.getElementById('folder-select') as HTMLSelectElement;
  const button = document.getElementById('update-btn') as HTMLButtonElement;

  button.disabled = true;
  button.textContent = 'Updating...';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_LINK',
      payload: {
        linkId: state.existingLink!.id,
        folderId: select.value || undefined,
      },
    });

    if (response.success) {
      button.textContent = 'Updated!';
      button.classList.add('btn-success');
      setTimeout(() => window.close(), 800);
    } else {
      showError(response.error || 'Failed to update');
      button.textContent = 'Update';
      button.disabled = false;
    }
  } catch (error) {
    showError('Failed to update');
    button.textContent = 'Update';
    button.disabled = false;
  }
}

async function handleDeleteLink() {
  const button = document.getElementById('delete-btn') as HTMLButtonElement;

  if (!confirm('Delete this bookmark?')) {
    return;
  }

  button.disabled = true;
  button.textContent = 'Deleting...';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'DELETE_LINK',
      payload: {
        linkId: state.existingLink!.id,
      },
    });

    if (response.success) {
      // Reset to add view
      state.existingLink = null;
      render();
    } else {
      showError(response.error || 'Failed to delete');
      button.textContent = 'Delete';
      button.disabled = false;
    }
  } catch (error) {
    showError('Failed to delete');
    button.textContent = 'Delete';
    button.disabled = false;
  }
}

function showError(message: string) {
  // Remove existing error
  const existing = document.querySelector('.error-message');
  if (existing) existing.remove();

  const error = document.createElement('div');
  error.className = 'error-message';
  error.textContent = message;

  const app = document.getElementById('app');
  app?.insertBefore(error, app.firstChild);

  setTimeout(() => error.remove(), 3000);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
