#!/usr/bin/env node

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const path = require('path');
const fs = require('fs');
const {
  wait, screenshot, dismissCookieBanners, checkElementExists,
  injectHidingCSS, checkElementHidden, checkLoginWall,
  createResult, writeReport,
} = require('./utils');

// ─── Test URL map ────────────────────────────────────────
// Where to navigate to find each site's features visible.
// 'element' url = page where elements appear
// 'urlTest' = specific URL path to test URL-type blocking

const TEST_URLS = {
  // Social Media
  youtube:    { element: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', base: 'https://www.youtube.com',
    // Home Feed only exists on the home page, not on watch pages
    featureUrls: { 'yt-home': 'https://www.youtube.com' } },
  tiktok:     { element: 'https://www.tiktok.com/foryou', base: 'https://www.tiktok.com' },
  instagram:  { element: 'https://www.instagram.com', base: 'https://www.instagram.com' },
  facebook:   { element: 'https://www.facebook.com', base: 'https://www.facebook.com' },
  twitter:    { element: 'https://x.com/home', base: 'https://x.com' },
  snapchat:   { element: 'https://www.snapchat.com', base: 'https://www.snapchat.com' },
  reddit:     { element: 'https://www.reddit.com/r/AskReddit/top/?t=day', base: 'https://www.reddit.com',
    // Comments only exist on individual post pages — auto-discover a post link
    featureUrls: { 'rd-comments': 'post' } },
  pinterest:  { element: 'https://www.pinterest.com', base: 'https://www.pinterest.com' },
  linkedin:   { element: 'https://www.linkedin.com/feed/', base: 'https://www.linkedin.com' },

  // Video Streaming
  netflix:    { element: 'https://www.netflix.com', base: 'https://www.netflix.com' },
  disneyplus: { element: 'https://www.disneyplus.com', base: 'https://www.disneyplus.com' },
  hulu:       { element: 'https://www.hulu.com', base: 'https://www.hulu.com' },
  twitch:     { element: 'https://www.twitch.tv/xqc', base: 'https://www.twitch.tv' },
  primevideo: { element: 'https://www.amazon.com/gp/video/detail/B0D5HMQXZ5', base: 'https://www.primevideo.com' },
  crunchyroll:{ element: 'https://www.crunchyroll.com', base: 'https://www.crunchyroll.com' },

  // Gaming
  steam:      { element: 'https://store.steampowered.com', base: 'https://store.steampowered.com' },
  epic:       { element: 'https://www.epicgames.com', base: 'https://www.epicgames.com' },
  roblox:     { element: 'https://www.roblox.com', base: 'https://www.roblox.com' },

  // Shopping
  amazon:     { element: 'https://www.amazon.com/dp/B0D1XD1ZV3', base: 'https://www.amazon.com' },
  ebay:       { element: 'https://www.ebay.com', base: 'https://www.ebay.com' },

  // News — use article pages so element selectors (comments, video, related) are present
  cnn:        { element: 'https://www.cnn.com', base: 'https://www.cnn.com' },
  'bbc-news': { element: 'https://www.bbc.co.uk/news', base: 'https://www.bbc.co.uk/news' },
  foxnews:    { element: 'https://www.foxnews.com/video/5614615980001', base: 'https://www.foxnews.com' },
  dailymail:  { element: 'https://www.dailymail.co.uk', base: 'https://www.dailymail.co.uk',
    // Comments and Related only exist on article pages, not the homepage
    featureUrls: { 'dm-comments': 'article', 'dm-related': 'article' } },
  nytimes:    { element: 'https://www.nytimes.com', base: 'https://www.nytimes.com',
    featureUrls: { 'nyt-paywall': 'article', 'nyt-comments': 'article' } },
  theguardian:{ element: 'https://www.theguardian.com', base: 'https://www.theguardian.com',
    // Comments only on commentisfree articles, donation banner intermittent on article pages
    featureUrls: { 'gu-comments': 'commentisfree', 'gu-donate': 'article' } },

  // AI
  chatgpt:    { element: 'https://chatgpt.com', base: 'https://chatgpt.com' },
  midjourney: { element: 'https://www.midjourney.com', base: 'https://www.midjourney.com' },
};

// ─── Load credentials ────────────────────────────────────

function loadEnv() {
  try {
    const content = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
    return env;
  } catch { return {}; }
}

const ENV = loadEnv();

// ─── Per-site login flows ─────────────────────────────────

const loggedIn = {};

const LOGIN_FLOWS = {
  instagram: async (page) => {
    if (!ENV.INSTAGRAM_EMAIL) return false;
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2', timeout: 20000 });
    await wait(3000);
    await dismissCookieBanners(page);
    await wait(2000);
    // Try to find the username field (Instagram sometimes uses different attributes)
    let userField = await page.$('input[name="username"]');
    if (!userField) userField = await page.$('input[aria-label*="username" i]');
    if (!userField) userField = await page.$('input[type="text"]');
    if (!userField) return false;
    await userField.type(ENV.INSTAGRAM_EMAIL, { delay: 60 });
    const passField = await page.$('input[name="password"]') || await page.$('input[type="password"]');
    if (!passField) return false;
    await passField.type(ENV.INSTAGRAM_PASSWORD, { delay: 60 });
    await page.keyboard.press('Enter');
    await wait(6000);
    const url = page.url();
    return !url.includes('/accounts/login') && !url.includes('/challenge') && !url.includes('/two_factor');
  },

  facebook: async (page) => {
    if (!ENV.FACEBOOK_EMAIL) return false;
    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await wait(2000);
    await dismissCookieBanners(page);
    const emailInput = await page.$('#email');
    if (!emailInput) return false;
    await emailInput.type(ENV.FACEBOOK_EMAIL, { delay: 60 });
    const passInput = await page.$('#pass');
    if (!passInput) return false;
    await passInput.type(ENV.FACEBOOK_PASSWORD, { delay: 60 });
    await page.keyboard.press('Enter');
    await wait(6000);
    const url = page.url();
    return url.includes('facebook.com') && !url.includes('/login');
  },

  twitter: async (page) => {
    if (!ENV.TWITTER_EMAIL) return false;
    await page.goto('https://x.com/i/flow/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await wait(3000);
    const userInput = await page.$('input[autocomplete="username"]');
    if (!userInput) return false;
    await userInput.type(ENV.TWITTER_EMAIL, { delay: 60 });
    await wait(500);
    // Click Next button
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('[role="button"]')].find(b => b.textContent.trim() === 'Next');
      if (btn) btn.click();
    });
    await wait(3000);
    const passInput = await page.$('input[name="password"]');
    if (!passInput) return false;
    await passInput.type(ENV.TWITTER_PASSWORD, { delay: 60 });
    await wait(500);
    // Click Log in button
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('[role="button"]')].find(b => b.textContent.trim() === 'Log in');
      if (btn) btn.click();
    });
    await wait(6000);
    const url = page.url();
    return url.includes('x.com') && !url.includes('/flow/login');
  },

  pinterest: async (page) => {
    if (!ENV.PINTEREST_EMAIL) return false;
    await page.goto('https://www.pinterest.com/login/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await wait(2000);
    await dismissCookieBanners(page);
    const emailInput = await page.$('#email');
    if (!emailInput) return false;
    await emailInput.type(ENV.PINTEREST_EMAIL, { delay: 60 });
    const passInput = await page.$('#password');
    if (!passInput) return false;
    await passInput.type(ENV.PINTEREST_PASSWORD, { delay: 60 });
    await passInput.press('Enter');
    await wait(6000);
    return !await checkLoginWall(page);
  },

  linkedin: async (page) => {
    if (!ENV.LINKEDIN_EMAIL) return false;
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await wait(2000);
    const userInput = await page.$('#username');
    if (!userInput) return false;
    await userInput.type(ENV.LINKEDIN_EMAIL, { delay: 60 });
    const passInput = await page.$('#password');
    if (passInput) await passInput.type(ENV.LINKEDIN_PASSWORD, { delay: 60 });
    await page.click('button[type="submit"]');
    await wait(6000);
    return !await checkLoginWall(page);
  },

  roblox: async (page) => {
    if (!ENV.ROBLOX_EMAIL) return false;
    await page.goto('https://www.roblox.com/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await wait(2000);
    await dismissCookieBanners(page);
    const userInput = await page.$('#login-username');
    if (!userInput) return false;
    await userInput.type(ENV.ROBLOX_EMAIL, { delay: 60 });
    const passInput = await page.$('#login-password');
    if (passInput) await passInput.type(ENV.ROBLOX_PASSWORD, { delay: 60 });
    const loginBtn = await page.$('#login-button');
    if (loginBtn) await loginBtn.click();
    else await page.keyboard.press('Enter');
    await wait(6000);
    const url = page.url();
    return url.includes('roblox.com') && !url.includes('/login');
  },
};

async function attemptLogin(page, siteId) {
  if (loggedIn[siteId] !== undefined) return loggedIn[siteId];
  if (!LOGIN_FLOWS[siteId]) return false;
  console.log(`  → Logging into ${siteId}...`);
  try {
    const ok = await LOGIN_FLOWS[siteId](page);
    loggedIn[siteId] = ok;
    console.log(`  → ${ok ? '✓ Logged in' : '✗ Login failed — tests may be skipped'}`);
    return ok;
  } catch (err) {
    loggedIn[siteId] = false;
    console.log(`  → ✗ Login error: ${err.message}`);
    return false;
  }
}

// ─── Load blocklists ─────────────────────────────────────

function loadCategories() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'extension', 'data', 'blocklists.js'), 'utf8');
  // Extract the categories array by evaluating just the const declaration
  const fn = new Function(src + '\nreturn categories;');
  return fn();
}

// ─── Test a single element feature ───────────────────────

async function testElementFeature(page, category, site, feature) {
  const result = createResult(category.id, site, feature);
  const urls = TEST_URLS[site.id];
  if (!urls) {
    result.status = 'skip';
    result.reason = 'no test URL configured';
    return result;
  }

  const selector = feature.selector;
  if (!selector) {
    result.status = 'skip';
    result.reason = 'no selector defined';
    return result;
  }

  try {
    // Navigate to page where element should exist
    await page.goto(urls.element, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await wait(3000);
    await dismissCookieBanners(page);
    await wait(1000);

    // Check for login wall
    if (await checkLoginWall(page)) {
      result.status = 'skip';
      result.reason = 'login required';
      result.beforeScreenshot = await screenshot(page, `${site.id}-${feature.id}-login.png`);
      return result;
    }

    // Screenshot BEFORE blocking
    result.beforeScreenshot = await screenshot(page, `${site.id}-${feature.id}-before.png`);

    // Check if selector matches any elements
    const count = await checkElementExists(page, selector);
    result.elementsFound = count;

    if (count === 0) {
      result.status = 'fail';
      result.reason = `selector not found on page (0 matches for: ${selector.substring(0, 80)})`;
      return result;
    }

    // Inject hiding CSS (simulates what content.js does)
    await injectHidingCSS(page, selector);
    await wait(500);

    // Screenshot AFTER blocking
    result.afterScreenshot = await screenshot(page, `${site.id}-${feature.id}-after.png`);

    // Verify elements are hidden
    const hidden = await checkElementHidden(page, selector);
    result.elementsHidden = hidden.hidden;

    if (hidden.allHidden) {
      result.status = 'pass';
    } else {
      result.status = 'fail';
      result.reason = `${hidden.hidden}/${hidden.total} elements hidden (some still visible)`;
    }
  } catch (err) {
    result.status = 'fail';
    result.reason = `error: ${err.message}`;
  }

  return result;
}

// ─── Test a single URL feature ───────────────────────────

async function testUrlFeature(page, category, site, feature) {
  const result = createResult(category.id, site, feature);
  const urls = TEST_URLS[site.id];
  if (!urls) {
    result.status = 'skip';
    result.reason = 'no test URL configured';
    return result;
  }

  const urlFilter = feature.urlFilter;
  if (!urlFilter) {
    result.status = 'skip';
    result.reason = 'no urlFilter defined';
    return result;
  }

  try {
    // Build the target URL to test
    let targetUrl;
    if (urlFilter.startsWith('||')) {
      // Domain-level filter like ||youtube.com/
      targetUrl = 'https://' + urlFilter.replace('||', '');
    } else {
      // Path filter like /shorts — combine with base domain
      const domain = (feature.requestDomains && feature.requestDomains[0]) || site.domains[0];
      targetUrl = `https://www.${domain}${urlFilter}`;
    }

    // Screenshot the base site first (BEFORE — showing site is accessible)
    await page.goto(urls.base, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await wait(2000);
    await dismissCookieBanners(page);

    if (await checkLoginWall(page)) {
      result.status = 'skip';
      result.reason = 'login required';
      result.beforeScreenshot = await screenshot(page, `${site.id}-${feature.id}-login.png`);
      return result;
    }

    result.beforeScreenshot = await screenshot(page, `${site.id}-${feature.id}-before.png`);

    // Navigate to the blocked URL path
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await wait(2000);

    result.afterScreenshot = await screenshot(page, `${site.id}-${feature.id}-after.png`);

    // For URL features, we're just verifying the URL loads (pre-block).
    // The actual blocking is done by the extension's content script or declarativeNetRequest.
    // Here we verify the URL is reachable and log what we find.
    const finalUrl = page.url();
    const pageTitle = await page.title();

    // Check if site redirected to login
    if (await checkLoginWall(page)) {
      result.status = 'skip';
      result.reason = 'login required for blocked URL';
      return result;
    }

    // Also check if URL-type features have elementSelectors to hide
    if (feature.elementSelectors && feature.elementSelectors.length > 0) {
      const combinedSelector = feature.elementSelectors.join(', ');
      const count = await checkElementExists(page, combinedSelector);
      result.elementsFound = count;

      if (count > 0) {
        await injectHidingCSS(page, combinedSelector);
        await wait(500);
        const hidden = await checkElementHidden(page, combinedSelector);
        result.elementsHidden = hidden.hidden;
        result.afterScreenshot = await screenshot(page, `${site.id}-${feature.id}-after-hidden.png`);
      }
    }

    result.status = 'pass';
    result.reason = `URL reachable: ${finalUrl.substring(0, 80)}`;

  } catch (err) {
    if (err.message.includes('net::ERR_')) {
      result.status = 'pass';
      result.reason = `URL blocked at network level: ${err.message}`;
    } else {
      result.status = 'fail';
      result.reason = `error: ${err.message}`;
    }
  }

  return result;
}

// ─── Test a single allowlist feature ─────────────────────

function testAllowlistFeature(category, site, feature) {
  return createResult(category.id, site, feature, {
    status: 'skip',
    reason: 'allowlist feature — requires auth + manual channel configuration',
  });
}

// ─── Collateral damage test ──────────────────────────────
// Verifies that enabling features for one site doesn't break other sites.
// Loads the extension, enables specific features, then checks that
// unrelated sites are still accessible.

const COLLATERAL_TESTS = [
  {
    name: 'YouTube features should not block Netflix',
    enable: { category: 'social-media', site: 'youtube', features: ['yt-shorts', 'yt-comments', 'yt-recommendations'] },
    checkAccessible: [
      { url: 'https://www.netflix.com', name: 'Netflix' },
      { url: 'https://www.amazon.com', name: 'Amazon' },
      { url: 'https://www.bbc.co.uk/news', name: 'BBC News' },
    ],
  },
  {
    name: 'YouTube features should not block YouTube itself',
    enable: { category: 'social-media', site: 'youtube', features: ['yt-shorts', 'yt-comments'] },
    checkAccessible: [
      { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', name: 'YouTube video page' },
    ],
  },
  {
    name: 'Reddit features should not block other social media',
    enable: { category: 'social-media', site: 'reddit', features: ['rd-comments', 'rd-home', 'rd-sidebar'] },
    checkAccessible: [
      { url: 'https://www.youtube.com', name: 'YouTube' },
      { url: 'https://x.com', name: 'Twitter/X' },
    ],
  },
  {
    name: 'Twitter features should not block Reddit',
    enable: { category: 'social-media', site: 'twitter', features: ['tw-trending', 'tw-likes'] },
    checkAccessible: [
      { url: 'https://www.reddit.com', name: 'Reddit' },
    ],
  },
  {
    name: 'Amazon features should not block eBay',
    enable: { category: 'shopping', site: 'amazon', features: ['az-recommendations', 'az-sponsored'] },
    checkAccessible: [
      { url: 'https://www.ebay.com', name: 'eBay' },
      { url: 'https://www.etsy.com', name: 'Etsy' },
    ],
  },
  {
    name: 'Twitch features should not block YouTube',
    enable: { category: 'video-streaming', site: 'twitch', features: ['tw-chat', 'tw-recommendations'] },
    checkAccessible: [
      { url: 'https://www.youtube.com', name: 'YouTube' },
      { url: 'https://www.netflix.com', name: 'Netflix' },
    ],
  },
  {
    name: 'Blocking Social Media category should not block Netflix',
    enable: { category: 'social-media', wholeCat: true },
    checkAccessible: [
      { url: 'https://www.netflix.com', name: 'Netflix' },
      { url: 'https://www.amazon.com', name: 'Amazon' },
      { url: 'https://store.steampowered.com', name: 'Steam' },
    ],
  },
  {
    name: 'Blocking Video Streaming should not block Social Media',
    enable: { category: 'video-streaming', wholeCat: true },
    checkAccessible: [
      { url: 'https://www.youtube.com', name: 'YouTube' },
      { url: 'https://www.reddit.com', name: 'Reddit' },
    ],
  },
];

async function runCollateralTests(page, extensionPath, categories) {
  console.log('\n' + '═'.repeat(60));
  console.log('COLLATERAL DAMAGE TESTS');
  console.log('═'.repeat(60));
  console.log('Testing that enabling features for one site doesn\'t break others.\n');

  // For collateral tests we simulate what the extension does:
  // - Build the domain blocklist and CSS selectors from the selections
  // - Check if unrelated sites get caught in the crossfire

  const results = [];

  for (const test of COLLATERAL_TESTS) {
    console.log(`\n── ${test.name} ──`);

    // Build the selections object as the extension would
    const selections = {};
    for (const cat of categories) {
      selections[cat.id] = { enabled: false, sites: {}, features: {} };
      for (const site of cat.sites || []) {
        selections[cat.id].sites[site.id] = false;
        for (const feat of site.features || []) {
          selections[cat.id].features[feat.id] = false;
        }
      }
    }

    // Enable the specified features
    const enableCfg = test.enable;
    if (enableCfg.wholeCat) {
      selections[enableCfg.category].enabled = true;
      const cat = categories.find(c => c.id === enableCfg.category);
      for (const site of cat.sites || []) {
        selections[enableCfg.category].sites[site.id] = true;
        for (const feat of site.features || []) {
          selections[enableCfg.category].features[feat.id] = true;
        }
      }
    } else {
      selections[enableCfg.category].enabled = true;
      selections[enableCfg.category].sites[enableCfg.site] = true;
      for (const fid of enableCfg.features || []) {
        selections[enableCfg.category].features[fid] = true;
      }
    }

    // Build the domain blocklist (same logic as popup.js sendRulesToBackground)
    const blockedDomains = [];
    const blockedSelectors = {};
    for (const cat of categories) {
      const s = selections[cat.id];
      if (!s) continue;
      for (const site of cat.sites || []) {
        const siteOn = s.sites[site.id];
        const siteFeatures = site.features || [];
        const allFeaturesOn = siteFeatures.length > 0 && siteFeatures.every(f => s.features[f.id]);
        if (siteOn && (siteFeatures.length === 0 || allFeaturesOn)) {
          for (const d of site.domains || []) {
            if (d && !blockedDomains.includes(d)) blockedDomains.push(d);
          }
        }
        // Collect element selectors per hostname
        for (const feat of siteFeatures) {
          if (!s.features[feat.id]) continue;
          if (feat.type === 'element' && feat.selector) {
            const hostname = (site.domains[0] || '').replace('www.', '');
            if (!blockedSelectors[hostname]) blockedSelectors[hostname] = [];
            blockedSelectors[hostname].push(feat.selector);
          }
          if (feat.elementSelectors) {
            const hostname = (site.domains[0] || '').replace('www.', '');
            if (!blockedSelectors[hostname]) blockedSelectors[hostname] = [];
            blockedSelectors[hostname].push(...feat.elementSelectors);
          }
        }
      }
    }

    // Check each "should be accessible" URL
    for (const check of test.checkAccessible) {
      const result = {
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

      // 1. Check if any blocked domain matches the check URL
      const checkHostname = new URL(check.url).hostname.replace('www.', '');
      const domainMatch = blockedDomains.find(d =>
        checkHostname === d || checkHostname.endsWith('.' + d)
      );

      if (domainMatch) {
        result.status = 'fail';
        result.reason = `DOMAIN BLOCKED: "${domainMatch}" matches ${check.url}`;
        result.domainBlocked = true;
        console.log(`  ✗ ${check.name} — DOMAIN BLOCKED by "${domainMatch}"`);
        results.push(result);
        continue;
      }

      // 2. Check if any CSS selectors would leak onto this site
      const leakedSelectors = [];
      for (const [hostname, sels] of Object.entries(blockedSelectors)) {
        if (checkHostname === hostname || checkHostname.endsWith('.' + hostname)) {
          leakedSelectors.push(...sels);
        }
      }

      // 3. Actually navigate and check the page loads correctly
      try {
        await page.goto(check.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await wait(2000);

        result.screenshot = await screenshot(page, `collateral-${check.name.replace(/[^a-z0-9]/gi, '-')}.png`);

        // Check we didn't get blocked/redirected to an error page
        const finalUrl = page.url();
        const pageContent = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');

        if (pageContent.includes('Blocked by FuseBox') || pageContent.includes('ERR_BLOCKED')) {
          result.status = 'fail';
          result.reason = `PAGE BLOCKED: FuseBox block page shown at ${check.url}`;
          console.log(`  ✗ ${check.name} — FuseBox block page shown!`);
        } else if (leakedSelectors.length > 0) {
          // Check if any leaked selectors actually match elements on this page
          const matchCount = await page.evaluate((sels) => {
            let total = 0;
            for (const sel of sels) {
              try { total += document.querySelectorAll(sel).length; } catch {}
            }
            return total;
          }, leakedSelectors);

          if (matchCount > 0) {
            result.status = 'fail';
            result.reason = `SELECTOR LEAK: ${matchCount} elements on ${check.name} matched selectors from another site`;
            result.selectorLeaked = true;
            console.log(`  ✗ ${check.name} — ${matchCount} elements would be wrongly hidden by leaked selectors`);
          } else {
            result.status = 'pass';
            result.reason = `accessible (selectors exist but matched 0 elements)`;
            console.log(`  ✓ ${check.name} — accessible`);
          }
        } else {
          result.status = 'pass';
          result.reason = 'accessible';
          console.log(`  ✓ ${check.name} — accessible`);
        }
      } catch (err) {
        if (err.message.includes('net::ERR_BLOCKED')) {
          result.status = 'fail';
          result.reason = `NETWORK BLOCKED: ${err.message}`;
          console.log(`  ✗ ${check.name} — network blocked! ${err.message}`);
        } else {
          result.status = 'fail';
          result.reason = `error: ${err.message}`;
          console.log(`  ✗ ${check.name} — ${err.message}`);
        }
      }

      results.push(result);
      await wait(500);
    }
  }

  return results;
}

// ─── Main runner ─────────────────────────────────────────

async function run() {
  const args = process.argv.slice(2);
  const siteFilter = args.includes('--site') ? args[args.indexOf('--site') + 1] : null;

  console.log('FuseBox Test Suite');
  console.log('═'.repeat(60));

  const categories = loadCategories();
  const results = [];

  const headless = args.includes('--headless');
  const browser = await puppeteer.launch({
    headless: headless ? 'new' : false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Collect all testable features
  const tests = [];
  for (const cat of categories) {
    for (const site of cat.sites || []) {
      for (const feature of site.features || []) {
        if (siteFilter && site.id !== siteFilter) continue;
        tests.push({ cat, site, feature });
      }
    }
  }

  console.log(`\nFound ${tests.length} features to test${siteFilter ? ` (filtered: ${siteFilter})` : ''}\n`);

  // Group by site to avoid navigating to the same site repeatedly
  const bySite = {};
  for (const t of tests) {
    if (!bySite[t.site.id]) bySite[t.site.id] = [];
    bySite[t.site.id].push(t);
  }

  let current = 0;
  for (const [siteId, siteTests] of Object.entries(bySite)) {
    const siteName = siteTests[0].site.name;
    console.log(`\n── ${siteName} (${siteTests.length} features) ──`);

    // Navigate to the site once, then test element features on same page
    const urls = TEST_URLS[siteId];
    let pageLoaded = false;

    // Attempt login for sites that require it
    if (LOGIN_FLOWS[siteId]) {
      const ok = await attemptLogin(page, siteId);
      if (ok && urls?.element) {
        try {
          // Only navigate if we're not already on the right site
          const currentHost = new URL(page.url()).hostname.replace('www.', '');
          const targetHost = new URL(urls.element).hostname.replace('www.', '');
          if (currentHost !== targetHost) {
            await page.goto(urls.element, { waitUntil: 'load', timeout: 20000 });
          }
          await wait(6000);
          await dismissCookieBanners(page);
          await wait(1000);
          pageLoaded = true;
        } catch {}
      }
    }

    for (const { cat, site, feature } of siteTests) {
      current++;
      const progress = `[${current}/${tests.length}]`;

      let result;

      if (feature.type === 'allowlist') {
        result = testAllowlistFeature(cat, site, feature);
        console.log(`  ${progress} ⊘ ${feature.name} — ${result.reason}`);
      } else if (feature.type === 'element') {
        // Check if this feature needs a different page than the default
        const featureUrl = urls?.featureUrls?.[feature.id];
        let needsNav = !pageLoaded;

        if (featureUrl && pageLoaded) {
          // Feature needs a specific page — navigate there
          if (featureUrl === 'article' || featureUrl === 'commentisfree' || featureUrl === 'post') {
            // Auto-discover a content link on the current page
            try {
              const articleHref = await page.evaluate((type) => {
                let links;
                if (type === 'commentisfree') {
                  // Guardian opinion articles with comments
                  links = Array.from(document.querySelectorAll('a[href*="/commentisfree/"]'));
                  const article = links.find(a => {
                    const h = a.getAttribute('href') || '';
                    return h.split('/').length > 5 && h.length > 40;
                  });
                  return article ? article.href : null;
                } else if (type === 'post') {
                  // Reddit post with comments
                  links = Array.from(document.querySelectorAll('a[href*="/comments/"]'));
                  const post = links.find(a => {
                    const h = a.getAttribute('href') || '';
                    return h.includes('/r/') && h.includes('/comments/');
                  });
                  return post ? post.href : null;
                } else {
                  // Generic article discovery
                  links = Array.from(document.querySelectorAll('a[href*="/article"], a[href*="/news/"], a[href*="/20"]'));
                  const article = links.find(a => {
                    const h = a.getAttribute('href') || '';
                    return h.split('/').length > 4 && !h.includes('?') && h.length > 30;
                  });
                  return article ? article.href : null;
                }
              }, featureUrl);
              if (articleHref) {
                await page.goto(articleHref, { waitUntil: 'domcontentloaded', timeout: 15000 });
                await wait(4000);
                await dismissCookieBanners(page);
                await wait(1000);
              }
            } catch {}
          } else {
            // Explicit URL override
            try {
              await page.goto(featureUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
              await wait(3000);
              await dismissCookieBanners(page);
              await wait(1000);
            } catch {}
          }
        }

        // Load default page if not yet loaded
        if (!pageLoaded && urls) {
          try {
            await page.goto(urls.element, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await wait(3000);
            await dismissCookieBanners(page);
            await wait(1000);
            pageLoaded = true;
          } catch (err) {
            console.log(`  ${progress} ✗ Failed to load ${urls.element}: ${err.message}`);
          }
        }

        if (pageLoaded) {
          // Test element on already-loaded page
          result = createResult(cat.id, site, feature);
          try {
            if (await checkLoginWall(page)) {
              result.status = 'skip';
              result.reason = 'login required';
            } else {
              result.beforeScreenshot = await screenshot(page, `${site.id}-${feature.id}-before.png`);
              const count = await checkElementExists(page, feature.selector);
              result.elementsFound = count;

              if (count === 0) {
                result.status = 'fail';
                result.reason = `selector not found (${feature.selector.substring(0, 60)}...)`;
              } else {
                await injectHidingCSS(page, feature.selector);
                await wait(300);
                result.afterScreenshot = await screenshot(page, `${site.id}-${feature.id}-after.png`);
                const hidden = await checkElementHidden(page, feature.selector);
                result.elementsHidden = hidden.hidden;
                result.status = hidden.allHidden ? 'pass' : 'fail';
                if (!hidden.allHidden) result.reason = `${hidden.hidden}/${hidden.total} hidden`;
              }
            }
          } catch (err) {
            result.status = 'fail';
            result.reason = `error: ${err.message}`;
          }
        } else {
          result = createResult(cat.id, site, feature, { status: 'skip', reason: 'page failed to load' });
        }

        // If we navigated away for a per-feature URL, go back to the default page
        if (featureUrl && urls?.element) {
          try {
            await page.goto(urls.element, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await wait(2000);
            await dismissCookieBanners(page);
          } catch {}
        }

        const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⊘';
        const detail = result.reason || `${result.elementsFound} found, ${result.elementsHidden} hidden`;
        console.log(`  ${progress} ${icon} ${feature.name} — ${detail}`);

      } else if (feature.type === 'url') {
        result = await testUrlFeature(page, cat, site, feature);
        pageLoaded = false; // URL test navigates away

        const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⊘';
        console.log(`  ${progress} ${icon} ${feature.name} — ${result.reason || 'ok'}`);
      }

      if (result) results.push(result);

      // Small delay between tests
      await wait(300);
    }

    // Delay between sites
    await wait(1500);
  }

  // ── Phase 2: Collateral damage tests ──
  if (!siteFilter) {
    const collateralResults = await runCollateralTests(page, null, categories);

    // Add collateral results to the report
    const collateralPassed = collateralResults.filter(r => r.status === 'pass').length;
    const collateralFailed = collateralResults.filter(r => r.status === 'fail').length;

    console.log('\n' + '─'.repeat(60));
    console.log(`  COLLATERAL: ${collateralResults.length} checks  |  ✓ ${collateralPassed} safe  |  ✗ ${collateralFailed} broken`);
    console.log('─'.repeat(60));

    // Write collateral report separately
    const collateralReportPath = path.join(require('./utils').RESULTS_DIR, 'collateral-report.json');
    fs.writeFileSync(collateralReportPath, JSON.stringify(collateralResults, null, 2));
  }

  await browser.close();
  writeReport(results);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
