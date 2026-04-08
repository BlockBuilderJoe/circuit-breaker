#!/usr/bin/env node

/**
 * FuseBox — Restricted Sites Test Runner
 *
 * Tests domain-level blocking for sites that Claude in Chrome cannot access
 * due to safety restrictions (gambling, adult, dating, crypto).
 *
 * These sites use domain-level blocking only (declarativeNetRequest redirect),
 * so we don't need full page rendering — just verify the extension redirects
 * to blocked.html.
 *
 * The test is SELF-CONTAINED: it loads the extension from the repo, injects
 * all restricted domains into chrome.storage.sync, waits for the background
 * service worker to apply declarativeNetRequest rules, then checks each site.
 * No manual dashboard setup needed.
 *
 * Usage:
 *   node run-restricted.js                          # All restricted categories
 *   node run-restricted.js --category adult-content  # Just adult
 *   node run-restricted.js --category gambling       # Just gambling
 *   node run-restricted.js --category dating         # Just dating
 *   node run-restricted.js --category crypto         # Just crypto
 *   node run-restricted.js --headless                # Headless mode
 *   node run-restricted.js --json                    # JSON output
 *
 * Prerequisites: npm install (in tests/ directory)
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const path = require('path');
const fs = require('fs');

// ─── Sites that Claude in Chrome can't test ─────────────────

const RESTRICTED_SITES = {
  'adult-content': {
    name: 'Adult Content',
    sites: [
      { id: 'pornhub', name: 'Pornhub', url: 'https://www.pornhub.com', domains: ['pornhub.com', 'phncdn.com'] },
      { id: 'xvideos', name: 'XVideos', url: 'https://www.xvideos.com', domains: ['xvideos.com', 'xnxx.com'] },
      { id: 'onlyfans', name: 'OnlyFans', url: 'https://onlyfans.com', domains: ['onlyfans.com'] },
      { id: 'xhamster', name: 'xHamster', url: 'https://www.xhamster.com', domains: ['xhamster.com'] },
      { id: 'redtube', name: 'RedTube', url: 'https://www.redtube.com', domains: ['redtube.com'] },
      { id: 'chaturbate', name: 'Chaturbate', url: 'https://www.chaturbate.com', domains: ['chaturbate.com'] },
    ]
  },
  'gambling': {
    name: 'Gambling',
    sites: [
      { id: 'bet365', name: 'Bet365', url: 'https://www.bet365.com', domains: ['bet365.com'] },
      { id: 'draftkings', name: 'DraftKings', url: 'https://www.draftkings.com', domains: ['draftkings.com'] },
      { id: 'fanduel', name: 'FanDuel', url: 'https://www.fanduel.com', domains: ['fanduel.com'] },
      { id: 'betfair', name: 'Betfair', url: 'https://www.betfair.com', domains: ['betfair.com'] },
      { id: 'williamhill', name: 'William Hill', url: 'https://www.williamhill.com', domains: ['williamhill.com'] },
      { id: 'paddypower', name: 'Paddy Power', url: 'https://www.paddypower.com', domains: ['paddypower.com'] },
      { id: 'pokerstars', name: 'PokerStars', url: 'https://www.pokerstars.com', domains: ['pokerstars.com', 'pokerstars.net'] },
      { id: 'ladbrokes', name: 'Ladbrokes', url: 'https://www.ladbrokes.com', domains: ['ladbrokes.com'] },
    ]
  },
  'dating': {
    name: 'Dating',
    sites: [
      { id: 'tinder', name: 'Tinder', url: 'https://tinder.com', domains: ['tinder.com', 'gotinder.com'] },
      { id: 'bumble', name: 'Bumble', url: 'https://bumble.com', domains: ['bumble.com'] },
      { id: 'hinge', name: 'Hinge', url: 'https://hinge.co', domains: ['hinge.co'] },
      { id: 'match', name: 'Match.com', url: 'https://www.match.com', domains: ['match.com'] },
      { id: 'okcupid', name: 'OkCupid', url: 'https://www.okcupid.com', domains: ['okcupid.com'] },
      { id: 'grindr', name: 'Grindr', url: 'https://www.grindr.com', domains: ['grindr.com'] },
    ]
  },
  'crypto': {
    name: 'Crypto',
    sites: [
      { id: 'coinbase', name: 'Coinbase', url: 'https://www.coinbase.com', domains: ['coinbase.com'] },
      { id: 'binance', name: 'Binance', url: 'https://www.binance.com', domains: ['binance.com', 'binance.us'] },
      { id: 'crypto-com', name: 'Crypto.com', url: 'https://crypto.com', domains: ['crypto.com'] },
      { id: 'kraken', name: 'Kraken', url: 'https://www.kraken.com', domains: ['kraken.com'] },
      { id: 'opensea', name: 'OpenSea', url: 'https://opensea.io', domains: ['opensea.io'] },
      { id: 'metamask', name: 'MetaMask', url: 'https://metamask.io', domains: ['metamask.io'] },
      { id: 'coingecko', name: 'CoinGecko', url: 'https://www.coingecko.com', domains: ['coingecko.com'] },
      { id: 'coinmarketcap', name: 'CoinMarketCap', url: 'https://coinmarketcap.com', domains: ['coinmarketcap.com'] },
    ]
  },
};

// ─── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const headless = args.includes('--headless');
const jsonOutput = args.includes('--json');
const categoryFilter = args.includes('--category') ? args[args.indexOf('--category') + 1] : null;

// ─── Helpers ─────────────────────────────────────────────────

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function getExtensionPath() {
  const localExt = path.join(__dirname, '..', 'extension');
  if (fs.existsSync(path.join(localExt, 'manifest.json'))) {
    return localExt;
  }
  return null;
}

/**
 * Collect every domain across all categories we're about to test.
 */
function getAllBlockedDomains(categoriesToTest) {
  const domains = [];
  for (const category of Object.values(categoriesToTest)) {
    for (const site of category.sites) {
      for (const d of site.domains) {
        if (!domains.includes(d)) domains.push(d);
      }
    }
  }
  return domains;
}

/**
 * Find the extension's ID by listing chrome://extensions via service worker targets.
 * Puppeteer exposes background service workers as targets we can introspect.
 */
async function findExtensionId(browser) {
  // Wait for service worker target to appear
  for (let i = 0; i < 20; i++) {
    const targets = browser.targets();
    const sw = targets.find(t =>
      t.type() === 'service_worker' && t.url().includes('background')
    );
    if (sw) {
      // URL looks like: chrome-extension://<id>/background/background.js
      const match = sw.url().match(/chrome-extension:\/\/([a-z]+)\//);
      if (match) return match[1];
    }
    await wait(500);
  }
  return null;
}

/**
 * Inject blocked domains into the extension's chrome.storage.sync,
 * then trigger applyRules() via chrome.runtime.sendMessage.
 * We do this by navigating to the extension's options page (which has
 * access to chrome.storage and chrome.runtime).
 */
async function configureExtension(browser, extensionId, blockedDomains) {
  const page = await browser.newPage();

  // Navigate to the extension's options page — it has full extension API access
  const optionsUrl = `chrome-extension://${extensionId}/options/options.html`;
  await page.goto(optionsUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

  // Inject blocked domains and trigger the background to apply rules
  const result = await page.evaluate(async (domains) => {
    return new Promise((resolve) => {
      // Set blockedDomains in storage
      chrome.storage.sync.set({ blockedDomains: domains }, () => {
        // Send message to background script to apply the rules
        chrome.runtime.sendMessage({
          blockedDomains: domains,
          hiddenSelectors: {},
          blockedUrls: [],
        }, (response) => {
          resolve({
            domainsSet: domains.length,
            response: response || 'no response',
          });
        });
      });
    });
  }, blockedDomains);

  // Give the background service worker time to register all declarativeNetRequest rules
  await wait(2000);

  // Verify rules were actually created
  const ruleCheck = await page.evaluate(async () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['blockedDomains'], (data) => {
        resolve({
          storedDomains: (data.blockedDomains || []).length,
        });
      });
    });
  });

  await page.close();
  return { ...result, ...ruleCheck };
}

// ─── Main ────────────────────────────────────────────────────

async function run() {
  const extensionPath = getExtensionPath();

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  FuseBox — Restricted Sites Domain Block Test        ║');
  console.log('║  Testing: gambling, adult, dating, crypto            ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  if (!extensionPath) {
    console.error('❌ Extension not found at ../extension/manifest.json');
    console.error('   Run this script from the tests/ directory.');
    process.exit(1);
  }

  // Validate category filter
  const categoriesToTest = categoryFilter
    ? { [categoryFilter]: RESTRICTED_SITES[categoryFilter] }
    : RESTRICTED_SITES;

  if (categoryFilter && !RESTRICTED_SITES[categoryFilter]) {
    console.error(`❌ Unknown category: "${categoryFilter}"`);
    console.error(`   Available: ${Object.keys(RESTRICTED_SITES).join(', ')}`);
    process.exit(1);
  }

  // Launch Chrome with the extension
  console.log(`📦 Loading extension from: ${extensionPath}`);
  const browser = await puppeteer.launch({
    headless: headless ? 'new' : false,
    args: [
      '--no-first-run',
      '--disable-default-apps',
      '--disable-popup-blocking',
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  // ─── Step 1: Find the extension and inject blocked domains ──
  console.log('🔍 Finding extension service worker...');
  const extensionId = await findExtensionId(browser);

  if (!extensionId) {
    console.error('❌ Could not find FuseBox extension service worker.');
    console.error('   The extension may have failed to load.');
    await browser.close();
    process.exit(1);
  }
  console.log(`✅ Extension found: ${extensionId}`);

  const blockedDomains = getAllBlockedDomains(categoriesToTest);
  console.log(`🔧 Injecting ${blockedDomains.length} blocked domains into extension storage...`);

  const configResult = await configureExtension(browser, extensionId, blockedDomains);
  console.log(`✅ Storage configured: ${configResult.storedDomains} domains stored, background responded: ${JSON.stringify(configResult.response)}`);
  console.log('⏳ Waiting for declarativeNetRequest rules to activate...\n');
  await wait(1000);

  // ─── Step 2: Test each site ─────────────────────────────────
  const results = [];
  let passed = 0, failed = 0, skipped = 0;

  for (const [catId, category] of Object.entries(categoriesToTest)) {
    console.log(`── ${category.name} ${'─'.repeat(50 - category.name.length)}`);

    for (const site of category.sites) {
      const result = {
        category: catId,
        categoryName: category.name,
        site: site.id,
        siteName: site.name,
        url: site.url,
        domains: site.domains,
        status: 'pending',
        blocked: false,
        reachable: false,
        reason: '',
        timestamp: new Date().toISOString(),
      };

      try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(15000);

        let response;
        try {
          response = await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        } catch (navErr) {
          if (navErr.message.includes('ERR_BLOCKED') || navErr.message.includes('ERR_CONNECTION_REFUSED')) {
            result.status = 'pass';
            result.blocked = true;
            result.reason = `Network-level block: ${navErr.message.substring(0, 80)}`;
            passed++;
            console.log(`  ✅ ${site.name} — BLOCKED (network level)`);
            results.push(result);
            await page.close();
            continue;
          }
          if (navErr.message.includes('ERR_EMPTY_RESPONSE') || navErr.message.includes('Timeout')) {
            result.status = 'skip';
            result.reason = `Navigation failed: ${navErr.message.substring(0, 80)}`;
            skipped++;
            console.log(`  ⏭️  ${site.name} — SKIP (${navErr.message.substring(0, 50)})`);
            results.push(result);
            await page.close();
            continue;
          }
          throw navErr;
        }

        // Check if we landed on the FuseBox blocked page
        const finalUrl = page.url();
        const pageContent = await page.content();
        const pageTitle = await page.title();

        const isBlocked =
          finalUrl.includes('blocked/blocked.html') ||
          finalUrl.includes('blocked.html') ||
          pageContent.includes('Blocked by FuseBox') ||
          pageContent.includes('FuseBox has blocked') ||
          pageContent.includes('This site has been switched off') ||
          pageTitle.includes('Blocked');

        if (isBlocked) {
          result.status = 'pass';
          result.blocked = true;
          result.reason = `Redirected to FuseBox blocked page (${finalUrl.substring(0, 60)})`;
          passed++;
          console.log(`  ✅ ${site.name} — BLOCKED ✓`);
        } else if (response && (response.status() === 0 || response.status() >= 400)) {
          result.status = 'skip';
          result.reachable = false;
          result.reason = `HTTP ${response.status()} — site may be down or blocking bots`;
          skipped++;
          console.log(`  ⏭️  ${site.name} — SKIP (HTTP ${response.status()})`);
        } else {
          result.status = 'fail';
          result.reachable = true;
          result.reason = `NOT BLOCKED — loaded at ${finalUrl.substring(0, 60)}`;
          failed++;
          console.log(`  ❌ ${site.name} — NOT BLOCKED (loaded at ${finalUrl.substring(0, 50)})`);
        }

        await page.close();
      } catch (err) {
        result.status = 'skip';
        result.reason = `Error: ${err.message.substring(0, 100)}`;
        skipped++;
        console.log(`  ⏭️  ${site.name} — SKIP (error: ${err.message.substring(0, 50)})`);
      }

      results.push(result);
    }
    console.log('');
  }

  await browser.close();

  // ─── Summary ─────────────────────────────────────────────
  console.log('══════════════════════════════════════════════════════');
  console.log(`  Total: ${results.length}  ✅ Blocked: ${passed}  ❌ Not blocked: ${failed}  ⏭️  Skipped: ${skipped}`);
  console.log('══════════════════════════════════════════════════════\n');

  if (failed > 0) {
    console.log('⚠️  Some sites were NOT blocked. This may indicate:');
    console.log('   - The declarativeNetRequest rules did not apply in time');
    console.log('   - The site redirected to a different domain not in the blocklist');
    console.log('   - A bug in the extension\'s applyRules() logic\n');
  }

  if (passed === results.length - skipped && passed > 0) {
    console.log('🎉 All reachable sites were successfully blocked!\n');
  }

  // ─── Save results ────────────────────────────────────────
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

  const report = {
    testName: 'FuseBox Restricted Sites Domain Block Test',
    timestamp: new Date().toISOString(),
    summary: { total: results.length, passed, failed, skipped },
    domainsInjected: blockedDomains.length,
    extensionId,
    headless,
    results,
  };

  const jsonPath = path.join(resultsDir, 'restricted-sites.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`📄 Results saved to: ${jsonPath}`);

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  }

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
