/**
 * Content Script for Marked Extension
 * Handles:
 * - Text selection for creating marks (highlights)
 * - Highlighting existing marks on the page
 * - Mark editing and deletion
 */

import type { CreateMarkPayload } from '@marked/shared';

// ============================================================================
// TYPES
// ============================================================================

interface MarkColor {
  id: string;
  name: string;
  bg: string;
  border: string;
}

interface PageMark {
  id: string;
  text: string;
  color: string;
  note?: string;
  canonicalId: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MARK_COLORS: MarkColor[] = [
  { id: 'yellow', name: 'Yellow', bg: '#FEF08A', border: '#FDE047' },
  { id: 'green', name: 'Green', bg: '#BBF7D0', border: '#86EFAC' },
  { id: 'blue', name: 'Blue', bg: '#BFDBFE', border: '#93C5FD' },
  { id: 'pink', name: 'Pink', bg: '#FECACA', border: '#FCA5A5' },
  { id: 'gray', name: 'Gray', bg: '#E5E7EB', border: '#D1D5DB' },
];

// ============================================================================
// STATE
// ============================================================================

let markPopup: HTMLElement | null = null;
let editPopup: HTMLElement | null = null;
let selectedText = '';
let selectedRange: Range | null = null;
let currentColor = 'yellow';
let currentMemo = '';
// Marks are loaded dynamically via loadPageMarks()

// ============================================================================
// INITIALIZATION
// ============================================================================

// Inject styles
injectStyles();

// Load existing marks for this page
loadPageMarks();

// Listen for clicks outside popups to close them
document.addEventListener('mousedown', handleMouseDown);

// Listen for auth token messages from web app
window.addEventListener('message', handleWindowMessage);

// Check DOM for auth token (handles timing race with postMessage)
checkDomForAuthToken();

// Listen for messages from background script (context menu)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SHOW_MARK_POPUP') {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0 && selection?.rangeCount) {
      selectedText = text;
      selectedRange = selection.getRangeAt(0).cloneRange();

      // Get position from selection
      const rect = selectedRange.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.bottom;

      showMarkPopup(x, y);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'No text selected' });
    }
  }
  return true;
});

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function handleMouseDown(e: MouseEvent) {
  // Close mark popup if clicking outside
  if (markPopup && !markPopup.contains(e.target as Node)) {
    hideMarkPopup();
  }

  // Close edit popup if clicking outside
  if (editPopup && !editPopup.contains(e.target as Node)) {
    hideEditPopup();
  }
}

async function handleWindowMessage(event: MessageEvent) {
  if (event.source !== window) return;

  // Handle auth token
  if (event.data?.type === 'MARKED_AUTH_TOKEN') {
    const { token, refreshToken, theme } = event.data;
    if (token) {
      await saveAuthToken(token, refreshToken, theme);
    }
  }

  // Handle logout
  if (event.data?.type === 'MARKED_AUTH_LOGOUT') {
    await chrome.storage.local.remove(['authToken', 'refreshToken']);
    showToast('Signed out from Marked');
  }
}

async function saveAuthToken(token: string, refreshToken?: string, theme?: string) {
  await chrome.storage.local.set({
    authToken: token,
    refreshToken: refreshToken || null,
    theme: theme || 'dark',
  });
  showToast('Signed in to Marked!');

  // Auto-close the tab if this is an auth callback/transfer page
  const path = window.location.pathname;
  if (
    path.includes('/auth/extension-callback') ||
    path.includes('/auth/extension-token-transfer')
  ) {
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: 'CLOSE_MY_TAB' });
    }, 1500);
  }
}

/**
 * Check DOM for auth token element (handles race condition where
 * postMessage fires before content script is ready).
 */
function checkDomForAuthToken() {
  const path = window.location.pathname;
  if (
    !path.includes('/auth/extension-callback') &&
    !path.includes('/auth/extension-token-transfer')
  ) {
    return;
  }

  const el = document.getElementById('marked-extension-token');
  if (el) {
    const token = el.dataset.token;
    const refreshToken = el.dataset.refreshToken;
    if (token) {
      saveAuthToken(token, refreshToken || undefined);
      return;
    }
  }

  // Retry with MutationObserver if element not found yet
  const observer = new MutationObserver(() => {
    const tokenEl = document.getElementById('marked-extension-token');
    if (tokenEl?.dataset.token) {
      observer.disconnect();
      saveAuthToken(tokenEl.dataset.token, tokenEl.dataset.refreshToken || undefined);
    }
  });
  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  // Stop observing after 10 seconds
  setTimeout(() => observer.disconnect(), 10000);
}

// ============================================================================
// MARK POPUP (Create new mark)
// ============================================================================

function showMarkPopup(x: number, y: number) {
  hideMarkPopup();
  hideEditPopup();

  currentColor = 'yellow';
  currentMemo = '';

  markPopup = document.createElement('div');
  markPopup.className = 'marked-popup marked-popup-create';
  // Prevent popup clicks from clearing the text selection (except for textarea)
  markPopup.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT') {
      e.preventDefault();
    }
  });
  markPopup.innerHTML = `
    <div class="marked-popup-inner">
      <div class="marked-popup-colors">
        ${MARK_COLORS.map(
          (color) => `
          <button
            class="marked-color-btn ${color.id === currentColor ? 'active' : ''}"
            data-color="${color.id}"
            style="--color-bg: ${color.bg}; --color-border: ${color.border}"
            title="${color.name}"
          >
            <span class="marked-color-check">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
          </button>
        `
        ).join('')}
      </div>
      <div class="marked-popup-memo">
        <textarea
          class="marked-memo-input"
          placeholder="Add a note..."
          rows="2"
        ></textarea>
      </div>
      <div class="marked-popup-actions">
        <button class="marked-btn-cancel">Cancel</button>
        <button class="marked-btn-save">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          Mark
        </button>
      </div>
    </div>
  `;

  // Position popup
  const popupWidth = 260;
  const popupHeight = 160;
  let posX = x - popupWidth / 2;
  let posY = y + 10;

  // Keep within viewport
  if (posX < 10) posX = 10;
  if (posX + popupWidth > window.innerWidth - 10) posX = window.innerWidth - popupWidth - 10;
  if (posY + popupHeight > window.innerHeight - 10) posY = y - popupHeight - 10;

  markPopup.style.left = `${posX}px`;
  markPopup.style.top = `${posY}px`;

  document.body.appendChild(markPopup);

  // Attach event listeners
  attachMarkPopupListeners();
}

function attachMarkPopupListeners() {
  if (!markPopup) return;

  // Color selection
  markPopup.querySelectorAll('.marked-color-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const color = (btn as HTMLElement).dataset.color || 'yellow';
      currentColor = color;
      updateColorSelection();
    });
  });

  // Memo input
  const memoInput = markPopup.querySelector('.marked-memo-input') as HTMLTextAreaElement;
  memoInput?.addEventListener('input', (e) => {
    currentMemo = (e.target as HTMLTextAreaElement).value;
  });

  // Cancel button
  markPopup.querySelector('.marked-btn-cancel')?.addEventListener('click', (e) => {
    e.stopPropagation();
    hideMarkPopup();
  });

  // Save button
  markPopup.querySelector('.marked-btn-save')?.addEventListener('click', (e) => {
    e.stopPropagation();
    saveMark();
  });

  // Keyboard shortcuts
  markPopup.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideMarkPopup();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      saveMark();
    }
  });

  // Focus memo input
  setTimeout(() => memoInput?.focus(), 100);
}

function updateColorSelection() {
  if (!markPopup) return;
  markPopup.querySelectorAll('.marked-color-btn').forEach((btn) => {
    const color = (btn as HTMLElement).dataset.color;
    btn.classList.toggle('active', color === currentColor);
  });
}

function hideMarkPopup() {
  if (markPopup) {
    markPopup.remove();
    markPopup = null;
  }
  selectedText = '';
  selectedRange = null;
}

async function saveMark() {
  if (!selectedText || !selectedRange) {
    hideMarkPopup();
    return;
  }

  const colorObj = MARK_COLORS.find((c) => c.id === currentColor) || MARK_COLORS[0];

  const payload: CreateMarkPayload = {
    url: window.location.href,
    text: selectedText,
    color: colorObj.bg,
    note: currentMemo || undefined,
  };

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CREATE_MARK',
      payload,
    });

    if (response.success) {
      // Apply highlight to page
      applyHighlight(selectedRange, colorObj, response.markId);
      showToast('Marked!');
    } else {
      showToast(response.error || 'Failed to create mark');
    }
  } catch {
    showToast('Failed to create mark');
  }

  hideMarkPopup();
}

// ============================================================================
// EDIT POPUP (Edit/Delete existing mark)
// ============================================================================

function showEditPopup(element: HTMLElement, mark: PageMark) {
  hideMarkPopup();
  hideEditPopup();

  const colorObj = MARK_COLORS.find((c) => c.bg === mark.color) || MARK_COLORS[0];
  currentColor = colorObj.id;
  currentMemo = mark.note || '';

  editPopup = document.createElement('div');
  editPopup.className = 'marked-popup marked-popup-edit';
  editPopup.innerHTML = `
    <div class="marked-popup-inner">
      <div class="marked-popup-header">
        <span class="marked-popup-title">Edit Mark</span>
        <button class="marked-btn-delete" title="Delete mark">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
      <div class="marked-popup-colors">
        ${MARK_COLORS.map(
          (color) => `
          <button
            class="marked-color-btn ${color.id === currentColor ? 'active' : ''}"
            data-color="${color.id}"
            style="--color-bg: ${color.bg}; --color-border: ${color.border}"
            title="${color.name}"
          >
            <span class="marked-color-check">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
          </button>
        `
        ).join('')}
      </div>
      <div class="marked-popup-memo">
        <textarea
          class="marked-memo-input"
          placeholder="Add a note..."
          rows="2"
        >${currentMemo}</textarea>
      </div>
      <div class="marked-popup-actions">
        <button class="marked-btn-cancel">Cancel</button>
        <button class="marked-btn-save">Update</button>
      </div>
    </div>
  `;

  // Position near the element
  const rect = element.getBoundingClientRect();
  const popupWidth = 260;
  const popupHeight = 200;
  let posX = rect.left + rect.width / 2 - popupWidth / 2;
  let posY = rect.bottom + 8;

  // Keep within viewport
  if (posX < 10) posX = 10;
  if (posX + popupWidth > window.innerWidth - 10) posX = window.innerWidth - popupWidth - 10;
  if (posY + popupHeight > window.innerHeight - 10) posY = rect.top - popupHeight - 8;

  editPopup.style.left = `${posX}px`;
  editPopup.style.top = `${posY}px`;

  document.body.appendChild(editPopup);

  // Attach event listeners
  attachEditPopupListeners(element, mark);
}

function attachEditPopupListeners(element: HTMLElement, mark: PageMark) {
  if (!editPopup) return;

  // Color selection
  editPopup.querySelectorAll('.marked-color-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const color = (btn as HTMLElement).dataset.color || 'yellow';
      currentColor = color;
      updateEditColorSelection();
    });
  });

  // Memo input
  const memoInput = editPopup.querySelector('.marked-memo-input') as HTMLTextAreaElement;
  memoInput?.addEventListener('input', (e) => {
    currentMemo = (e.target as HTMLTextAreaElement).value;
  });

  // Delete button
  editPopup.querySelector('.marked-btn-delete')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (confirm('Delete this mark?')) {
      await deleteMark(element, mark);
    }
  });

  // Cancel button
  editPopup.querySelector('.marked-btn-cancel')?.addEventListener('click', (e) => {
    e.stopPropagation();
    hideEditPopup();
  });

  // Save button
  editPopup.querySelector('.marked-btn-save')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    await updateMark(element, mark);
  });

  // Keyboard shortcuts
  editPopup.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideEditPopup();
    }
  });
}

function updateEditColorSelection() {
  if (!editPopup) return;
  editPopup.querySelectorAll('.marked-color-btn').forEach((btn) => {
    const color = (btn as HTMLElement).dataset.color;
    btn.classList.toggle('active', color === currentColor);
  });
}

function hideEditPopup() {
  if (editPopup) {
    editPopup.remove();
    editPopup = null;
  }
}

async function updateMark(element: HTMLElement, mark: PageMark) {
  const colorObj = MARK_COLORS.find((c) => c.id === currentColor) || MARK_COLORS[0];

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_MARK',
      payload: {
        markId: mark.id,
        color: colorObj.bg,
        note: currentMemo || undefined,
      },
    });

    if (response.success) {
      // Update highlight appearance
      element.style.backgroundColor = colorObj.bg;
      element.dataset.markColor = colorObj.bg;
      element.dataset.markNote = currentMemo;
      showToast('Mark updated');
    } else {
      showToast(response.error || 'Failed to update mark');
    }
  } catch {
    showToast('Failed to update mark');
  }

  hideEditPopup();
}

async function deleteMark(element: HTMLElement, mark: PageMark) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'DELETE_MARK',
      payload: { markId: mark.id },
    });

    if (response.success) {
      // Remove highlight from page
      removeHighlight(element);
      showToast('Mark deleted');
    } else {
      showToast(response.error || 'Failed to delete mark');
    }
  } catch {
    showToast('Failed to delete mark');
  }

  hideEditPopup();
}

// ============================================================================
// HIGHLIGHT RENDERING
// ============================================================================

function applyHighlight(range: Range, color: MarkColor, markId?: string) {
  try {
    // Check if range is still valid
    if (!range || range.collapsed) {
      console.warn('Range is collapsed or invalid');
      return;
    }

    const highlight = document.createElement('mark');
    highlight.className = 'marked-highlight';
    highlight.style.backgroundColor = color.bg;
    highlight.dataset.markId = markId || '';
    highlight.dataset.markColor = color.bg;
    highlight.dataset.markNote = currentMemo;

    // Try surroundContents first (works for simple selections)
    try {
      range.surroundContents(highlight);
    } catch {
      // Fallback: extract and insert (works for cross-element selections)
      const contents = range.extractContents();
      highlight.appendChild(contents);
      range.insertNode(highlight);
    }

    // Add click listener for editing
    highlight.addEventListener('click', (e) => {
      e.stopPropagation();
      const mark: PageMark = {
        id: highlight.dataset.markId || '',
        text: highlight.textContent || '',
        color: highlight.dataset.markColor || color.bg,
        note: highlight.dataset.markNote,
        canonicalId: '',
      };
      showEditPopup(highlight, mark);
    });
  } catch (error) {
    console.error('Failed to apply highlight:', error);
  }
}

function removeHighlight(element: HTMLElement) {
  const parent = element.parentNode;
  if (parent) {
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
  }
}

async function loadPageMarks() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_MARKS',
      payload: { url: window.location.href },
    });

    if (!response.success || !response.marks || response.marks.length === 0) {
      return;
    }

    // Wait for page to be mostly loaded
    if (document.readyState !== 'complete') {
      await new Promise<void>((resolve) => {
        window.addEventListener('load', () => resolve(), { once: true });
      });
    }

    for (const mark of response.marks) {
      const range = findTextInPage(mark.text);
      if (range) {
        const colorObj = MARK_COLORS.find((c) => c.bg === mark.color) || MARK_COLORS[0];
        const highlight = document.createElement('mark');
        highlight.className = 'marked-highlight';
        highlight.style.backgroundColor = mark.color || colorObj.bg;
        highlight.dataset.markId = mark.id;
        highlight.dataset.markColor = mark.color || colorObj.bg;
        highlight.dataset.markNote = mark.note || '';

        try {
          range.surroundContents(highlight);
        } catch {
          const contents = range.extractContents();
          highlight.appendChild(contents);
          range.insertNode(highlight);
        }

        highlight.addEventListener('click', (e) => {
          e.stopPropagation();
          showEditPopup(highlight, {
            id: mark.id,
            text: mark.text,
            color: mark.color,
            note: mark.note || undefined,
            canonicalId: '',
          });
        });
      }
    }
  } catch {
    // Silently fail - marks loading is non-critical
  }
}

/**
 * Find text in the page DOM using TreeWalker.
 * Returns a Range if found, null otherwise.
 */
function findTextInPage(searchText: string): Range | null {
  const body = document.body;
  if (!body) return null;

  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
        return NodeFilter.FILTER_REJECT;
      }
      // Skip already-highlighted marks
      if (parent.classList.contains('marked-highlight')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  // Try exact match in a single text node first
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const text = node.textContent || '';
    const idx = text.indexOf(searchText);
    if (idx !== -1) {
      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + searchText.length);
      return range;
    }
  }

  // Fallback: try matching across adjacent text nodes
  walker.currentNode = body;
  const textNodes: Text[] = [];
  while ((node = walker.nextNode() as Text | null)) {
    textNodes.push(node);
  }

  // Build concatenated text with node boundaries
  let concat = '';
  const nodeOffsets: Array<{ node: Text; start: number; end: number }> = [];
  for (const tn of textNodes) {
    const text = tn.textContent || '';
    nodeOffsets.push({ node: tn, start: concat.length, end: concat.length + text.length });
    concat += text;
  }

  const idx = concat.indexOf(searchText);
  if (idx === -1) return null;

  const endIdx = idx + searchText.length;

  // Find start and end nodes
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;

  for (const entry of nodeOffsets) {
    if (!startNode && entry.end > idx) {
      startNode = entry.node;
      startOffset = idx - entry.start;
    }
    if (entry.end >= endIdx) {
      endNode = entry.node;
      endOffset = endIdx - entry.start;
      break;
    }
  }

  if (!startNode || !endNode) return null;

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

function showToast(message: string) {
  const existing = document.querySelector('.marked-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'marked-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('marked-toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ============================================================================
// STYLES
// ============================================================================

function injectStyles() {
  const style = document.createElement('style');
  style.id = 'marked-extension-styles';
  style.textContent = `
    /* =========================================================================
       MARKED EXTENSION STYLES
       ========================================================================= */

    .marked-popup *,
    .marked-popup *::before,
    .marked-popup *::after {
      box-sizing: border-box;
    }

    .marked-popup {
      position: fixed;
      z-index: 2147483647;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      animation: marked-popup-in 0.15s ease;
    }

    @keyframes marked-popup-in {
      from {
        opacity: 0;
        transform: translateY(-8px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .marked-popup-inner {
      background: #1a1f1c;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
      padding: 14px;
      width: 260px;
    }

    .marked-popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .marked-popup-title {
      font-size: 12px;
      font-weight: 600;
      color: #8a9590;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .marked-btn-delete {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 6px;
      color: #f87171;
      cursor: pointer;
      transition: all 0.15s;
    }

    .marked-btn-delete:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: rgba(239, 68, 68, 0.4);
    }

    /* Color Selection */
    .marked-popup-colors {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .marked-color-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 2px solid var(--color-border);
      background: var(--color-bg);
      cursor: pointer;
      transition: all 0.15s;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .marked-color-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .marked-color-btn.active {
      transform: scale(1.1);
      box-shadow: 0 0 0 2px #1a1f1c, 0 0 0 4px var(--color-border);
    }

    .marked-color-check {
      display: none;
      color: #1a1f1c;
    }

    .marked-color-btn.active .marked-color-check {
      display: flex;
    }

    /* Memo Input */
    .marked-popup-memo {
      margin-bottom: 12px;
    }

    .marked-memo-input {
      width: 100%;
      padding: 10px 12px;
      background: #111815;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      color: #f8faf9;
      font-family: inherit;
      font-size: 13px;
      resize: none;
      line-height: 1.5;
      transition: all 0.15s;
      box-sizing: border-box;
    }

    .marked-memo-input:focus {
      outline: none;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }

    .marked-memo-input::placeholder {
      color: #5c6662;
    }

    /* Action Buttons */
    .marked-popup-actions {
      display: flex;
      gap: 8px;
    }

    .marked-btn-cancel,
    .marked-btn-save {
      flex: 1;
      padding: 10px 16px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .marked-btn-cancel {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #8a9590;
    }

    .marked-btn-cancel:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.15);
      color: #f8faf9;
    }

    .marked-btn-save {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: none;
      color: white;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
    }

    .marked-btn-save:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
    }

    /* Highlight Styles */
    .marked-highlight {
      background-color: #FEF08A;
      padding: 1px 2px;
      margin: -1px -2px;
      border-radius: 2px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .marked-highlight:hover {
      filter: brightness(0.95);
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
    }

    /* Toast */
    .marked-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      background: #1a1f1c;
      color: #f8faf9;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 2147483647;
      animation: marked-toast-in 0.3s ease;
    }

    @keyframes marked-toast-in {
      from {
        opacity: 0;
        transform: translateY(16px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .marked-toast-out {
      animation: marked-toast-out 0.3s ease forwards;
    }

    @keyframes marked-toast-out {
      from {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      to {
        opacity: 0;
        transform: translateY(16px) scale(0.95);
      }
    }
  `;
  document.head.appendChild(style);
}

export {};
