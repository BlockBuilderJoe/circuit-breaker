const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, 'results');

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function ensureResultsDir() {
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

async function screenshot(page, filename) {
  ensureResultsDir();
  const filepath = path.join(RESULTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  return filename;
}

async function dismissCookieBanners(page) {
  const selectors = [
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
  ];

  for (const sel of selectors) {
    try {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        await wait(500);
      }
    } catch {}
  }
}

async function checkElementExists(page, selector) {
  try {
    const count = await page.evaluate((sel) => {
      // Handle comma-separated selectors individually
      const parts = sel.split(',').map(s => s.trim());
      let total = 0;
      for (const part of parts) {
        try { total += document.querySelectorAll(part).length; } catch {}
      }
      return total;
    }, selector);
    return count;
  } catch {
    return 0;
  }
}

async function injectHidingCSS(page, selector) {
  try {
    await page.evaluate((sel) => {
      const style = document.createElement('style');
      style.textContent = `${sel} { display: none !important; visibility: hidden !important; }`;
      document.head.appendChild(style);
    }, selector);
    return true;
  } catch {
    return false;
  }
}

async function checkElementHidden(page, selector) {
  try {
    return await page.evaluate((sel) => {
      const parts = sel.split(',').map(s => s.trim());
      let total = 0;
      let hidden = 0;
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
  } catch {
    return { total: 0, hidden: 0, allHidden: false };
  }
}

async function checkLoginWall(page) {
  const url = page.url();
  if (/\/(login|signin|sign-in|auth|accounts|sso)/i.test(url)) return true;

  // Only count VISIBLE password inputs — SPAs often embed hidden login forms in the DOM
  const hasVisibleLoginForm = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="password"], input[name="password"]');
    for (const input of inputs) {
      const style = getComputedStyle(input);
      const rect = input.getBoundingClientRect();
      if (style.display !== 'none' && style.visibility !== 'hidden' && rect.height > 0) {
        return true;
      }
    }
    return false;
  });
  return hasVisibleLoginForm;
}

function createResult(category, site, feature, overrides = {}) {
  return {
    category,
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
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function writeReport(results) {
  ensureResultsDir();
  const reportPath = path.join(RESULTS_DIR, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  // Print summary
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;

  console.log('\n' + '═'.repeat(60));
  console.log('FUSEBOX TEST REPORT');
  console.log('═'.repeat(60));

  for (const r of results) {
    const icon = r.status === 'pass' ? '✓' : r.status === 'fail' ? '✗' : '⊘';
    const detail = r.reason ? ` — ${r.reason}` : r.elementsFound > 0 ? ` — ${r.elementsFound} found, ${r.elementsHidden} hidden` : '';
    console.log(`  ${icon} ${r.siteName}/${r.featureName} (${r.type})${detail}`);
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`  TOTAL: ${results.length}  |  ✓ ${passed} passed  |  ✗ ${failed} failed  |  ⊘ ${skipped} skipped`);
  console.log('─'.repeat(60));
  console.log(`  Report: ${reportPath}`);
  console.log(`  Screenshots: ${RESULTS_DIR}/\n`);
}

module.exports = {
  wait,
  screenshot,
  dismissCookieBanners,
  checkElementExists,
  injectHidingCSS,
  checkElementHidden,
  checkLoginWall,
  createResult,
  writeReport,
  RESULTS_DIR,
};
