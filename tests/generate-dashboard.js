#!/usr/bin/env node

/**
 * FuseBox Test Dashboard Generator
 * Reads full-report.json and generates an interactive HTML dashboard.
 * Can also be required and called from the main test runner.
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, 'results');

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateDashboard(report) {
  const dateStr = new Date(report.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = new Date(report.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const browserLabels = report.browsers.map(function(b) {
    if (b === 'chromium') return 'Chrome';
    if (b === 'firefox') return 'Firefox';
    return 'Safari (WebKit)';
  });

  var html = [];

  html.push('<!DOCTYPE html>');
  html.push('<html lang="en">');
  html.push('<head>');
  html.push('<meta charset="UTF-8">');
  html.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  html.push('<title>FuseBox Test Results — ' + dateStr + '</title>');
  html.push('<style>');
  html.push(':root { --bg: #0a0a0a; --surface: #141414; --surface2: #1e1e1e; --border: #2a2a2a; --text: #e5e5e5; --text2: #999; --green: #22c55e; --red: #ef4444; --amber: #f59e0b; --blue: #3b82f6; --green-bg: rgba(34,197,94,0.1); --red-bg: rgba(239,68,68,0.1); --amber-bg: rgba(245,158,11,0.1); --blue-bg: rgba(59,130,246,0.1); }');
  html.push('* { margin: 0; padding: 0; box-sizing: border-box; }');
  html.push('body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); }');
  html.push('.header { padding: 32px 40px 24px; border-bottom: 1px solid var(--border); }');
  html.push('.header h1 { font-size: 24px; font-weight: 600; margin-bottom: 4px; }');
  html.push('.header .meta { color: var(--text2); font-size: 14px; display: flex; gap: 24px; flex-wrap: wrap; }');
  html.push('.header .meta span { display: inline-flex; align-items: center; gap: 6px; }');
  html.push('.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; padding: 24px 40px; }');
  html.push('.stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }');
  html.push('.stat-card .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text2); margin-bottom: 8px; }');
  html.push('.stat-card .value { font-size: 28px; font-weight: 700; }');
  html.push('.stat-card.pass .value { color: var(--green); }');
  html.push('.stat-card.fail .value { color: var(--red); }');
  html.push('.stat-card.skip .value { color: var(--amber); }');
  html.push('.stat-card.total .value { color: var(--blue); }');
  html.push('.controls { padding: 16px 40px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }');
  html.push('.controls input { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; color: var(--text); font-size: 14px; width: 260px; outline: none; }');
  html.push('.controls input:focus { border-color: var(--blue); }');
  html.push('.controls select { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; color: var(--text); font-size: 14px; outline: none; cursor: pointer; }');
  html.push('.content { padding: 0 40px 40px; }');
  html.push('.section { margin-top: 24px; }');
  html.push('.section-header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px 12px 0 0; cursor: pointer; user-select: none; }');
  html.push('.section-header:hover { background: var(--surface2); }');
  html.push('.section-header .arrow { transition: transform 0.2s; font-size: 12px; color: var(--text2); }');
  html.push('.section-header.collapsed .arrow { transform: rotate(-90deg); }');
  html.push('.section-header h2 { font-size: 16px; font-weight: 600; flex: 1; }');
  html.push('.section-header .badges { display: flex; gap: 8px; }');
  html.push('.badge { padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }');
  html.push('.badge.pass { background: var(--green-bg); color: var(--green); }');
  html.push('.badge.fail { background: var(--red-bg); color: var(--red); }');
  html.push('.badge.skip { background: var(--amber-bg); color: var(--amber); }');
  html.push('.section-body { border: 1px solid var(--border); border-top: none; border-radius: 0 0 12px 12px; overflow: hidden; }');
  html.push('.section-body.hidden { display: none; }');
  html.push('table { width: 100%; border-collapse: collapse; font-size: 14px; }');
  html.push('th { text-align: left; padding: 10px 14px; background: var(--surface2); color: var(--text2); font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; position: sticky; top: 0; }');
  html.push('td { padding: 10px 14px; border-top: 1px solid var(--border); vertical-align: top; }');
  html.push('tr:hover td { background: var(--surface); }');
  html.push('.status { display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }');
  html.push('.status.pass { background: var(--green-bg); color: var(--green); }');
  html.push('.status.fail { background: var(--red-bg); color: var(--red); }');
  html.push('.status.skip { background: var(--amber-bg); color: var(--amber); }');
  html.push('.selector-code { font-family: "SF Mono", Monaco, monospace; font-size: 11px; color: var(--text2); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }');
  html.push('.reason { font-size: 13px; color: var(--text2); max-width: 300px; }');
  html.push('.browser-cols { display: flex; gap: 6px; }');
  html.push('.browser-pill { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }');
  html.push('.browser-pill.pass { background: var(--green-bg); color: var(--green); }');
  html.push('.browser-pill.fail { background: var(--red-bg); color: var(--red); }');
  html.push('.browser-pill.skip { background: var(--amber-bg); color: var(--amber); }');
  html.push('.issues-panel { margin-top: 24px; background: var(--surface); border: 1px solid var(--red); border-left: 4px solid var(--red); border-radius: 12px; padding: 20px; }');
  html.push('.issues-panel h2 { font-size: 18px; margin-bottom: 12px; color: var(--red); }');
  html.push('.issue-item { padding: 10px 0; border-top: 1px solid var(--border); }');
  html.push('.issue-item:first-of-type { border-top: none; }');
  html.push('.issue-item .issue-title { font-weight: 600; margin-bottom: 4px; }');
  html.push('.issue-item .issue-detail { font-size: 13px; color: var(--text2); }');
  html.push('.browser-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; padding: 24px 40px 0; }');
  html.push('.browser-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; }');
  html.push('.browser-card h3 { font-size: 14px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }');
  html.push('.browser-card .bar { height: 8px; border-radius: 4px; background: var(--surface2); overflow: hidden; display: flex; }');
  html.push('.browser-card .bar-pass { background: var(--green); }');
  html.push('.browser-card .bar-fail { background: var(--red); }');
  html.push('.browser-card .bar-skip { background: var(--amber); }');
  html.push('.browser-card .numbers { display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: var(--text2); }');
  html.push('@media (max-width: 768px) { .header, .stats, .controls, .content, .browser-summary { padding-left: 16px; padding-right: 16px; } .stats { grid-template-columns: repeat(2, 1fr); } }');
  html.push('</style>');
  html.push('</head>');
  html.push('<body>');

  // Header
  html.push('<div class="header">');
  html.push('  <h1>&#9889; FuseBox Test Results</h1>');
  html.push('  <div class="meta">');
  html.push('    <span>&#128197; ' + dateStr + ' at ' + timeStr + '</span>');
  html.push('    <span>&#127991;&#65039; v' + report.version + '</span>');
  html.push('    <span>&#127760; ' + browserLabels.join(', ') + '</span>');
  if (report.siteFilter) html.push('    <span>&#128269; Filtered: ' + report.siteFilter + '</span>');
  html.push('  </div>');
  html.push('</div>');

  // Stats
  html.push('<div class="stats">');
  html.push('  <div class="stat-card total"><div class="label">Total Tests</div><div class="value">' + report.summary.total + '</div></div>');
  html.push('  <div class="stat-card pass"><div class="label">Passed</div><div class="value">' + report.summary.passed + '</div></div>');
  html.push('  <div class="stat-card fail"><div class="label">Failed</div><div class="value">' + report.summary.failed + '</div></div>');
  html.push('  <div class="stat-card skip"><div class="label">Skipped</div><div class="value">' + report.summary.skipped + '</div></div>');
  html.push('</div>');

  // Browser summary cards
  html.push('<div class="browser-summary">');
  report.browsers.forEach(function(b) {
    var s = report.summary.byBrowser[b] || { total: 0, passed: 0, failed: 0, skipped: 0 };
    var pPct = s.total ? (s.passed / s.total * 100).toFixed(0) : 0;
    var fPct = s.total ? (s.failed / s.total * 100).toFixed(0) : 0;
    var sPct = s.total ? (s.skipped / s.total * 100).toFixed(0) : 0;
    var label = b === 'chromium' ? '&#x1F7E1; Chrome' : b === 'firefox' ? '&#129418; Firefox' : '&#x1F9ED; Safari (WebKit)';
    html.push('<div class="browser-card">');
    html.push('  <h3>' + label + '</h3>');
    html.push('  <div class="bar">');
    html.push('    <div class="bar-pass" style="width:' + pPct + '%"></div>');
    html.push('    <div class="bar-fail" style="width:' + fPct + '%"></div>');
    html.push('    <div class="bar-skip" style="width:' + sPct + '%"></div>');
    html.push('  </div>');
    html.push('  <div class="numbers">');
    html.push('    <span style="color:var(--green)">&#10003; ' + s.passed + '</span>');
    html.push('    <span style="color:var(--red)">&#10007; ' + s.failed + '</span>');
    html.push('    <span style="color:var(--amber)">&#8856; ' + s.skipped + '</span>');
    html.push('  </div>');
    html.push('</div>');
  });
  html.push('</div>');

  // Issues panel (failed tests)
  var failures = report.featureResults.filter(function(r) { return r.status === 'fail'; });
  if (failures.length > 0) {
    html.push('<div class="content">');
    html.push('  <div class="issues-panel">');
    html.push('    <h2>&#9888; Issues to Fix (' + failures.length + ')</h2>');
    failures.forEach(function(r) {
      html.push('    <div class="issue-item">');
      html.push('      <div class="issue-title">' + escapeHtml(r.categoryName) + ' &rarr; ' + escapeHtml(r.siteName) + ' &rarr; ' + escapeHtml(r.featureName) + ' <span class="browser-pill fail">' + r.browser + '</span></div>');
      html.push('      <div class="issue-detail">' + escapeHtml(r.reason || 'Unknown failure') + '</div>');
      if (r.selector) {
        html.push('      <div class="selector-code" title="' + escapeHtml(r.selector) + '">' + escapeHtml(r.selector) + '</div>');
      }
      html.push('    </div>');
    });
    html.push('  </div>');
    html.push('</div>');
  }

  // Filters
  html.push('<div class="controls">');
  html.push('  <input type="text" id="search" placeholder="Search sites, features, selectors..." oninput="filterResults()">');
  html.push('  <select id="statusFilter" onchange="filterResults()">');
  html.push('    <option value="all">All Statuses</option>');
  html.push('    <option value="pass">Passed</option>');
  html.push('    <option value="fail">Failed</option>');
  html.push('    <option value="skip">Skipped</option>');
  html.push('  </select>');
  html.push('  <select id="browserFilter" onchange="filterResults()">');
  html.push('    <option value="all">All Browsers</option>');
  report.browsers.forEach(function(b) {
    var label = b === 'chromium' ? 'Chrome' : b === 'firefox' ? 'Firefox' : 'Safari';
    html.push('    <option value="' + b + '">' + label + '</option>');
  });
  html.push('  </select>');
  html.push('  <select id="typeFilter" onchange="filterResults()">');
  html.push('    <option value="all">All Types</option>');
  html.push('    <option value="element">Element</option>');
  html.push('    <option value="url">URL</option>');
  html.push('    <option value="domain">Domain</option>');
  html.push('    <option value="allowlist">Allowlist</option>');
  html.push('  </select>');
  html.push('</div>');

  // Results by category
  html.push('<div class="content" id="results-content">');

  var catEntries = Object.entries(report.summary.byCategory);
  catEntries.forEach(function(entry) {
    var catId = entry[0];
    var catSummary = entry[1];
    var catResults = report.featureResults.filter(function(r) { return r.category === catId; });
    if (catResults.length === 0) return;

    // Group by site
    var sites = {};
    catResults.forEach(function(r) {
      if (!sites[r.site]) sites[r.site] = { name: r.siteName, results: [] };
      sites[r.site].results.push(r);
    });

    html.push('<div class="section" data-category="' + catId + '">');
    html.push('  <div class="section-header" onclick="toggleSection(this)">');
    html.push('    <span class="arrow">&#9660;</span>');
    html.push('    <h2>' + escapeHtml(catSummary.name) + '</h2>');
    html.push('    <div class="badges">');
    if (catSummary.passed > 0) html.push('      <span class="badge pass">&#10003; ' + catSummary.passed + '</span>');
    if (catSummary.failed > 0) html.push('      <span class="badge fail">&#10007; ' + catSummary.failed + '</span>');
    if (catSummary.skipped > 0) html.push('      <span class="badge skip">&#8856; ' + catSummary.skipped + '</span>');
    html.push('    </div>');
    html.push('  </div>');
    html.push('  <div class="section-body">');
    html.push('    <table>');
    html.push('      <thead><tr><th>Site</th><th>Feature</th><th>Type</th><th>Browsers</th><th>Selector / URL</th><th>Details</th></tr></thead>');
    html.push('      <tbody>');

    Object.entries(sites).forEach(function(siteEntry) {
      var siteId = siteEntry[0];
      var siteData = siteEntry[1];

      // Group features by feature ID
      var featureGroups = {};
      siteData.results.forEach(function(r) {
        var key = r.feature;
        if (!featureGroups[key]) {
          featureGroups[key] = { name: r.featureName, type: r.type, selector: r.selector, urlFilter: r.urlFilter, browsers: {} };
        }
        featureGroups[key].browsers[r.browser] = r;
      });

      var fgEntries = Object.entries(featureGroups);
      fgEntries.forEach(function(fgEntry, idx) {
        var fId = fgEntry[0];
        var fg = fgEntry[1];

        var statuses = Object.values(fg.browsers).map(function(r) { return r.status; }).join(',');
        var browserNames = Object.keys(fg.browsers).join(',');
        var searchText = siteData.name + ' ' + fg.name + ' ' + (fg.selector || '') + ' ' + (fg.urlFilter || '');
        var firstReason = Object.values(fg.browsers)[0];
        var reasonText = firstReason ? (firstReason.reason || '') : '';

        html.push('      <tr data-site="' + siteId + '" data-feature="' + fId + '" data-type="' + fg.type + '" data-status="' + statuses + '" data-browser="' + browserNames + '" data-search="' + escapeHtml(searchText) + '">');

        if (idx === 0) {
          html.push('        <td rowspan="' + fgEntries.length + '" style="font-weight:600">' + escapeHtml(siteData.name) + '</td>');
        }

        html.push('        <td>' + escapeHtml(fg.name) + '</td>');
        html.push('        <td><span class="status" style="background:var(--blue-bg);color:var(--blue)">' + fg.type + '</span></td>');

        // Browser pills
        html.push('        <td><div class="browser-cols">');
        report.browsers.forEach(function(b) {
          var r = fg.browsers[b];
          if (!r) {
            html.push('          <span class="browser-pill skip" title="Not tested">&mdash;</span>');
          } else {
            var bLabel = b === 'chromium' ? 'CR' : b === 'firefox' ? 'FF' : 'WK';
            html.push('          <span class="browser-pill ' + r.status + '" title="' + escapeHtml(r.reason || r.status) + '">' + bLabel + '</span>');
          }
        });
        html.push('        </div></td>');

        var selectorOrUrl = fg.selector || fg.urlFilter || '';
        html.push('        <td><div class="selector-code" title="' + escapeHtml(selectorOrUrl) + '">' + escapeHtml(selectorOrUrl.substring(0, 60)) + '</div></td>');
        html.push('        <td><div class="reason">' + escapeHtml(reasonText.substring(0, 80)) + '</div></td>');
        html.push('      </tr>');
      });
    });

    html.push('      </tbody>');
    html.push('    </table>');
    html.push('  </div>');
    html.push('</div>');
  });

  // Collateral damage section
  if (report.collateralResults && report.collateralResults.length > 0) {
    var cPass = report.collateralResults.filter(function(r) { return r.status === 'pass'; }).length;
    var cFail = report.collateralResults.filter(function(r) { return r.status === 'fail'; }).length;

    html.push('<div class="section">');
    html.push('  <div class="section-header" onclick="toggleSection(this)">');
    html.push('    <span class="arrow">&#9660;</span>');
    html.push('    <h2>Collateral Damage Tests</h2>');
    html.push('    <div class="badges">');
    html.push('      <span class="badge pass">&#10003; ' + cPass + '</span>');
    if (cFail > 0) html.push('      <span class="badge fail">&#10007; ' + cFail + '</span>');
    html.push('    </div>');
    html.push('  </div>');
    html.push('  <div class="section-body">');
    html.push('    <table>');
    html.push('      <thead><tr><th>Test Scenario</th><th>Check Site</th><th>Browser</th><th>Status</th><th>Details</th></tr></thead>');
    html.push('      <tbody>');
    report.collateralResults.forEach(function(r) {
      var bLabel = r.browser === 'chromium' ? 'CR' : r.browser === 'firefox' ? 'FF' : 'WK';
      html.push('      <tr data-status="' + r.status + '" data-browser="' + r.browser + '" data-search="' + escapeHtml(r.testName + ' ' + r.checkName) + '">');
      html.push('        <td>' + escapeHtml(r.testName) + '</td>');
      html.push('        <td>' + escapeHtml(r.checkName) + '</td>');
      html.push('        <td><span class="browser-pill ' + r.status + '">' + bLabel + '</span></td>');
      html.push('        <td><span class="status ' + r.status + '">' + (r.status === 'pass' ? '&#10003; Pass' : '&#10007; Fail') + '</span></td>');
      html.push('        <td><div class="reason">' + escapeHtml(r.reason || '') + '</div></td>');
      html.push('      </tr>');
    });
    html.push('      </tbody>');
    html.push('    </table>');
    html.push('  </div>');
    html.push('</div>');
  }

  // Domain isolation warnings
  if (report.domainIsolation && report.domainIsolation.issues.length > 0) {
    html.push('<div class="section">');
    html.push('  <div class="section-header" onclick="toggleSection(this)">');
    html.push('    <span class="arrow">&#9660;</span>');
    html.push('    <h2>Domain Isolation Warnings</h2>');
    html.push('    <div class="badges"><span class="badge skip">&#9888; ' + report.domainIsolation.issues.length + '</span></div>');
    html.push('  </div>');
    html.push('  <div class="section-body" style="padding: 16px;">');
    report.domainIsolation.issues.forEach(function(i) {
      html.push('    <div class="issue-item">');
      html.push('      <div class="issue-title">' + escapeHtml(i.domain) + '</div>');
      html.push('      <div class="issue-detail">' + escapeHtml(i.message) + '</div>');
      html.push('    </div>');
    });
    html.push('  </div>');
    html.push('</div>');
  }

  html.push('</div>'); // end results-content

  // JavaScript
  html.push('<script>');
  html.push('function toggleSection(header) {');
  html.push('  header.classList.toggle("collapsed");');
  html.push('  header.nextElementSibling.classList.toggle("hidden");');
  html.push('}');
  html.push('function filterResults() {');
  html.push('  var search = document.getElementById("search").value.toLowerCase();');
  html.push('  var status = document.getElementById("statusFilter").value;');
  html.push('  var browser = document.getElementById("browserFilter").value;');
  html.push('  var type = document.getElementById("typeFilter").value;');
  html.push('  document.querySelectorAll("tr[data-search]").forEach(function(row) {');
  html.push('    var matchSearch = !search || (row.dataset.search || "").toLowerCase().indexOf(search) !== -1;');
  html.push('    var matchStatus = status === "all" || (row.dataset.status || "").indexOf(status) !== -1;');
  html.push('    var matchBrowser = browser === "all" || (row.dataset.browser || "").indexOf(browser) !== -1;');
  html.push('    var matchType = type === "all" || row.dataset.type === type;');
  html.push('    row.style.display = (matchSearch && matchStatus && matchBrowser && matchType) ? "" : "none";');
  html.push('  });');
  html.push('}');
  html.push('</script>');

  html.push('</body>');
  html.push('</html>');

  return html.join('\n');
}

function generate(report) {
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
  var htmlContent = generateDashboard(report);
  var htmlPath = path.join(RESULTS_DIR, 'dashboard.html');
  fs.writeFileSync(htmlPath, htmlContent);
  return htmlPath;
}

// If run directly, read from full-report.json
if (require.main === module) {
  var reportPath = path.join(RESULTS_DIR, 'full-report.json');
  if (!fs.existsSync(reportPath)) {
    console.error('No report found at ' + reportPath);
    console.error('Run the test suite first: node run-all-browsers.js');
    process.exit(1);
  }
  var report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  var outPath = generate(report);
  console.log('Dashboard generated: ' + outPath);
}

module.exports = { generate, generateDashboard };
