#!/usr/bin/env node
/**
 * Cookie Banner Scanner — scans ~100 popular sites for cookie consent banners
 * Uses Playwright headless Chromium to visit each site and detect banners
 * via DOM inspection (checks for known selectors + text-based heuristics).
 *
 * Usage:
 *   node run-cookie-scan.js                  # Run full scan
 *   node run-cookie-scan.js --verbose        # Show each site as it's scanned
 *   node run-cookie-scan.js --json           # Output JSON results
 *   node run-cookie-scan.js --limit 20       # Only scan first N sites
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ── CLI flags ──
const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');
const JSON_OUTPUT = args.includes('--json');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;

// ── Known cookie consent selectors (from our COOKIE_CONSENT_CSS) ──
const KNOWN_SELECTORS = [
  '#onetrust-banner-sdk', '#onetrust-consent-sdk', '.onetrust-pc-dark-filter',
  '#CybotCookiebotDialog', '#CybotCookiebotDialogBodyUnderlay',
  '.cmp-container', '[id^="sp_message_container"]', '.sp_message_open', '#sp_message_overlay',
  '.fc-consent-root', '.fc-dialog-overlay',
  '#qc-cmp2-container', '.qc-cmp2-container',
  '#truste-consent-track', '.trustarc-banner',
  '#didomi-host', '.didomi-popup-container',
  '[class*="consent-banner"]', '[id*="consent-banner"]', '.js-consent-banner',
  '#usercentrics-root', '.iubenda-cs-container',
  '#cookiescript_injected', '[id*="cookie-law"]',
  '[class*="cookie-banner"]', '[id*="cookie-banner"]',
  '[class*="cookie-notice"]', '[id*="cookie-notice"]',
  '.cc-window', '.cc-banner',
  '#sp-cc-wrapper', '#cos-banner',
  '#gdpr-banner', '#gdpr-banner-container', '#gdpr-new-container',
  '[class*="_shein_privacy"]', '#gdpr-single-choice-overlay',
  'tiktok-cookie-banner', '#cookie-consent',
  '.osano-cm-window', '.evidon-consent-button',
  '[data-testid="cookie-policy-manage-dialog"]',
  '.almacmp-modalwrap', '#ppms_cm_popup_overlay',
  '.cmpboxBG', '#cmpbox', '#cmpbox2', '.cmp-root',
  '[id*="cookie-preferences"]', '[class*="cookie-consent"]', '[id*="cookieconsent"]',
  '[data-testid="consent-banner"]', '[data-testid="main-cookies-banner-container"]',
];

// ── ~105 popular sites to scan (diverse mix of categories) ──
const SITES = [
  // News (UK & international)
  'https://www.bbc.co.uk', 'https://www.theguardian.com', 'https://www.dailymail.co.uk',
  'https://www.telegraph.co.uk', 'https://www.independent.co.uk', 'https://www.mirror.co.uk',
  'https://www.express.co.uk', 'https://www.metro.co.uk', 'https://www.standard.co.uk',
  'https://www.theargus.co.uk', 'https://www.belfasttelegraph.co.uk',
  'https://edition.cnn.com', 'https://www.foxnews.com', 'https://www.reuters.com',
  'https://www.bbc.com', 'https://www.aljazeera.com', 'https://www.france24.com',
  'https://www.dw.com', 'https://www.washingtonpost.com', 'https://www.usatoday.com',
  'https://www.huffpost.com', 'https://www.buzzfeed.com', 'https://www.vice.com',
  'https://www.politico.com', 'https://www.theverge.com',

  // Shopping
  'https://www.amazon.co.uk', 'https://www.ebay.co.uk', 'https://www.aliexpress.com',
  'https://www.shein.co.uk', 'https://www.asos.com', 'https://www.etsy.com',
  'https://www.wish.com', 'https://www.argos.co.uk', 'https://www.currys.co.uk',
  'https://www.johnlewis.com', 'https://www.next.co.uk',
  'https://www.ikea.com/gb/', 'https://www.boots.com', 'https://www.wayfair.co.uk',
  'https://www.zara.com/uk/', 'https://www.hm.com/en_gb/',

  // Tech / Dev
  'https://www.github.com', 'https://stackoverflow.com', 'https://www.npmjs.com',
  'https://www.medium.com', 'https://www.dev.to', 'https://www.hackerrank.com',
  'https://www.atlassian.com', 'https://www.notion.so', 'https://www.figma.com',

  // Social / Communication
  'https://www.tiktok.com', 'https://www.whatsapp.com', 'https://www.discord.com',
  'https://www.telegram.org', 'https://www.slack.com',

  // Streaming / Entertainment
  'https://www.netflix.com', 'https://www.twitch.tv', 'https://www.spotify.com',
  'https://www.crunchyroll.com', 'https://www.imdb.com', 'https://www.rottentomatoes.com',
  'https://www.soundcloud.com', 'https://www.deezer.com',

  // Gaming
  'https://store.steampowered.com', 'https://www.epicgames.com', 'https://www.roblox.com',
  'https://www.ea.com', 'https://www.minecraft.net', 'https://www.riotgames.com',
  'https://www.blizzard.com', 'https://www.ign.com', 'https://www.gamespot.com',

  // AI
  'https://chatgpt.com', 'https://www.perplexity.ai', 'https://gemini.google.com',
  'https://copilot.microsoft.com', 'https://www.midjourney.com', 'https://poe.com',

  // Travel / Booking
  'https://www.booking.com', 'https://www.airbnb.co.uk', 'https://www.skyscanner.net',
  'https://www.tripadvisor.co.uk', 'https://www.trainline.com', 'https://www.kayak.co.uk',

  // Finance
  'https://www.paypal.com', 'https://www.revolut.com', 'https://www.wise.com',

  // Food / Delivery
  'https://www.deliveroo.co.uk', 'https://www.justeat.co.uk', 'https://www.uber.com',
  'https://www.tesco.com', 'https://www.sainsburys.co.uk', 'https://www.ocado.com',

  // Education / Reference
  'https://www.wikipedia.org', 'https://www.bbc.co.uk/bitesize', 'https://www.khanacademy.org',
  'https://www.coursera.org', 'https://www.duolingo.com',

  // Misc popular UK
  'https://www.rightmove.co.uk', 'https://www.autotrader.co.uk', 'https://www.gumtree.com',
  'https://www.gov.uk', 'https://www.nhs.uk', 'https://www.bbc.co.uk/weather',
];

// ── Detection logic ──
async function detectCookieBanner(page) {
  return page.evaluate((selectors) => {
    const results = { knownSelector: null, textMatch: null };

    // 1. Check known selectors
    for (const sel of selectors) {
      try {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          if (el.offsetHeight > 0 && el.offsetWidth > 0) {
            results.knownSelector = { selector: sel, id: el.id, cls: el.className?.toString?.()?.substring(0, 80) || '', h: el.offsetHeight };
            return results;
          }
        }
      } catch (e) { /* invalid selector, skip */ }
    }

    // 2. Check shadow DOM elements (e.g. TikTok)
    const allEls = document.querySelectorAll('*');
    for (const el of allEls) {
      if (el.shadowRoot && el.tagName.toLowerCase().includes('cookie')) {
        results.knownSelector = { selector: el.tagName.toLowerCase(), id: '', cls: '', h: el.offsetHeight || 100, shadow: true };
        return results;
      }
    }

    // 3. Text-based heuristic — look for visible elements mentioning cookies/consent
    const cookieKeywords = [
      'cookie preferences', 'cookie policy', 'we use cookies', 'cookie settings',
      'accept cookies', 'accept all cookies', 'reject cookies', 'manage cookies',
      'cookie consent', 'this site uses cookies', 'this website uses cookies',
      'uses cookies and similar', 'select your cookie', 'your privacy choices',
      'privacy settings', 'we value your privacy',
    ];

    const candidates = document.querySelectorAll('div, section, aside, form, dialog, [role="dialog"], [role="alertdialog"]');
    for (const el of candidates) {
      if (el.offsetHeight === 0 || el.offsetWidth === 0) continue;
      if (el.offsetHeight > 500 || el.children.length > 30) continue;

      const text = el.textContent?.toLowerCase() || '';
      if (text.length > 3000) continue;

      for (const kw of cookieKeywords) {
        if (text.includes(kw)) {
          const rect = el.getBoundingClientRect();
          if (rect.height > 30 && rect.height < 500 && rect.width > 200) {
            results.textMatch = {
              keyword: kw,
              tag: el.tagName,
              id: el.id,
              cls: el.className?.toString?.()?.substring(0, 80) || '',
              h: Math.round(rect.height),
              w: Math.round(rect.width),
              y: Math.round(rect.top),
            };
            return results;
          }
        }
      }
    }

    return results;
  }, KNOWN_SELECTORS);
}

// ── Main ──
(async () => {
  const sitesToScan = SITES.slice(0, LIMIT);
  if (!JSON_OUTPUT) {
    console.log(`\n🍪 Cookie Banner Scanner — scanning ${sitesToScan.length} sites\n`);
  }

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process'],
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    geolocation: { longitude: -0.1278, latitude: 51.5074 },
    permissions: ['geolocation'],
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  const results = [];
  const detected = [];
  const covered = [];
  const uncovered = [];
  const errors = [];

  for (let i = 0; i < sitesToScan.length; i++) {
    const url = sitesToScan[i];
    const domain = new URL(url).hostname.replace('www.', '');
    const page = await context.newPage();

    // Block heavy resources for speed
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,mp4,webm,woff,woff2,ttf,eot}', route => route.abort());

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      // Wait for consent scripts to load
      await page.waitForTimeout(2500);

      const detection = await detectCookieBanner(page);
      const hasBanner = detection.knownSelector || detection.textMatch;
      const isCovered = !!detection.knownSelector;

      const result = { url, domain, hasBanner: !!hasBanner, coveredByCSS: isCovered, detection };
      results.push(result);

      if (hasBanner) {
        detected.push(result);
        if (isCovered) covered.push(result);
        else uncovered.push(result);
      }

      if (VERBOSE || (!JSON_OUTPUT && hasBanner)) {
        const status = hasBanner ? (isCovered ? '✅ COVERED' : '⚠️  UNCOVERED') : '—';
        const detail = detection.knownSelector
          ? detection.knownSelector.selector
          : detection.textMatch
          ? `text:"${detection.textMatch.keyword}" in ${detection.textMatch.tag}#${detection.textMatch.id}`
          : '';
        console.log(`[${String(i + 1).padStart(3)}/${sitesToScan.length}] ${status.padEnd(14)} ${domain.padEnd(35)} ${detail}`);
      } else if (!JSON_OUTPUT) {
        process.stdout.write('.');
        if ((i + 1) % 50 === 0) process.stdout.write(`  ${i + 1}/${sitesToScan.length}\n`);
      }
    } catch (err) {
      const result = { url, domain, hasBanner: false, coveredByCSS: false, error: err.message.substring(0, 100) };
      results.push(result);
      errors.push(result);
      if (VERBOSE) {
        console.log(`[${String(i + 1).padStart(3)}/${sitesToScan.length}] ❌ ERROR      ${domain.padEnd(35)} ${err.message.substring(0, 60)}`);
      } else if (!JSON_OUTPUT) {
        process.stdout.write('x');
      }
    }

    await page.close();
  }

  await browser.close();

  // ── Output ──
  const summary = {
    total: results.length,
    detected: detected.length,
    covered: covered.length,
    uncovered: uncovered.length,
    errors: errors.length,
    coveredSites: covered.map(r => ({ domain: r.domain, selector: r.detection.knownSelector?.selector })),
    uncoveredSites: uncovered.map(r => ({ domain: r.domain, keyword: r.detection.textMatch?.keyword, element: `${r.detection.textMatch?.tag}#${r.detection.textMatch?.id}.${r.detection.textMatch?.cls}` })),
    errorSites: errors.map(r => r.domain),
    results,
  };

  // Save JSON
  const outPath = path.join(__dirname, 'results', 'cookie-scan.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));

  if (JSON_OUTPUT) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  🍪 Cookie Banner Scan Results`);
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`  Sites scanned:       ${results.length}`);
    console.log(`  Banners detected:    ${detected.length}`);
    console.log(`  ✅ Covered by CSS:   ${covered.length}`);
    console.log(`  ⚠️  NOT covered:     ${uncovered.length}`);
    console.log(`  ❌ Errors/timeouts:  ${errors.length}`);
    console.log('═══════════════════════════════════════════════════════════════════');

    if (covered.length > 0) {
      console.log('\n✅ Covered (our selectors match):');
      for (const r of covered) {
        console.log(`   ${r.domain.padEnd(35)} → ${r.detection.knownSelector.selector}`);
      }
    }

    if (uncovered.length > 0) {
      console.log('\n⚠️  UNCOVERED (banner detected by text, no CSS selector match):');
      for (const r of uncovered) {
        const d = r.detection.textMatch;
        console.log(`   ${r.domain.padEnd(35)} → "${d.keyword}" in <${d.tag} id="${d.id}" class="${d.cls.substring(0, 50)}">`);
      }
    }

    if (errors.length > 0) {
      console.log(`\n❌ Errors (${errors.length}): ${errors.map(e => e.domain).join(', ')}`);
    }

    console.log(`\nResults saved to ${outPath}`);
  }
})();
