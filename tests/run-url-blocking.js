#!/usr/bin/env node

/**
 * Circuit Breaker — SPA URL Blocking Unit Tests
 *
 * Tests the content script's checkUrl() logic in isolation.
 * No browser needed — this extracts the matching logic and runs it against
 * every urlFilter rule in blocklists.js to verify:
 *
 *   1. Root-page rules (||domain/) only block the homepage, not all pages
 *   2. Path-based rules (/shop, /live) block the correct paths
 *   3. Domain-only rules (||store.steampowered.com) block all pages on that domain
 *   4. No rule accidentally blocks unrelated pages
 *
 * Usage:
 *   node run-url-blocking.js              # Run all tests
 *   node run-url-blocking.js --verbose    # Show all test details
 *   node run-url-blocking.js --json       # JSON output
 *
 * This test was created because urlFilter: '||tiktok.com/' was matching
 * every page on TikTok (pathname.includes('/') is always true).
 */

const fs = require('fs');
const path = require('path');

// ─── Load blocklists ──────────────────────────────────────

const blocklistPath = path.join(__dirname, '..', 'extension', 'data', 'blocklists.js');
let src = fs.readFileSync(blocklistPath, 'utf8');
src = src.replace('const categories', 'var categories');
eval(src);

// ─── Extract the checkUrl matching logic from content.js ──

/**
 * Simulates content.js checkUrl() matching logic.
 * Returns true if the rule would block a page at the given hostname + pathname.
 */
function wouldBlock(urlFilter, requestDomains, hostname, pathname) {
  hostname = hostname.replace('www.', '');

  // Domain match
  if (requestDomains && !requestDomains.some(d => hostname === d || hostname.endsWith('.' + d))) {
    return false;
  }

  // Path match (matches fixed content.js logic)
  const filterClean = urlFilter.replace(/^\|\|[^/]*/, '');

  if (filterClean) {
    if (filterClean === '/') {
      // Root-page rule — only match the homepage exactly
      if (pathname !== '/' && pathname !== '') return false;
    } else {
      if (!pathname.includes(filterClean)) return false;
    }
  } else if (!urlFilter.startsWith('||')) {
    if (!pathname.includes(urlFilter)) return false;
  }

  return true;
}

// ─── Collect all URL-type features from blocklists ────────

const urlFeatures = [];
categories.forEach(cat => {
  (cat.sites || []).forEach(site => {
    (site.features || []).forEach(feat => {
      if (feat.type === 'url' && feat.urlFilter) {
        urlFeatures.push({
          category: cat.id,
          site: site.id,
          siteDomains: site.domains,
          feature: feat.id,
          name: feat.name,
          urlFilter: feat.urlFilter,
          requestDomains: feat.requestDomains || null,
        });
      }
    });
  });
});

// ─── Test definitions ─────────────────────────────────────

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const jsonOutput = args.includes('--json');

let passed = 0;
let failed = 0;
const results = [];

function test(description, rule, hostname, pathname, expected) {
  const actual = wouldBlock(rule.urlFilter, rule.requestDomains, hostname, pathname);
  const ok = actual === expected;
  if (ok) passed++;
  else failed++;

  const result = {
    description,
    rule: `${rule.feature} (${rule.urlFilter})`,
    hostname,
    pathname,
    expected: expected ? 'BLOCK' : 'ALLOW',
    actual: actual ? 'BLOCK' : 'ALLOW',
    pass: ok,
  };
  results.push(result);

  if (!jsonOutput) {
    if (!ok) {
      console.log(`  ❌ FAIL: ${description}`);
      console.log(`     Rule: ${rule.feature} urlFilter=${rule.urlFilter} domains=${(rule.requestDomains || []).join(',')}`);
      console.log(`     Page: ${hostname}${pathname}`);
      console.log(`     Expected: ${expected ? 'BLOCK' : 'ALLOW'}, Got: ${actual ? 'BLOCK' : 'ALLOW'}`);
    } else if (verbose) {
      console.log(`  ✅ ${description}`);
    }
  }
}

// ─── Run tests ────────────────────────────────────────────

if (!jsonOutput) {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  Circuit Breaker — SPA URL Blocking Tests            ║');
  console.log('║  Testing content.js checkUrl() logic                 ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Found ${urlFeatures.length} URL-type features in blocklists.js`);
  console.log('');
}

// --- Test 1: Root-page rules (||domain/) must only block homepage ---

if (!jsonOutput) console.log('── Root-page rules (||domain/) ──');

const rootRules = urlFeatures.filter(f => {
  const clean = f.urlFilter.replace(/^\|\|[^/]*/, '');
  return clean === '/';
});

rootRules.forEach(rule => {
  const domain = (rule.requestDomains || rule.siteDomains)?.[0] || 'example.com';

  test(`${rule.name}: blocks homepage`, rule, domain, '/', true);
  test(`${rule.name}: does NOT block /video/123`, rule, domain, '/video/123', false);
  test(`${rule.name}: does NOT block /settings`, rule, domain, '/settings', false);
  test(`${rule.name}: does NOT block /about`, rule, domain, '/about', false);
  test(`${rule.name}: does NOT block /@user`, rule, domain, '/@user', false);
});

if (!jsonOutput) console.log('');

// --- Test 2: Path-based rules must only block matching paths ---

if (!jsonOutput) console.log('── Path-based rules (/path) ──');

const pathRules = urlFeatures.filter(f => {
  const clean = f.urlFilter.replace(/^\|\|[^/]*/, '');
  return clean && clean !== '/';
});

pathRules.forEach(rule => {
  const domain = (rule.requestDomains || rule.siteDomains)?.[0] || 'example.com';
  const filterClean = rule.urlFilter.replace(/^\|\|[^/]*/, '');

  test(`${rule.name}: blocks ${filterClean} path`, rule, domain, filterClean, true);
  test(`${rule.name}: blocks ${filterClean}/subpage`, rule, domain, filterClean + '/subpage', true);
  test(`${rule.name}: does NOT block homepage`, rule, domain, '/', false);

  // Make sure it doesn't block unrelated paths
  const unrelatedPath = filterClean.includes('shop') ? '/settings' : '/about';
  test(`${rule.name}: does NOT block ${unrelatedPath}`, rule, domain, unrelatedPath, false);
});

if (!jsonOutput) console.log('');

// --- Test 3: Domain-only rules (||subdomain) block all pages ---

if (!jsonOutput) console.log('── Domain-only rules (||subdomain) ──');

const domainOnlyRules = urlFeatures.filter(f => {
  const clean = f.urlFilter.replace(/^\|\|[^/]*/, '');
  return clean === '' && f.urlFilter.startsWith('||');
});

domainOnlyRules.forEach(rule => {
  const domain = (rule.requestDomains || rule.siteDomains)?.[0] || 'example.com';

  test(`${rule.name}: blocks homepage on ${domain}`, rule, domain, '/', true);
  test(`${rule.name}: blocks /any/path on ${domain}`, rule, domain, '/any/path', true);
});

if (!jsonOutput) console.log('');

// --- Test 4: Domain scoping — rules don't block wrong domains ---

if (!jsonOutput) console.log('── Domain scoping (no cross-site blocking) ──');

urlFeatures.forEach(rule => {
  if (rule.requestDomains && rule.requestDomains.length > 0) {
    test(`${rule.name}: does NOT block unrelated domain`, rule, 'unrelated-site.com', '/', false);
  }
});

if (!jsonOutput) console.log('');

// --- Test 5: Specific regression tests ---

if (!jsonOutput) console.log('── Regression tests ──');

const ttFyp = urlFeatures.find(f => f.feature === 'tt-fyp');
if (ttFyp) {
  test('TikTok FYP: blocks tiktok.com/', ttFyp, 'tiktok.com', '/', true);
  test('TikTok FYP: does NOT block tiktok.com/live', ttFyp, 'tiktok.com', '/live', false);
  test('TikTok FYP: does NOT block tiktok.com/@user', ttFyp, 'tiktok.com', '/@user', false);
  test('TikTok FYP: does NOT block tiktok.com/video/123', ttFyp, 'tiktok.com', '/video/123', false);
  test('TikTok FYP: does NOT block tiktok.com/shop', ttFyp, 'tiktok.com', '/shop', false);
}

const pnHome = urlFeatures.find(f => f.feature === 'pn-home');
if (pnHome) {
  test('Pinterest Home: blocks pinterest.com/', pnHome, 'pinterest.com', '/', true);
  test('Pinterest Home: does NOT block pinterest.com/pin/123', pnHome, 'pinterest.com', '/pin/123', false);
  test('Pinterest Home: does NOT block pinterest.com/search', pnHome, 'pinterest.com', '/search', false);
}

const ttLive = urlFeatures.find(f => f.feature === 'tt-live');
if (ttLive) {
  test('TikTok Live: blocks /live', ttLive, 'tiktok.com', '/live', true);
  test('TikTok Live: blocks /live/user', ttLive, 'tiktok.com', '/live/user', true);
  test('TikTok Live: does NOT block /', ttLive, 'tiktok.com', '/', false);
  test('TikTok Live: does NOT block /video/123', ttLive, 'tiktok.com', '/video/123', false);
}

const stStore = urlFeatures.find(f => f.feature === 'st-store');
if (stStore) {
  test('Steam Store: blocks all pages on store.steampowered.com', stStore, 'store.steampowered.com', '/', true);
  test('Steam Store: blocks /app/730', stStore, 'store.steampowered.com', '/app/730', true);
  test('Steam Store: does NOT block steamcommunity.com', stStore, 'steamcommunity.com', '/', false);
}

if (!jsonOutput) console.log('');

// ─── Summary ──────────────────────────────────────────────

if (jsonOutput) {
  const output = {
    timestamp: new Date().toISOString(),
    totalFeatures: urlFeatures.length,
    totalTests: passed + failed,
    passed,
    failed,
    results: results.filter(r => !r.pass || verbose),
  };
  // Save to results directory
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(path.join(resultsDir, 'url-blocking.json'), JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} else {
  console.log('════════════════════════════════════════════════════════');
  console.log(`  Total: ${passed + failed}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}`);
  console.log('════════════════════════════════════════════════════════');

  if (failed > 0) {
    console.log('\n⚠️  Some URL blocking tests failed! Check output above.\n');
    process.exit(1);
  } else {
    console.log('\n🎉 All URL blocking tests passed!\n');
  }
}
