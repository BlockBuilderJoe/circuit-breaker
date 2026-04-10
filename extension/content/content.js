// Circuit Breaker — Content Script
// 1. Hides elements based on selectors
// 2. Watches for SPA URL changes and blocks matching paths

// Never run on Circuit Breaker dashboard pages
const SAFE_HOSTS = ['fuseboard-sync.joe-780.workers.dev', 'switch-ahg.pages.dev', 'circuitbreaker.app'];
if (SAFE_HOSTS.includes(location.hostname)) {
  // Skip all blocking on dashboard
} else {

let hiddenSelectors = {};
let blockedUrlRules = [];
let followingOnly = {};
let lastUrl = location.href;

// Follower-only redirects: when enabled, bounce the home/FYP-style page to the
// native followed feed. Individual video/channel pages are untouched, so
// clicking a followed creator's video plays normally without looping.
const FOLLOWING_REDIRECTS = [
  { featureId: 'yt-subs-only', domain: 'youtube.com', target: '/feed/subscriptions', homePaths: ['/', ''] },
  { featureId: 'tt-following', domain: 'tiktok.com', target: '/following', homePaths: ['/', '', '/foryou'] },
  { featureId: 'tw-subs-only', domain: 'twitch.tv', target: '/directory/following', homePaths: ['/', ''] },
];

// Built-in cookie consent selectors — applied when the cookie-popups feature is enabled.
// Many publishers self-host consent scripts (e.g. sourcepoint.theguardian.com,
// a02342.theargus.co.uk) so network-level blocking alone won't catch them.
// This ensures CSS hiding works regardless of whether the dashboard pushed selectors.
const COOKIE_CONSENT_CSS = '#onetrust-banner-sdk, #onetrust-consent-sdk, .onetrust-pc-dark-filter, #CybotCookiebotDialog, #CybotCookiebotDialogBodyUnderlay, .cmp-container, [id^="sp_message_container"], .sp_message_open, #sp_message_overlay, .fc-consent-root, .fc-dialog-overlay, #qc-cmp2-container, .qc-cmp2-container, #truste-consent-track, .trustarc-banner, #didomi-host, .didomi-popup-container, [class*="consent-banner"], [id*="consent-banner"], .js-consent-banner, #usercentrics-root, .iubenda-cs-container, #cookiescript_injected, [id*="cookie-law"], [class*="cookie-banner"], [id*="cookie-banner"], [class*="cookie-notice"], [id*="cookie-notice"], .cc-window, .cc-banner, #sp-cc-wrapper, #cos-banner, #gdpr-banner, #gdpr-banner-container, #gdpr-new-container, [class*="_shein_privacy"], #gdpr-single-choice-overlay, tiktok-cookie-banner, #cookie-consent, .osano-cm-window, .evidon-consent-button, [data-testid="cookie-policy-manage-dialog"], .almacmp-modalwrap, #ppms_cm_popup_overlay, .cmpboxBG, #cmpbox, #cmpbox2, .cmp-root, [id*="cookie-preferences"], [class*="cookie-consent"], [id*="cookieconsent"], [data-testid="consent-banner"], [data-testid="main-cookies-banner-container"]';

// Load config from storage
function loadConfig() {
  chrome.storage.sync.get(['hiddenSelectors', 'blockedUrls', 'followingOnly', 'selections'], (data) => {
    hiddenSelectors = data.hiddenSelectors || {};

    // Ensure cookie consent CSS is applied when the feature is enabled,
    // even if the dashboard didn't push the global selectors to storage
    const cookieEnabled = data.selections?.['ads-trackers']?.features?.['cookie-css'];
    if (cookieEnabled) {
      if (!hiddenSelectors['*']) hiddenSelectors['*'] = [];
      const alreadyHas = hiddenSelectors['*'].some(s => s.includes('sp_message_container'));
      if (!alreadyHas) hiddenSelectors['*'].push(COOKIE_CONSENT_CSS);
    }

    blockedUrlRules = data.blockedUrls || [];
    followingOnly = data.followingOnly || {};
    applyHiding();
    checkUrl();
    checkFollowingOnly();
  });
}

// --- Element Hiding ---
function applyHiding() {
  const hostname = window.location.hostname.replace('www.', '');
  // Match exact domain OR subdomain (e.g. edition.cnn.com matches cnn.com key)
  const siteSelectors = hiddenSelectors[hostname] ||
    Object.entries(hiddenSelectors).find(([k]) => k !== '*' && hostname.endsWith('.' + k))?.[1] || [];
  // Global selectors (e.g. cookie popups) apply to all sites
  const globalSelectors = hiddenSelectors['*'] || [];
  const selectors = [...siteSelectors, ...globalSelectors];
  if (!selectors || selectors.length === 0) {
    const existing = document.getElementById('cb-hide');
    if (existing) existing.remove();
    return;
  }

  let style = document.getElementById('cb-hide');
  if (!style) {
    style = document.createElement('style');
    style.id = 'cb-hide';
    (document.head || document.documentElement).appendChild(style);
  }

  let css = selectors.map(s => `${s} { display: none !important; }`).join('\n');

  // When hiding cookie consent popups, remove scroll-lock classes that consent
  // managers add. These classes set overflow:hidden, position:fixed, and height:100vh
  // on html/body to prevent scrolling behind the consent dialog. Hiding the dialog
  // via CSS alone leaves these classes in place, so the page stays frozen.
  if (globalSelectors.length > 0) {
    const scrollLockClasses = ['sp-message-open', 'sp_message_open', 'fc-consent-root', 'didomi-popup-open', 'cmpBodyOverride', 'cmp-modal-open'];
    for (const cls of scrollLockClasses) {
      document.documentElement.classList.remove(cls);
      document.body.classList.remove(cls);
    }
    // Also reset any inline styles consent managers may have set
    if (document.body.style.overflow === 'hidden') document.body.style.overflow = '';
    if (document.body.style.position === 'fixed') document.body.style.position = '';
    if (document.documentElement.style.overflow === 'hidden') document.documentElement.style.overflow = '';
  }

  style.textContent = css;
}

// --- SPA URL Blocking ---
let isRedirecting = false;

function checkUrl() {
  // Don't check on our own blocked page
  if (location.href.includes('blocked/blocked.html')) return;
  if (isRedirecting) return;

  const url = location.href;
  const pathname = location.pathname;
  const hostname = location.hostname.replace('www.', '');

  for (const rule of blockedUrlRules) {
    let urlFilter, domains;

    if (typeof rule === 'string') {
      urlFilter = rule;
      domains = null;
    } else {
      urlFilter = rule.urlFilter;
      domains = rule.requestDomains;
    }

    // Check domain match
    if (domains && !domains.some(d => hostname === d || hostname.endsWith('.' + d))) {
      continue;
    }

    // Check path match — only match against pathname, not full URL
    const filterClean = urlFilter.replace(/^\|\|[^/]*/, '');

    // If filter was domain-only (e.g. ||store.steampowered.com), domain match above is enough.
    // Otherwise check the path component matches.
    if (filterClean) {
      if (filterClean === '/') {
        // Root-page rule (e.g. ||tiktok.com/) — only match the homepage exactly,
        // not every page (since every pathname contains '/')
        if (pathname !== '/' && pathname !== '') continue;
      } else {
        if (!pathname.includes(filterClean)) continue;
      }
    } else if (!urlFilter.startsWith('||')) {
      // Plain string filter — match against pathname
      if (!pathname.includes(urlFilter)) continue;
    }
    // If we reach here: either domain-only || rule matched, or path matched

    isRedirecting = true;
    // Replace current history entry so back button doesn't loop
    window.stop();
    document.title = 'Blocked by Circuit Breaker';
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#07080a;color:#e4e6ea;font-family:system-ui,sans-serif;text-align:center">
        <div>
          <div style="font-size:2rem;margin-bottom:8px">Blocked by <span style="color:#22c55e">Circuit Breaker</span></div>
          <div style="color:#666;margin-bottom:16px">This content has been tripped.</div>
          <a href="javascript:history.back()" style="color:#22c55e;text-decoration:none;padding:8px 20px;border:1px solid rgba(34,197,94,.3);border-radius:8px;font-size:.85rem">Go Back</a>
        </div>
      </div>
    `;
    setTimeout(() => { isRedirecting = false; }, 1000);
    return;
  }
}

// --- Follower-Only Mode: redirect home/FYP to the native followed feed ---
function checkFollowingOnly() {
  if (isRedirecting) return;
  const hostname = location.hostname.replace('www.', '');
  const rule = FOLLOWING_REDIRECTS.find(r => hostname === r.domain || hostname.endsWith('.' + r.domain));
  if (!rule) return;
  if (!followingOnly[rule.featureId]) return;
  // Already on (or inside) the target feed — leave alone.
  if (location.pathname === rule.target || location.pathname.startsWith(rule.target + '/')) return;
  // Only redirect from home/FYP entry points, not individual video/channel pages.
  if (!rule.homePaths.includes(location.pathname)) return;
  isRedirecting = true;
  location.replace(rule.target);
  setTimeout(() => { isRedirecting = false; }, 1000);
}

// Watch for SPA navigation (URL changes without page reload)
function watchUrlChanges() {
  // Poll for URL changes (covers pushState, replaceState, popstate)
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      checkUrl();
      applyHiding();
      checkFollowingOnly();
    }
  }, 500);

  // Also intercept pushState and replaceState
  const origPush = history.pushState;
  const origReplace = history.replaceState;

  history.pushState = function() {
    origPush.apply(this, arguments);
    setTimeout(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        checkUrl();
        applyHiding();
      }
    }, 0);
  };

  history.replaceState = function() {
    origReplace.apply(this, arguments);
    setTimeout(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        checkUrl();
        applyHiding();
      }
    }, 0);
  };

  window.addEventListener('popstate', () => {
    setTimeout(() => {
      lastUrl = location.href;
      checkUrl();
      applyHiding();
      checkFollowingOnly();
    }, 0);
  });
}

// Watch for dynamic content (for element hiding)
const observer = new MutationObserver(() => {
  applyHiding();
});

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    if (changes.hiddenSelectors || changes.selections) {
      // Reload full config so cookie consent fallback is re-evaluated
      loadConfig();
      return;
    }
    if (changes.blockedUrls) {
      blockedUrlRules = changes.blockedUrls.newValue || [];
      checkUrl();
    }
    if (changes.followingOnly) {
      followingOnly = changes.followingOnly.newValue || {};
      checkFollowingOnly();
    }
  }
});

// Init
loadConfig();
watchUrlChanges();

} // end SAFE_HOSTS check
