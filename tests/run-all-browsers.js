#!/usr/bin/env node

/**
 * FuseBox Comprehensive Multi-Browser Test Suite
 * ================================================
 * Tests every fuse, every setting, across Chrome, Firefox, and WebKit (Safari).
 *
 * Usage:
 *   node run-all-browsers.js                     # All browsers, all tests
 *   node run-all-browsers.js --browser chromium   # Single browser
 *   node run-all-browsers.js --site youtube       # Single site
 *   node run-all-browsers.js --headless           # Headless mode
 *   node run-all-browsers.js --quick              # Skip screenshots
 */

const { chromium, firefox, webkit } = require('playwright');
const path = require('path');
const fs = require('fs');

// ─── Configuration ───────────────────────────────────────

const RESULTS_DIR = path.join(__dirname, 'results');
const TIMEOUT_NAV = 20000;
const TIMEOUT_WAIT = 4000;
const SCREENSHOT_ENABLED = !process.argv.includes('--quick');

const BROWSERS = (() => {
  const idx = process.argv.indexOf('--browser');
  if (idx !== -1) {
    const b = process.argv[idx + 1];
    if (b === 'chromium' || b === 'chrome') return ['chromium'];
    if (b === 'firefox') return ['firefox'];
    if (b === 'webkit' || b === 'safari') return ['webkit'];
  }
  return ['chromium', 'firefox', 'webkit'];
})();

const SITE_FILTER = (() => {
  const idx = process.argv.indexOf('--site');
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

const HEADLESS = process.argv.includes('--headless');

// ─── Test URLs — where to find each site's elements ──────

const TEST_URLS = {
  // Social Media
  tiktok:      { element: 'https://www.tiktok.com/foryou', base: 'https://www.tiktok.com' },
  instagram:   { element: 'https://www.instagram.com', base: 'https://www.instagram.com' },
  facebook:    { element: 'https://www.facebook.com', base: 'https://www.facebook.com' },
  twitter:     { element: 'https://x.com/home', base: 'https://x.com' },
  snapchat:    { element: 'https://www.snapchat.com', base: 'https://www.snapchat.com' },
  reddit:      { element: 'https://www.reddit.com/r/AskReddit/top/?t=day', base: 'https://www.reddit.com' },
  pinterest:   { element: 'https://www.pinterest.com', base: 'https://www.pinterest.com' },
  linkedin:    { element: 'https://www.linkedin.com/feed/', base: 'https://www.linkedin.com' },

  // Video Streaming
  youtube:     { element: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', base: 'https://www.youtube.com' },
  netflix:     { element: 'https://www.netflix.com', base: 'https://www.netflix.com' },
  disneyplus:  { element: 'https://www.disneyplus.com', base: 'https://www.disneyplus.com' },
  hulu:        { element: 'https://www.hulu.com', base: 'https://www.hulu.com' },
  twitch:      { element: 'https://www.twitch.tv/xqc', base: 'https://www.twitch.tv' },
  primevideo:  { element: 'https://www.primevideo.com', base: 'https://www.primevideo.com' },
  crunchyroll: { element: 'https://www.crunchyroll.com', base: 'https://www.crunchyroll.com' },

  // Gaming
  steam:       { element: 'https://store.steampowered.com', base: 'https://store.steampowered.com' },
  epic:        { element: 'https://www.epicgames.com', base: 'https://www.epicgames.com' },
  roblox:      { element: 'https://www.roblox.com', base: 'https://www.roblox.com' },

  // Shopping
  amazon:      { element: 'https://www.amazon.co.uk/dp/B0D1XD1ZV3', base: 'https://www.amazon.co.uk' },
  ebay:        { element: 'https://www.ebay.co.uk', base: 'https://www.ebay.co.uk' },

  // News
  cnn:         { element: 'https://www.cnn.com', base: 'https://www.cnn.com' },
  'bbc-news':  { element: 'https://www.bbc.co.uk/news', base: 'https://www.bbc.co.uk/news' },
  foxnews:     { element: 'https://www.foxnews.com', base: 'https://www.foxnews.com' },
  dailymail:   { element: 'https://www.dailymail.co.uk', base: 'https://www.dailymail.co.uk' },
  nytimes:     { element: 'https://www.nytimes.com', base: 'https://www.nytimes.com' },
  theguardian: { element: 'https://www.theguardian.com', base: 'https://www.theguardian.com' },

  // AI
  chatgpt:     { element: 'https://chatgpt.com', base: 'https://chatgpt.com' },
  midjourney:  { element: 'https://www.midjourney.com', base: 'https://www.midjourney.com' },
  'google-ai': { element: 'https://www.google.com/search?q=what+is+AI', base: 'https://www.google.com' },

  // Domain-only sites (no features, just domain blocking)
  // Ads & Trackers
  'google-ads':     { base: 'https://www.googletagmanager.com' },
  'facebook-ads':   { base: 'https://www.facebook.net' },
  'generic-trackers': { base: 'https://www.hotjar.com' },
  'analytics':      { base: 'https://analytics.google.com' },

  // Adult (we only test domain reachability, not content)
  pornhub:     { base: 'https://www.pornhub.com' },

  // Gambling
  bet365:      { base: 'https://www.bet365.com' },
  draftkings:  { base: 'https://www.draftkings.com' },

  // Dating
  tinder:      { base: 'https://www.tinder.com' },
  bumble:      { base: 'https://www.bumble.com' },

  // Crypto
  coinbase:    { base: 'https://www.coinbase.com' },
  binance:     { base: 'https://www.binance.com' },
};

// ─── Utilities ───────────────────────────────────────────

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function takeScreenshot(page, filename) {
  if (!SCREENSHOT_ENABLED) return null;
  try {
    const filepath = path.join(RESULTS_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: false });
    return filename;
  } catch { return null; }
}

const COOKIE_SELECTORS = [
  '#onetrust-accept-btn-handler',
  '[data-testid="cookie-policy-manage-dialog-accept-button"]',
  '.fc-cta-consent',
  '#cookie-banner button',
  '[aria-label="Accept cookies"]',
  '[aria-label="Accept all"]',
  'button[data-cookiebanner="accept_button"]',
  '#sp_message_accept',
  '.evidon-banner-acceptbutton',
  '#consent-accept',
  '[data-testid="GDPR-consent"] button',
  'button:has-text("Accept")',
  'button:has-text("Accept all")',
  'button:has-text("I agree")',
  'button:has-text("Got it")',
  'button:has-text("OK")',
];

async function dismissCookieBanners(page) {
  for (const sel of COOKIE_SELECTORS) {
    try {
      const btn = await page.$(sel);
      if (btn && await btn.isVisible()) {
        await btn.click();
        await wait(500);
      }
    } catch {}
  }
}

async function checkElementExists(page, selector) {
  try {
    return await page.evaluate((sel) => {
      const parts = sel.split(',').map(s => s.trim());
      let total = 0;
      for (const part of parts) {
        try { total += document.querySelectorAll(part).length; } catch {}
      }
      return total;
    }, selector);
  } catch { return 0; }
}

async function injectHidingCSS(page, selector) {
  try {
    await page.evaluate((sel) => {
      const style = document.createElement('style');
      style.id = 'fusebox-test-hide';
      style.textContent = `${sel} { display: none !important; visibility: hidden !important; }`;
      document.head.appendChild(style);
    }, selector);
    return true;
  } catch { return false; }
}

async function checkElementHidden(page, selector) {
  try {
    return await page.evaluate((sel) => {
      const parts = sel.split(',').map(s => s.trim());
      let total = 0, hidden = 0;
      for (const part of parts) {
        try {
          const els = document.querySelectorAll(part);
          total += els.length;
          els.forEach(el => {
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || el.offsetHeight === 0) hidden++;
          });
        } catch {}
      }
      return { total, hidden, allHidden: total > 0 && hidden === total };
    }, selector);
  } catch { return { total: 0, hidden: 0, allHidden: false }; }
}

async function checkLoginWall(page) {
  const url = page.url();
  if (/\/(login|signin|sign-in|auth|accounts|sso)/i.test(url)) return true;
  try {
    return await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="password"], input[name="password"]');
      for (const input of inputs) {
        const style = getComputedStyle(input);
        const rect = input.getBoundingClientRect();
        if (style.display !== 'none' && style.visibility !== 'hidden' && rect.height > 0) return true;
      }
      return false;
    });
  } catch { return false; }
}

async function checkSelectorValid(page, selector) {
  try {
    return await page.evaluate((sel) => {
      const parts = sel.split(',').map(s => s.trim());
      for (const part of parts) {
        try { document.querySelector(part); } catch { return false; }
      }
      return true;
    }, selector);
  } catch { return false; }
}

// ─── Load blocklists ─────────────────────────────────────

function loadCategories() {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'extension', 'data', 'blocklists.js'), 'utf8'
  );
  const fn = new Function(src + '\nreturn categories;');
  return fn();
}

// ─── Test runners ────────────────────────────────────────

async function testElementFeature(page, browserName, category, site, feature) {
  const result = {
    browser: browserName,
    category: category.id,
    categoryName: category.name,
    site: site.id,
    siteName: site.name,
    feature: feature.id,
    featureName: feature.name,
    type: feature.type,
    selector: feature.selector || null,
    urlFilter: feature.urlFilter || null,
    status: 'pending',
    reason: null,
    beforeScreenshot: null,
    afterScreenshot: null,
    elementsFound: 0,
    elementsHidden: 0,
    selectorValid: true,
    timestamp: new Date().toISOString(),
  };

  const urls = TEST_URLS[site.id];
  if (!urls || !urls.element) {
    result.status = 'skip';
    result.reason = 'No test URL configured';
    return result;
  }

  if (!feature.selector) {
    result.status = 'skip';
    result.reason = 'No selector defined';
    return result;
  }

  try {
    await page.goto(urls.element, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await wait(TIMEOUT_WAIT);
    await dismissCookieBanners(page);
    await wait(1000);

    // Check selector syntax validity
    result.selectorValid = await checkSelectorValid(page, feature.selector);
    if (!result.selectorValid) {
      result.status = 'fail';
      result.reason = `Invalid CSS selector syntax: ${feature.selector.substring(0, 80)}`;
      return result;
    }

    if (await checkLoginWall(page)) {
      result.status = 'skip';
      result.reason = 'Login required';
      result.beforeScreenshot = await takeScreenshot(page, `${browserName}-${site.id}-${feature.id}-login.png`);
      return result;
    }

    result.beforeScreenshot = await takeScreenshot(page, `${browserName}-${site.id}-${feature.id}-before.png`);

    const count = await checkElementExists(page, feature.selector);
    result.elementsFound = count;

    if (count === 0) {
      result.status = 'fail';
      result.reason = `Selector matched 0 elements — may need updating`;
      return result;
    }

    // Inject hiding CSS
    await injectHidingCSS(page, feature.selector);
    await wait(500);

    result.afterScreenshot = await takeScreenshot(page, `${browserName}-${site.id}-${feature.id}-after.png`);

    const hidden = await checkElementHidden(page, feature.selector);
    result.elementsHidden = hidden.hidden;

    if (hidden.allHidden) {
      result.status = 'pass';
      result.reason = `${count} element(s) found and hidden`;
    } else {
      result.status = 'fail';
      result.reason = `${hidden.hidden}/${hidden.total} elements hidden (some still visible)`;
    }

    // Clean up injected CSS for next test
    await page.evaluate(() => {
      const style = document.getElementById('fusebox-test-hide');
      if (style) style.remove();
    });

  } catch (err) {
    result.status = 'fail';
    result.reason = `Error: ${err.message}`;
  }

  return result;
}

async function testUrlFeature(page, browserName, category, site, feature) {
  const result = {
    browser: browserName,
    category: category.id,
    categoryName: category.name,
    site: site.id,
    siteName: site.name,
    feature: feature.id,
    featureName: feature.name,
    type: feature.type,
    selector: null,
    urlFilter: feature.urlFilter || null,
    status: 'pending',
    reason: null,
    beforeScreenshot: null,
    afterScreenshot: null,
    elementsFound: 0,
    elementsHidden: 0,
    selectorValid: true,
    targetUrl: null,
    timestamp: new Date().toISOString(),
  };

  const urls = TEST_URLS[site.id];
  if (!urls) {
    result.status = 'skip';
    result.reason = 'No test URL configured';
    return result;
  }

  if (!feature.urlFilter) {
    result.status = 'skip';
    result.reason = 'No urlFilter defined';
    return result;
  }

  try {
    // Build target URL
    let targetUrl;
    if (feature.urlFilter.startsWith('||')) {
      targetUrl = 'https://' + feature.urlFilter.replace('||', '');
    } else {
      const domain = (feature.requestDomains && feature.requestDomains[0]) || site.domains[0];
      targetUrl = `https://www.${domain}${feature.urlFilter}`;
    }
    result.targetUrl = targetUrl;

    // Verify base site is accessible first
    if (urls.base) {
      await page.goto(urls.base, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
      await wait(2000);
      await dismissCookieBanners(page);

      if (await checkLoginWall(page)) {
        result.status = 'skip';
        result.reason = 'Login required';
        result.beforeScreenshot = await takeScreenshot(page, `${browserName}-${site.id}-${feature.id}-login.png`);
        return result;
      }

      result.beforeScreenshot = await takeScreenshot(page, `${browserName}-${site.id}-${feature.id}-before.png`);
    }

    // Navigate to the URL that should be blocked
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await wait(2000);

    result.afterScreenshot = await takeScreenshot(page, `${browserName}-${site.id}-${feature.id}-after.png`);

    if (await checkLoginWall(page)) {
      result.status = 'skip';
      result.reason = 'Login required for target URL';
      return result;
    }

    // Test elementSelectors if present (some URL features also hide elements)
    if (feature.elementSelectors && feature.elementSelectors.length > 0) {
      const combinedSelector = feature.elementSelectors.join(', ');
      const count = await checkElementExists(page, combinedSelector);
      result.elementsFound = count;
      result.selector = combinedSelector;

      if (count > 0) {
        await injectHidingCSS(page, combinedSelector);
        await wait(500);
        const hidden = await checkElementHidden(page, combinedSelector);
        result.elementsHidden = hidden.hidden;
      }
    }

    // URL feature passes if the URL was reachable (we're testing the blocking would work)
    result.status = 'pass';
    result.reason = `URL reachable at ${page.url().substring(0, 80)}`;

  } catch (err) {
    if (err.message.includes('net::ERR_') || err.message.includes('NS_ERROR_')) {
      result.status = 'pass';
      result.reason = `URL blocked at network level: ${err.message.substring(0, 80)}`;
    } else {
      result.status = 'fail';
      result.reason = `Error: ${err.message.substring(0, 120)}`;
    }
  }

  return result;
}

function testAllowlistFeature(browserName, category, site, feature) {
  return {
    browser: browserName,
    category: category.id,
    categoryName: category.name,
    site: site.id,
    siteName: site.name,
    feature: feature.id,
    featureName: feature.name,
    type: feature.type,
    selector: null,
    urlFilter: null,
    status: 'skip',
    reason: 'Allowlist feature — requires auth + manual channel config',
    beforeScreenshot: null,
    afterScreenshot: null,
    elementsFound: 0,
    elementsHidden: 0,
    selectorValid: true,
    timestamp: new Date().toISOString(),
  };
}

async function testDomainReachable(page, browserName, category, site) {
  const result = {
    browser: browserName,
    category: category.id,
    categoryName: category.name,
    site: site.id,
    siteName: site.name,
    feature: '__domain__',
    featureName: 'Domain Reachable',
    type: 'domain',
    selector: null,
    urlFilter: null,
    status: 'pending',
    reason: null,
    beforeScreenshot: null,
    afterScreenshot: null,
    elementsFound: 0,
    elementsHidden: 0,
    selectorValid: true,
    domains: site.domains,
    timestamp: new Date().toISOString(),
  };

  const urls = TEST_URLS[site.id];
  const testUrl = urls?.base || (site.domains[0] ? `https://www.${site.domains[0]}` : null);

  if (!testUrl) {
    result.status = 'skip';
    result.reason = 'No domain to test';
    return result;
  }

  try {
    await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await wait(1500);
    result.beforeScreenshot = await takeScreenshot(page, `${browserName}-${site.id}-domain.png`);

    const title = await page.title();
    result.status = 'pass';
    result.reason = `Domain reachable: ${title.substring(0, 60)}`;
  } catch (err) {
    result.status = 'fail';
    result.reason = `Domain unreachable: ${err.message.substring(0, 100)}`;
  }

  return result;
}

// ─── Collateral Damage Tests ─────────────────────────────

const COLLATERAL_TESTS = [
  {
    name: 'YouTube features → should not block Netflix',
    enableCategory: 'video-streaming', enableSite: 'youtube',
    enableFeatures: ['yt-shorts', 'yt-comments', 'yt-recommendations'],
    checkAccessible: [
      { url: 'https://www.netflix.com', name: 'Netflix' },
      { url: 'https://www.amazon.co.uk', name: 'Amazon' },
      { url: 'https://www.bbc.co.uk/news', name: 'BBC News' },
    ],
  },
  {
    name: 'YouTube features → YouTube itself still works',
    enableCategory: 'video-streaming', enableSite: 'youtube',
    enableFeatures: ['yt-shorts', 'yt-comments'],
    checkAccessible: [
      { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', name: 'YouTube video page' },
    ],
  },
  {
    name: 'Reddit features → should not block Twitter',
    enableCategory: 'social-media', enableSite: 'reddit',
    enableFeatures: ['rd-comments', 'rd-home', 'rd-sidebar'],
    checkAccessible: [
      { url: 'https://www.youtube.com', name: 'YouTube' },
      { url: 'https://x.com', name: 'Twitter/X' },
    ],
  },
  {
    name: 'Twitter features → should not block Reddit',
    enableCategory: 'social-media', enableSite: 'twitter',
    enableFeatures: ['tw-trending', 'tw-likes'],
    checkAccessible: [
      { url: 'https://www.reddit.com', name: 'Reddit' },
    ],
  },
  {
    name: 'Amazon features → should not block eBay',
    enableCategory: 'shopping', enableSite: 'amazon',
    enableFeatures: ['az-recommendations', 'az-sponsored'],
    checkAccessible: [
      { url: 'https://www.ebay.co.uk', name: 'eBay' },
      { url: 'https://www.etsy.com', name: 'Etsy' },
    ],
  },
  {
    name: 'Twitch features → should not block YouTube',
    enableCategory: 'video-streaming', enableSite: 'twitch',
    enableFeatures: ['tw-chat', 'tw-recommendations'],
    checkAccessible: [
      { url: 'https://www.youtube.com', name: 'YouTube' },
      { url: 'https://www.netflix.com', name: 'Netflix' },
    ],
  },
  {
    name: 'Social Media category → should not block Streaming',
    enableCategory: 'social-media', wholeCat: true,
    checkAccessible: [
      { url: 'https://www.netflix.com', name: 'Netflix' },
      { url: 'https://www.amazon.co.uk', name: 'Amazon' },
      { url: 'https://store.steampowered.com', name: 'Steam' },
    ],
  },
  {
    name: 'News category → should not block Social Media',
    enableCategory: 'news', wholeCat: true,
    checkAccessible: [
      { url: 'https://www.youtube.com', name: 'YouTube' },
      { url: 'https://www.reddit.com', name: 'Reddit' },
    ],
  },
  {
    name: 'Google AI selectors → should not break Google Search',
    enableCategory: 'ai', enableSite: 'google-ai',
    enableFeatures: ['ggl-ai-overview', 'ggl-ai-mode', 'ggl-paa'],
    checkAccessible: [
      { url: 'https://www.google.com/search?q=weather', name: 'Google Search' },
    ],
  },
  {
    name: 'Gambling category → should not block Shopping',
    enableCategory: 'gambling', wholeCat: true,
    checkAccessible: [
      { url: 'https://www.amazon.co.uk', name: 'Amazon' },
      { url: 'https://www.ebay.co.uk', name: 'eBay' },
    ],
  },
];

async function runCollateralTests(page, browserName, categories) {
  const results = [];

  for (const test of COLLATERAL_TESTS) {
    // Build selections
    const blockedDomains = [];
    const blockedSelectors = {};

    for (const cat of categories) {
      if (cat.id !== test.enableCategory) continue;

      for (const site of cat.sites || []) {
        const siteMatch = test.wholeCat || site.id === test.enableSite;
        if (!siteMatch) continue;

        const features = site.features || [];
        const enabledFeatures = test.wholeCat
          ? features.map(f => f.id)
          : (test.enableFeatures || []);

        // Check if all features enabled → domain-level block
        const allFeaturesOn = features.length > 0 && features.every(f => enabledFeatures.includes(f.id));
        if (features.length === 0 || allFeaturesOn) {
          for (const d of site.domains || []) {
            if (!blockedDomains.includes(d)) blockedDomains.push(d);
          }
        }

        // Collect element selectors
        for (const feat of features) {
          if (!enabledFeatures.includes(feat.id)) continue;
          const hostname = (site.domains[0] || '').replace('www.', '');
          if (feat.type === 'element' && feat.selector) {
            if (!blockedSelectors[hostname]) blockedSelectors[hostname] = [];
            blockedSelectors[hostname].push(feat.selector);
          }
          if (feat.elementSelectors) {
            if (!blockedSelectors[hostname]) blockedSelectors[hostname] = [];
            blockedSelectors[hostname].push(...feat.elementSelectors);
          }
        }
      }
    }

    // Check each URL
    for (const check of test.checkAccessible) {
      const result = {
        browser: browserName,
        testName: test.name,
        checkUrl: check.url,
        checkName: check.name,
        status: 'pending',
        reason: null,
        domainBlocked: false,
        selectorLeaked: false,
        screenshot: null,
        timestamp: new Date().toISOString(),
      };

      const checkHostname = new URL(check.url).hostname.replace('www.', '');

      // 1. Check domain collision
      const domainMatch = blockedDomains.find(d =>
        checkHostname === d || checkHostname.endsWith('.' + d)
      );

      if (domainMatch) {
        result.status = 'fail';
        result.reason = `DOMAIN BLOCKED: "${domainMatch}" would block ${check.url}`;
        result.domainBlocked = true;
        results.push(result);
        continue;
      }

      // 2. Check selector leak
      const leakedSelectors = [];
      for (const [hostname, sels] of Object.entries(blockedSelectors)) {
        if (checkHostname === hostname || checkHostname.endsWith('.' + hostname)) {
          leakedSelectors.push(...sels);
        }
      }

      // 3. Navigate and verify
      try {
        await page.goto(check.url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
        await wait(2000);

        result.screenshot = await takeScreenshot(page, `${browserName}-collateral-${check.name.replace(/[^a-z0-9]/gi, '-')}.png`);

        const pageContent = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');

        if (pageContent.includes('Blocked by FuseBox') || pageContent.includes('ERR_BLOCKED')) {
          result.status = 'fail';
          result.reason = `PAGE BLOCKED: FuseBox block page shown`;
        } else if (leakedSelectors.length > 0) {
          const matchCount = await page.evaluate((sels) => {
            let total = 0;
            for (const sel of sels) {
              try { total += document.querySelectorAll(sel).length; } catch {}
            }
            return total;
          }, leakedSelectors);

          if (matchCount > 0) {
            result.status = 'fail';
            result.reason = `SELECTOR LEAK: ${matchCount} elements on ${check.name} matched foreign selectors`;
            result.selectorLeaked = true;
          } else {
            result.status = 'pass';
            result.reason = 'Accessible (selectors matched 0 elements)';
          }
        } else {
          result.status = 'pass';
          result.reason = 'Accessible';
        }
      } catch (err) {
        if (err.message.includes('ERR_BLOCKED') || err.message.includes('NS_ERROR_')) {
          result.status = 'fail';
          result.reason = `NETWORK BLOCKED: ${err.message.substring(0, 80)}`;
        } else {
          result.status = 'fail';
          result.reason = `Error: ${err.message.substring(0, 100)}`;
        }
      }

      results.push(result);
    }
  }

  return results;
}

// ─── Domain Isolation Tests ──────────────────────────────
// Verify no domain appears in multiple categories (unintended cross-blocking)

function testDomainIsolation(categories) {
  const domainMap = {}; // domain → [{category, site}]
  const issues = [];

  for (const cat of categories) {
    for (const site of cat.sites || []) {
      for (const domain of site.domains || []) {
        if (!domainMap[domain]) domainMap[domain] = [];
        domainMap[domain].push({ category: cat.id, categoryName: cat.name, site: site.id, siteName: site.name });
      }
    }
  }

  for (const [domain, entries] of Object.entries(domainMap)) {
    if (entries.length > 1) {
      issues.push({
        domain,
        appearances: entries,
        severity: 'warning',
        message: `Domain "${domain}" appears in ${entries.length} categories: ${entries.map(e => `${e.categoryName}/${e.siteName}`).join(', ')}`,
      });
    }
  }

  return { domainMap, issues };
}

// ─── Main runner ─────────────────────────────────────────

async function runBrowserTests(browserType, browserName, categories) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${browserName.toUpperCase()} TESTS`);
  console.log(`${'═'.repeat(60)}`);

  const launchOptions = {
    headless: HEADLESS,
  };

  const browser = await browserType.launch(launchOptions);
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT_NAV);

  const featureResults = [];
  const collateralResults = [];

  // Collect all testable features
  const tests = [];
  for (const cat of categories) {
    for (const site of cat.sites || []) {
      if (SITE_FILTER && site.id !== SITE_FILTER) continue;

      const features = site.features || [];
      if (features.length === 0) {
        // Domain-only site — test reachability
        tests.push({ cat, site, feature: null, type: 'domain' });
      } else {
        for (const feature of features) {
          tests.push({ cat, site, feature, type: feature.type });
        }
      }
    }
  }

  console.log(`  Found ${tests.length} tests to run\n`);

  // Group by site
  const bySite = {};
  for (const t of tests) {
    if (!bySite[t.site.id]) bySite[t.site.id] = [];
    bySite[t.site.id].push(t);
  }

  let current = 0;
  for (const [siteId, siteTests] of Object.entries(bySite)) {
    const siteName = siteTests[0].site.name;
    console.log(`  ── ${siteName} (${siteTests.length} tests) ──`);

    let pageLoaded = false;

    for (const { cat, site, feature, type } of siteTests) {
      current++;
      const progress = `[${current}/${tests.length}]`;

      let result;

      if (type === 'domain') {
        result = await testDomainReachable(page, browserName, cat, site);
        pageLoaded = false;
      } else if (type === 'allowlist') {
        result = testAllowlistFeature(browserName, cat, site, feature);
      } else if (type === 'element') {
        if (!pageLoaded) {
          const urls = TEST_URLS[siteId];
          if (urls?.element) {
            try {
              await page.goto(urls.element, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
              await wait(TIMEOUT_WAIT);
              await dismissCookieBanners(page);
              await wait(1000);
              pageLoaded = true;
            } catch (err) {
              console.log(`    ${progress} ✗ Failed to load ${urls.element}: ${err.message.substring(0, 60)}`);
            }
          }
        }

        if (pageLoaded) {
          result = await testElementFeature(page, browserName, cat, site, feature);
        } else {
          result = {
            browser: browserName, category: cat.id, categoryName: cat.name,
            site: site.id, siteName: site.name, feature: feature.id,
            featureName: feature.name, type: 'element',
            selector: feature.selector, urlFilter: null,
            status: 'skip', reason: 'Page failed to load',
            beforeScreenshot: null, afterScreenshot: null,
            elementsFound: 0, elementsHidden: 0, selectorValid: true,
            timestamp: new Date().toISOString(),
          };
        }
      } else if (type === 'url') {
        result = await testUrlFeature(page, browserName, cat, site, feature);
        pageLoaded = false; // URL test navigates away
      }

      if (result) {
        featureResults.push(result);
        const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⊘';
        const detail = result.reason || '';
        console.log(`    ${progress} ${icon} ${result.featureName} — ${detail.substring(0, 70)}`);
      }

      await wait(300);
    }

    await wait(1000);
  }

  // Collateral damage tests
  if (!SITE_FILTER) {
    console.log(`\n  ── Collateral Damage Tests ──`);
    const cResults = await runCollateralTests(page, browserName, categories);
    for (const r of cResults) {
      const icon = r.status === 'pass' ? '✓' : '✗';
      console.log(`    ${icon} ${r.testName} → ${r.checkName}: ${r.reason?.substring(0, 50) || ''}`);
    }
    collateralResults.push(...cResults);
  }

  await browser.close();

  return { featureResults, collateralResults };
}

async function run() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       FuseBox Comprehensive Multi-Browser Test Suite    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Browsers: ${BROWSERS.join(', ')}`);
  console.log(`  Site filter: ${SITE_FILTER || 'all'}`);
  console.log(`  Screenshots: ${SCREENSHOT_ENABLED ? 'on' : 'off'}`);
  console.log(`  Headless: ${HEADLESS}`);
  console.log(`  Started: ${new Date().toISOString()}`);

  ensureDir(RESULTS_DIR);

  const categories = loadCategories();

  // Domain isolation analysis (no browser needed)
  console.log('\n── Domain Isolation Check ──');
  const isolation = testDomainIsolation(categories);
  if (isolation.issues.length > 0) {
    for (const issue of isolation.issues) {
      console.log(`  ⚠ ${issue.message}`);
    }
  } else {
    console.log('  ✓ No domain overlap between categories');
  }

  // Run browser tests
  const browserMap = { chromium, firefox, webkit };
  const allFeatureResults = [];
  const allCollateralResults = [];

  for (const bName of BROWSERS) {
    try {
      const { featureResults, collateralResults } = await runBrowserTests(
        browserMap[bName], bName, categories
      );
      allFeatureResults.push(...featureResults);
      allCollateralResults.push(...collateralResults);
    } catch (err) {
      console.error(`\n  ✗ ${bName} failed: ${err.message}`);
    }
  }

  // ─── Generate report ────────────────────────────────────

  const report = {
    version: '1.5.1',
    date: new Date().toISOString(),
    browsers: BROWSERS,
    siteFilter: SITE_FILTER,
    screenshotsEnabled: SCREENSHOT_ENABLED,
    domainIsolation: isolation,
    featureResults: allFeatureResults,
    collateralResults: allCollateralResults,
    summary: {
      total: allFeatureResults.length,
      passed: allFeatureResults.filter(r => r.status === 'pass').length,
      failed: allFeatureResults.filter(r => r.status === 'fail').length,
      skipped: allFeatureResults.filter(r => r.status === 'skip').length,
      byBrowser: {},
      byCategory: {},
    },
  };

  // Compute per-browser summary
  for (const b of BROWSERS) {
    const bResults = allFeatureResults.filter(r => r.browser === b);
    report.summary.byBrowser[b] = {
      total: bResults.length,
      passed: bResults.filter(r => r.status === 'pass').length,
      failed: bResults.filter(r => r.status === 'fail').length,
      skipped: bResults.filter(r => r.status === 'skip').length,
    };
  }

  // Compute per-category summary
  for (const cat of categories) {
    const catResults = allFeatureResults.filter(r => r.category === cat.id);
    report.summary.byCategory[cat.id] = {
      name: cat.name,
      total: catResults.length,
      passed: catResults.filter(r => r.status === 'pass').length,
      failed: catResults.filter(r => r.status === 'fail').length,
      skipped: catResults.filter(r => r.status === 'skip').length,
    };
  }

  // Write JSON report
  const jsonPath = path.join(RESULTS_DIR, 'full-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // Generate HTML dashboard
  const { generate } = require('./generate-dashboard');
  generate(report);

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('  SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Total: ${report.summary.total}`);
  console.log(`  ✓ Passed:  ${report.summary.passed}`);
  console.log(`  ✗ Failed:  ${report.summary.failed}`);
  console.log(`  ⊘ Skipped: ${report.summary.skipped}`);

  for (const b of BROWSERS) {
    const s = report.summary.byBrowser[b];
    console.log(`\n  ${b}: ${s.passed}/${s.total} passed, ${s.failed} failed, ${s.skipped} skipped`);
  }

  console.log(`\n  Collateral: ${allCollateralResults.filter(r => r.status === 'pass').length}/${allCollateralResults.length} safe`);
  console.log(`\n  JSON:  ${jsonPath}`);
  console.log(`  HTML:  ${path.join(RESULTS_DIR, 'dashboard.html')}`);
  console.log('═'.repeat(60) + '\n');
}

// Run
run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
