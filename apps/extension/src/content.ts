/**
 * Content Script for Marked Extension
 * Handles:
 * - Text selection for creating marks
 * - Highlighting existing marks on the page
 * - Quick save button injection
 */

import type { CreateMarkPayload } from '@marked/shared';

// Inject quick save button on text selection
let selectionButton: HTMLElement | null = null;

document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim();

  if (selectedText && selectedText.length > 0) {
    showSelectionButton(e.clientX, e.clientY, selectedText);
  } else {
    hideSelectionButton();
  }
});

document.addEventListener('mousedown', (e) => {
  if (selectionButton && !selectionButton.contains(e.target as Node)) {
    hideSelectionButton();
  }
});

function showSelectionButton(x: number, y: number, text: string) {
  hideSelectionButton();

  selectionButton = document.createElement('div');
  selectionButton.className = 'marked-selection-button';
  selectionButton.innerHTML = `
    <button class="marked-btn marked-btn-mark" title="Create Mark">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
      </svg>
    </button>
  `;

  selectionButton.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y - 40}px;
    z-index: 2147483647;
    display: flex;
    gap: 4px;
    padding: 4px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  `;

  const markButton = selectionButton.querySelector('.marked-btn-mark');
  markButton?.addEventListener('click', () => {
    createMark(text);
    hideSelectionButton();
  });

  document.body.appendChild(selectionButton);
}

function hideSelectionButton() {
  if (selectionButton) {
    selectionButton.remove();
    selectionButton = null;
  }
}

async function createMark(text: string) {
  const payload: CreateMarkPayload = {
    url: window.location.href,
    text,
    color: '#FFEB3B',
  };

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CREATE_MARK',
      payload,
    });

    if (response.success) {
      highlightText(text);
      showToast('Mark created!');
    } else {
      showToast(response.error || 'Failed to create mark');
    }
  } catch (error) {
    showToast('Failed to create mark');
  }
}

function highlightText(text: string) {
  // Simple highlight - find and wrap text
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent?.includes(text)) {
      const range = document.createRange();
      const startIndex = node.textContent.indexOf(text);
      range.setStart(node, startIndex);
      range.setEnd(node, startIndex + text.length);

      const highlight = document.createElement('mark');
      highlight.className = 'marked-highlight';
      highlight.style.cssText = 'background-color: #FFEB3B; padding: 2px 0;';
      range.surroundContents(highlight);
      break;
    }
  }
}

function showToast(message: string) {
  const toast = document.createElement('div');
  toast.className = 'marked-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: #333;
    color: white;
    border-radius: 8px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: marked-toast-in 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'marked-toast-out 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes marked-toast-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes marked-toast-out {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(20px); }
  }
`;
document.head.appendChild(style);

// Listen for auth token messages from web app
window.addEventListener('message', async (event) => {
  // Only accept messages from our web app
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  if (!event.origin.startsWith(apiUrl.replace(/\/$/, ''))) {
    return;
  }

  if (event.data?.type === 'MARKED_AUTH_TOKEN') {
    const { token } = event.data;
    if (token) {
      await chrome.storage.local.set({ authToken: token });
      showToast('Signed in to Marked!');
    }
  }

  if (event.data?.type === 'MARKED_AUTH_LOGOUT') {
    await chrome.storage.local.remove('authToken');
    showToast('Signed out from Marked');
  }
});

export {};
