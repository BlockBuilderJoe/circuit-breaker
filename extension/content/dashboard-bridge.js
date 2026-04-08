// Circuit Breaker — Dashboard Bridge (content script)
// Injected on the Circuit Breaker dashboard pages. Relays messages between
// the webpage (postMessage) and the extension background (runtime.sendMessage).
// This is the universal cross-browser approach (works on Chrome, Firefox, Safari, Edge).

const ALLOWED_ORIGINS = [
  'https://fuseboard-sync.joe-780.workers.dev',
  'https://switch-ahg.pages.dev',
  'https://circuitbreaker.app',
  'http://localhost',
];

function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o + ':'));
}

/**
 * Check if the extension context is still valid.
 * After an extension reload/update, old content scripts remain injected
 * but their chrome.runtime connection is severed. Any API call will throw
 * "Extension context invalidated". This guard prevents that.
 */
function isContextValid() {
  try {
    return !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

// Listen for messages from the webpage
window.addEventListener('message', (event) => {
  if (!isAllowedOrigin(event.origin)) return;
  if (!event.data?.type) return;

  if (event.data.type === 'CB_PING') {
    if (!isContextValid()) {
      // Extension was reloaded — tell the page to refresh so the new content script takes over
      window.postMessage({ type: 'CB_STALE' }, '*');
      return;
    }
    const version = chrome.runtime?.getManifest?.()?.version || 'unknown';
    window.postMessage({ type: 'CB_PONG', version }, '*');
    return;
  }

  if (event.data.type === 'CB_UPDATE') {
    if (!isContextValid()) {
      window.postMessage({ type: 'CB_STALE' }, '*');
      return;
    }

    const msg = {
      type: 'updateRules',
      selections: event.data.selections,
      domains: event.data.domains || [],
      urls: event.data.urls || [],
      selectors: event.data.selectors || {},
    };

    // Write directly to storage (works even if service worker is asleep)
    const toStore = {
      blockedDomains: msg.domains,
      blockedUrls: msg.urls,
      hiddenSelectors: msg.selectors,
    };
    if (msg.selections) toStore.selections = msg.selections;
    if (event.data.allowedChannels !== undefined) toStore.allowedChannels = event.data.allowedChannels;
    if (event.data.subsOnlyMode !== undefined) toStore.subsOnlyMode = event.data.subsOnlyMode;

    try {
      chrome.storage.sync.set(toStore);
    } catch (e) {
      console.log('Circuit Breaker bridge: storage write failed (context invalidated)');
      window.postMessage({ type: 'CB_STALE' }, '*');
      return;
    }

    // Also send to background for declarativeNetRequest rule updates
    try {
      chrome.runtime.sendMessage(msg, () => {
        if (chrome.runtime.lastError) {
          console.log('Circuit Breaker bridge: background unavailable, storage updated directly');
        }
      });
    } catch (e) {
      console.log('Circuit Breaker bridge: sendMessage failed (context invalidated)');
    }
    return;
  }
});

// Announce presence immediately so the page knows the extension is installed
if (isContextValid()) {
  window.postMessage({
    type: 'CB_PONG',
    version: chrome.runtime?.getManifest?.()?.version || 'unknown',
  }, '*');
}
