/**
 * Background Service Worker for Marked Extension
 * Handles:
 * - Context menu for saving links
 * - Message passing between popup and content scripts
 * - Authentication state management
 */

import type {
  ExtensionMessage,
  SaveLinkPayload,
  CreateMarkPayload,
  CheckLinkPayload,
  UpdateLinkPayload,
  DeleteLinkPayload,
  ExistingLinkInfo,
} from '@marked/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create context menus on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-link',
    title: 'Save to Marked',
    contexts: ['link', 'page'],
  });

  chrome.contextMenus.create({
    id: 'create-mark',
    title: 'Mark this',
    contexts: ['selection'],
  });

  // Enable side panel
  chrome.sidePanel.setOptions({ enabled: true });
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle_sidebar') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-link') {
    const url = info.linkUrl || info.pageUrl;
    if (url && tab?.id) {
      await saveLink({
        url,
        title: tab.title,
      });
      showNotification('Link saved to Marked');
    }
  }

  if (info.menuItemId === 'create-mark' && info.selectionText) {
    const url = info.pageUrl;
    if (url && tab?.id) {
      await createMark({
        url,
        text: info.selectionText,
      });
      showNotification('Mark created');
    }
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case 'SAVE_LINK':
      return saveLink(message.payload as SaveLinkPayload);

    case 'UPDATE_LINK':
      return updateLink(message.payload as UpdateLinkPayload);

    case 'DELETE_LINK':
      return deleteLink(message.payload as DeleteLinkPayload);

    case 'CHECK_LINK':
      return checkLink(message.payload as CheckLinkPayload);

    case 'CREATE_MARK':
      return createMark(message.payload as CreateMarkPayload);

    case 'GET_CURRENT_TAB':
      return getCurrentTab();

    case 'GET_FOLDERS':
      return getFolders();

    case 'AUTH_STATUS':
      return getAuthStatus();

    default:
      return { error: 'Unknown message type' };
  }
}

async function saveLink(payload: SaveLinkPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: payload.url,
        title: payload.title,
        folderId: payload.folderId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to save link' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function createMark(payload: CreateMarkPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    // First, find or create the canonical for this URL
    const linkResponse = await fetch(`${API_BASE_URL}/api/v1/links/by-url?url=${encodeURIComponent(payload.url)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let canonicalId: string;
    if (linkResponse.ok) {
      const data = await linkResponse.json();
      canonicalId = data.canonical_id;
    } else {
      // Create the link first
      const createResponse = await fetch(`${API_BASE_URL}/api/v1/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: payload.url }),
      });

      if (!createResponse.ok) {
        return { success: false, error: 'Failed to create link' };
      }

      const createData = await createResponse.json();
      canonicalId = createData.canonical_id;
    }

    // Create the mark
    const markResponse = await fetch(`${API_BASE_URL}/api/v1/links/${canonicalId}/marks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: payload.text,
        color: payload.color || '#FFEB3B',
        note: payload.note,
      }),
    });

    if (!markResponse.ok) {
      return { success: false, error: 'Failed to create mark' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function checkLink(payload: CheckLinkPayload): Promise<{ exists: boolean; link?: ExistingLinkInfo }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { exists: false };
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/links/by-url?url=${encodeURIComponent(payload.url)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const linkData = data.data || data;
      if (linkData) {
        return {
          exists: true,
          link: {
            id: linkData.id,
            folderId: linkData.folder_id,
            userTitle: linkData.user_title,
            userDescription: linkData.user_description,
            canonical: {
              title: linkData.canonical?.title || null,
              description: linkData.canonical?.description || null,
            },
          },
        };
      }
    }

    return { exists: false };
  } catch (error) {
    return { exists: false };
  }
}

async function updateLink(payload: UpdateLinkPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const body: Record<string, unknown> = {};
    if (payload.folderId !== undefined) body.folderId = payload.folderId;
    if (payload.userTitle !== undefined) body.userTitle = payload.userTitle;
    if (payload.userDescription !== undefined) body.userDescription = payload.userDescription;

    const response = await fetch(`${API_BASE_URL}/api/v1/links/${payload.linkId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to update link' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function deleteLink(payload: DeleteLinkPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/links/${payload.linkId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to delete link' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function getFolders(): Promise<{ success: boolean; folders?: Array<{ id: string; name: string }>; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/folders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const folders = flattenFolders(data.data || data);
      return { success: true, folders };
    }

    return { success: false, error: 'Failed to load folders' };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function flattenFolders(folders: Array<{ id: string; name: string; children?: unknown[] }>, prefix = ''): Array<{ id: string; name: string }> {
  const result: Array<{ id: string; name: string }> = [];

  for (const folder of folders) {
    const name = prefix ? `${prefix} / ${folder.name}` : folder.name;
    result.push({ id: folder.id, name });

    if (folder.children && Array.isArray(folder.children)) {
      result.push(...flattenFolders(folder.children as Array<{ id: string; name: string; children?: unknown[] }>, name));
    }
  }

  return result;
}

async function getCurrentTab(): Promise<{ url?: string; title?: string }> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return {
    url: tab?.url,
    title: tab?.title,
  };
}

async function getAuthStatus(): Promise<{ authenticated: boolean; user?: { email: string } }> {
  const token = await getAuthToken();
  if (!token) {
    return { authenticated: false };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const user = await response.json();
      return { authenticated: true, user };
    }
  } catch {
    // Token expired or invalid
  }

  return { authenticated: false };
}

async function getAuthToken(): Promise<string | null> {
  const result = await chrome.storage.local.get('authToken');
  return result.authToken || null;
}

function showNotification(message: string) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Marked',
    message,
  });
}

export {};
