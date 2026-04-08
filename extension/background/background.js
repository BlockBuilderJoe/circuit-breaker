// Circuit Breaker — Background Service Worker v2.0.0
importScripts('../sync/sync.js');

// --- Dev auto-reload: polls a local dev server for build changes ---
// Run `python3 -m http.server 8111` in the extension/ dir to enable
(function devReload() {
  const DEV_URL = 'http://localhost:8111/.build-stamp';
  const POLL_MS = 2000;
  let lastStamp = null;

  async function check() {
    try {
      const res = await fetch(DEV_URL, { cache: 'no-store' });
      if (!res.ok) { setTimeout(check, POLL_MS); return; }
      const stamp = (await res.text()).trim();
      if (lastStamp && stamp !== lastStamp) {
        console.log('Circuit Breaker: build changed, reloading...');
        chrome.runtime.reload();
        return;
      }
      lastStamp = stamp;
    } catch {} // dev server not running — ignore
    setTimeout(check, POLL_MS);
  }
  check();
})();

chrome.runtime.onInstalled.addListener(async () => {
  // Nuke all rules on install/update
  const all = await chrome.declarativeNetRequest.getDynamicRules();
  if (all.length) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: all.map(r => r.id) });
  }
  applyRules();
  updateStaticRulesets();
});

chrome.runtime.onStartup.addListener(() => { applyRules(); updateStaticRulesets(); });

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && (changes.blockedDomains || changes.blockedUrls)) {
    applyRules();
  }
  if (area === 'sync' && changes.selections) {
    updateStaticRulesets();
  }
});

// Toggle static rulesets (ad/tracker + cookie consent) based on ads-trackers category
async function updateStaticRulesets() {
  try {
    const data = await chrome.storage.sync.get(['selections']);
    const adsEnabled = data.selections?.['ads-trackers']?.enabled || false;

    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: adsEnabled ? ['ads_trackers_network', 'cookie_consent'] : [],
      disableRulesetIds: adsEnabled ? [] : ['ads_trackers_network', 'cookie_consent'],
    });

    console.log('Circuit Breaker: ad/cookie rulesets', adsEnabled ? 'enabled' : 'disabled');
  } catch (e) {
    console.error('Circuit Breaker: static ruleset error:', e.message);
  }
}

let applying = false;

async function applyRules() {
  if (applying) return;
  applying = true;

  try {
    // 1. Remove every existing rule
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    if (existing.length) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existing.map(r => r.id),
      });
    }

    // 2. Verify they're gone
    const check = await chrome.declarativeNetRequest.getDynamicRules();
    if (check.length) {
      console.warn('Circuit Breaker: stale rules remain, forcing clear');
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: check.map(r => r.id),
      });
    }

    // 3. Build new rules from storage
    const data = await chrome.storage.sync.get(['blockedDomains']);
    const domains = [...new Set((data.blockedDomains || []).filter(Boolean))];

    if (domains.length === 0) {
      chrome.action.setBadgeText({ text: '' });
      applying = false;
      return;
    }

    // Never block the Circuit Breaker dashboard, extension pages, or core infrastructure
    const SAFE_DOMAINS = [
      'fuseboard-sync.joe-780.workers.dev', 'switch-ahg.pages.dev', 'circuitbreaker.app', 'localhost',
      'cloudflare.com', 'cloudflare-dns.com', 'one.one.one.one',
      'chrome.google.com', 'chromewebstore.google.com',
    ];
    const safeDomains = domains.filter(d => !SAFE_DOMAINS.some(safe => d === safe || d.endsWith('.' + safe)));

    const addRules = [];

    // Use requestDomains for exact domain matching (includes subdomains automatically).
    // This is safer than urlFilter: ||domain which can false-positive on substring matches
    // (e.g. ||ea.com could match via urlFilter pattern bugs, but requestDomains won't).
    safeDomains.forEach((domain, i) => {
      addRules.push({
        id: i + 1,
        priority: 1,
        action: { type: 'redirect', redirect: { extensionPath: '/blocked/blocked.html' } },
        condition: { requestDomains: [domain], resourceTypes: ['main_frame'] }
      });
    });

    // 4. Add new rules
    await chrome.declarativeNetRequest.updateDynamicRules({ addRules });

    chrome.action.setBadgeText({ text: String(addRules.length) });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
    console.log('Circuit Breaker:', addRules.length, 'rules applied');
  } catch (e) {
    console.error('Circuit Breaker:', e.message);
  }

  applying = false;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'updateRules') {
    // Save selections if provided (from dashboard bridge)
    const toStore = {
      blockedDomains: msg.domains || [],
      blockedUrls: msg.urls || [],
      hiddenSelectors: msg.selectors || {},
    };
    if (msg.selections) toStore.selections = msg.selections;

    chrome.storage.sync.set(toStore, () => {
      applyRules().then(() => {
        updateStaticRulesets();
        sendResponse({ ok: true });
      });
    });
    return true;
  }
  if (msg.action === 'openDashboard') {
    chrome.tabs.create({ url: 'https://circuitbreaker.app/#dashboard' });
  }
});
