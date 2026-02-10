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
  UpdateMarkPayload,
  DeleteMarkPayload,
  GetMarksPayload,
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
    if (tab?.id) {
      // Send message to content script to show mark popup
      chrome.tabs.sendMessage(tab.id, { type: 'SHOW_MARK_POPUP' });
    }
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // Keep channel open for async response
});

// Handle external messages from web app (externally_connectable)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  // Verify sender origin
  const allowedOrigins = [
    'http://localhost',
    'https://localhost',
    'https://www.marked-app.com',
    'https://marked-app.com',
  ];

  const senderOrigin = sender.origin || '';
  const isAllowed = allowedOrigins.some((origin) => senderOrigin.startsWith(origin));

  if (!isAllowed) {
    sendResponse({ success: false, error: 'Unauthorized origin' });
    return true;
  }

  // Handle auth token from web app
  if (message.type === 'MARKED_AUTH_TOKEN') {
    const { token, refreshToken, theme } = message;
    if (token) {
      chrome.storage.local
        .set({
          authToken: token,
          refreshToken: refreshToken || null,
          theme: theme || 'dark',
        })
        .then(() => {
          sendResponse({ success: true });
        });
    } else {
      sendResponse({ success: false, error: 'No token provided' });
    }
    return true;
  }

  // Handle theme sync from web app
  if (message.type === 'MARKED_THEME') {
    const { theme } = message;
    if (theme) {
      chrome.storage.local.set({ theme }).then(() => {
        sendResponse({ success: true });
      });
    } else {
      sendResponse({ success: false, error: 'No theme provided' });
    }
    return true;
  }

  // Handle logout from web app
  if (message.type === 'MARKED_AUTH_LOGOUT') {
    chrome.storage.local.remove(['authToken', 'refreshToken']).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  // Handle extension ID request (for web app to know which extension to talk to)
  if (message.type === 'MARKED_PING') {
    sendResponse({ success: true, extensionId: chrome.runtime.id });
    return true;
  }

  sendResponse({ success: false, error: 'Unknown message type' });
  return true;
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

    case 'UPDATE_MARK':
      return updateMark(message.payload as UpdateMarkPayload);

    case 'DELETE_MARK':
      return deleteMark(message.payload as DeleteMarkPayload);

    case 'GET_MARKS':
      return getMarks(message.payload as GetMarksPayload);

    case 'GET_CURRENT_TAB':
      return getCurrentTab();

    case 'GET_FOLDERS':
      return getFolders();

    case 'GET_TAGS':
      return getTags();

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

    const body: Record<string, unknown> = {
      url: payload.url,
      folderId: payload.folderId,
    };
    if (payload.title) body.title = payload.title;
    if (payload.description) body.description = payload.description;
    if (payload.tags) body.tags = payload.tags;
    if (payload.memo) body.memo = payload.memo;

    const response = await fetch(`${API_BASE_URL}/api/v1/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
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

async function createMark(
  payload: CreateMarkPayload
): Promise<{ success: boolean; markId?: string; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    // First, find or create the canonical for this URL
    const linkResponse = await fetch(
      `${API_BASE_URL}/api/v1/links/by-url?url=${encodeURIComponent(payload.url)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    let canonicalId: string;
    if (linkResponse.ok) {
      const data = await linkResponse.json();
      const linkData = 'data' in data ? data.data : data;
      canonicalId = linkData.link_canonical_id;
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
      const created = 'data' in createData ? createData.data : createData;
      canonicalId = created.link_canonical_id;
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

    const markData = await markResponse.json();
    const mark = markData.mark || markData.data || markData;
    return { success: true, markId: mark.id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function updateMark(
  payload: UpdateMarkPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const body: Record<string, unknown> = {};
    if (payload.color !== undefined) body.color = payload.color;
    if (payload.note !== undefined) body.note = payload.note;

    const response = await fetch(`${API_BASE_URL}/api/v1/marks/${payload.markId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to update mark' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function deleteMark(
  payload: DeleteMarkPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/marks/${payload.markId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to delete mark' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function checkLink(
  payload: CheckLinkPayload
): Promise<{ exists: boolean; link?: ExistingLinkInfo }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { exists: false };
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/links/by-url?url=${encodeURIComponent(payload.url)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      // Handle both { data: {...} } and direct object responses
      const linkData = 'data' in data ? data.data : data;
      // Only return exists: true if we actually have link data with an id
      if (linkData && linkData.id) {
        return {
          exists: true,
          link: {
            id: linkData.id,
            folderId: linkData.folder_id,
            userTitle: linkData.user_title,
            userDescription: linkData.user_description,
            tags: linkData.tags || [],
            memo: linkData.memo || '',
            canonical: {
              title: linkData.canonical?.title || null,
              description: linkData.canonical?.description || null,
            },
          },
        };
      }
    }

    return { exists: false };
  } catch {
    return { exists: false };
  }
}

async function updateLink(
  payload: UpdateLinkPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const body: Record<string, unknown> = {};
    if (payload.folderId !== undefined) body.folderId = payload.folderId;
    if (payload.userTitle !== undefined) body.userTitle = payload.userTitle;
    if (payload.userDescription !== undefined) body.userDescription = payload.userDescription;
    if (payload.tags !== undefined) body.tags = payload.tags;
    if (payload.memo !== undefined) body.memo = payload.memo;

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

async function deleteLink(
  payload: DeleteLinkPayload
): Promise<{ success: boolean; error?: string }> {
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

interface FolderNode {
  id: string;
  name: string;
  icon?: string;
  children: FolderNode[];
  depth: number;
}

async function getFolders(): Promise<{ success: boolean; folders?: FolderNode[]; error?: string }> {
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
      const rawFolders = 'data' in data ? data.data : data;
      const folders = buildFolderTree(rawFolders || [], 0);
      return { success: true, folders };
    }

    return { success: false, error: 'Failed to load folders' };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function buildFolderTree(
  folders: Array<{ id: string; name: string; icon?: string; children?: unknown[] }>,
  depth: number
): FolderNode[] {
  return folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    icon: folder.icon,
    depth,
    children:
      folder.children && Array.isArray(folder.children)
        ? buildFolderTree(
            folder.children as Array<{
              id: string;
              name: string;
              icon?: string;
              children?: unknown[];
            }>,
            depth + 1
          )
        : [],
  }));
}

async function getCurrentTab(): Promise<{
  url?: string;
  title?: string;
  description?: string;
  ogImage?: string;
  favicon?: string;
}> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id || !tab.url) {
    return { url: tab?.url, title: tab?.title };
  }

  // Skip chrome:// and other restricted URLs
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return { url: tab.url, title: tab.title };
  }

  try {
    // Execute script to get page metadata
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const getMeta = (name: string): string | null => {
          const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
          return el?.getAttribute('content') || null;
        };

        return {
          description: getMeta('description') || getMeta('og:description') || '',
          ogImage: getMeta('og:image') || '',
          favicon:
            document.querySelector<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]')
              ?.href || '',
        };
      },
    });

    const metadata = results?.[0]?.result as
      | { description?: string; ogImage?: string; favicon?: string }
      | undefined;
    return {
      url: tab.url,
      title: tab.title,
      description: metadata?.description,
      ogImage: metadata?.ogImage,
      favicon: metadata?.favicon,
    };
  } catch {
    // If script injection fails, return basic info
    return { url: tab.url, title: tab.title };
  }
}

async function getMarks(
  payload: GetMarksPayload
): Promise<{
  success: boolean;
  marks?: Array<{ id: string; text: string; color: string; note: string | null }>;
  error?: string;
}> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    // First find the canonical for this URL
    const linkResponse = await fetch(
      `${API_BASE_URL}/api/v1/links/by-url?url=${encodeURIComponent(payload.url)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!linkResponse.ok) {
      return { success: true, marks: [] };
    }

    const data = await linkResponse.json();
    const linkData = 'data' in data ? data.data : data;
    if (!linkData) {
      return { success: true, marks: [] };
    }

    const canonicalId = linkData.link_canonical_id;
    if (!canonicalId) {
      return { success: true, marks: [] };
    }

    // Fetch marks for this canonical
    const marksResponse = await fetch(`${API_BASE_URL}/api/v1/links/${canonicalId}/marks`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!marksResponse.ok) {
      return { success: true, marks: [] };
    }

    const marksData = await marksResponse.json();
    const marks = marksData.marks || [];
    return {
      success: true,
      marks: marks.map((m: { id: string; text: string; color: string; note: string | null }) => ({
        id: m.id,
        text: m.text,
        color: m.color,
        note: m.note,
      })),
    };
  } catch {
    return { success: false, error: 'Failed to load marks' };
  }
}

async function getTags(): Promise<{ success: boolean; tags?: string[]; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/tags`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to load tags' };
    }

    const data = await response.json();
    const tags = 'data' in data ? data.data : data;
    return {
      success: true,
      tags: (tags || []).map((t: { name: string }) => t.name),
    };
  } catch {
    return { success: false, error: 'Failed to load tags' };
  }
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
