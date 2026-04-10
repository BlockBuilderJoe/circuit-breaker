// Circuit Breaker — Options Page Logic (full drill-down)

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const board = document.getElementById('breakerboard');
const nav = document.getElementById('nav');
const titleEl = document.getElementById('title');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

let selections = {};
let currentView = 'main';

function initSelections() {
  categories.forEach(cat => {
    if (!selections[cat.id]) {
      selections[cat.id] = { enabled: cat.defaultOn || false, sites: {}, features: {} };
    }
    // Always ensure all sites and features exist (handles new additions)
    (cat.sites || []).forEach(site => {
      if (selections[cat.id].sites[site.id] === undefined) {
        selections[cat.id].sites[site.id] = cat.defaultOn || false;
      }
      (site.features || []).forEach(f => {
        if (selections[cat.id].features[f.id] === undefined) {
          selections[cat.id].features[f.id] = cat.defaultOn || false;
        }
      });
    });
  });
}

function getWireColor(catId) {
  const s = selections[catId];
  if (!s || !s.enabled) return 'red';
  const cat = categories.find(c => c.id === catId);
  if (!cat.sites || cat.sites.length === 0) return 'green';
  const blocked = cat.sites.filter(site => s.sites[site.id]).length;
  if (blocked === 0) return 'red';
  if (blocked === cat.sites.length) return 'green';
  return 'amber';
}

function render() {
  if (currentView === 'main') renderMain();
  else if (currentView.includes('/')) renderFeatures(currentView);
  else renderSites(currentView);
}

function renderBreadcrumb(crumbs) {
  nav.innerHTML = '';
  const bc = document.createElement('div');
  bc.className = 'breadcrumb';
  crumbs.forEach((c, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'sep';
      sep.textContent = '›';
      bc.appendChild(sep);
    }
    const btn = document.createElement('button');
    btn.className = 'crumb' + (i === crumbs.length - 1 ? ' current' : '');
    btn.textContent = c.label;
    if (c.view !== undefined && i < crumbs.length - 1) {
      btn.addEventListener('click', () => { currentView = c.view; render(); });
    }
    bc.appendChild(btn);
  });
  nav.appendChild(bc);
}

function renderMain() {
  renderBreadcrumb([{ label: 'Circuit Breaker', view: 'main' }]);
  titleEl.textContent = '';
  board.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'cb-grid';

  categories.forEach(cat => {
    const isTripped = selections[cat.id]?.enabled || false;
    const wire = getWireColor(cat.id);
    const hasSites = (cat.sites || []).length > 0;
    const cell = createFuseCell(cat.name, isTripped, wire, hasSites ? (cat.sites.length + ' sites') : '', hasSites, cat.icon);

    function toggleCat() {
      if (document.body.classList.contains('client-locked')) return;
      const s = selections[cat.id];
      s.enabled = !s.enabled;
      (cat.sites || []).forEach(site => {
        s.sites[site.id] = s.enabled;
        (site.features || []).forEach(f => { s.features[f.id] = s.enabled; });
      });
      cell.classList.add('just-toggled');
      setTimeout(() => cell.classList.remove('just-toggled'), 250);
      saveAndRender();
    }

    const trk = cell.querySelector('.cb-trk');
    trk.addEventListener('click', (e) => { e.stopPropagation(); toggleCat(); });
    trk.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleCat(); } });

    cell.addEventListener('click', (e) => {
      if (e.target.closest('.cb-trk')) return;
      if (hasSites) { currentView = cat.id; render(); }
    });

    grid.appendChild(cell);
  });
  board.appendChild(grid);
  updateStatus();
}

function renderSites(catId) {
  const cat = categories.find(c => c.id === catId);
  if (!cat) { currentView = 'main'; render(); return; }

  renderBreadcrumb([
    { label: 'Circuit Breaker', view: 'main' },
    { label: cat.name, view: cat.id },
  ]);
  titleEl.textContent = '';
  board.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'cb-grid';

  (cat.sites || []).forEach(site => {
    const isTripped = selections[cat.id].sites[site.id] || false;
    const hasFeatures = (site.features || []).length > 0;
    let wire = 'red';
    if (isTripped) {
      wire = 'green';
    } else if (hasFeatures) {
      const anyFeatOn = (site.features || []).some(f => selections[cat.id].features[f.id]);
      const allFeatOn = (site.features || []).every(f => selections[cat.id].features[f.id]);
      if (allFeatOn) wire = 'green';
      else if (anyFeatOn) wire = 'amber';
    }
    const showTripped = isTripped || wire !== 'red';
    const cell = createFuseCell(site.name, showTripped, wire, hasFeatures ? (site.features.length + ' features') : '', hasFeatures, '');

    function toggleSite() {
      if (document.body.classList.contains('client-locked')) return;
      selections[cat.id].sites[site.id] = !selections[cat.id].sites[site.id];
      const anySiteOn = Object.values(selections[cat.id].sites).some(v => v);
      selections[cat.id].enabled = anySiteOn;
      (site.features || []).forEach(f => {
        selections[cat.id].features[f.id] = selections[cat.id].sites[site.id];
      });
      cell.classList.add('just-toggled');
      setTimeout(() => cell.classList.remove('just-toggled'), 250);
      saveAndRender();
    }

    const trk = cell.querySelector('.cb-trk');
    trk.addEventListener('click', (e) => { e.stopPropagation(); toggleSite(); });
    trk.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleSite(); } });

    cell.addEventListener('click', (e) => {
      if (e.target.closest('.cb-trk')) return;
      if (hasFeatures) { currentView = cat.id + '/' + site.id; render(); }
    });

    grid.appendChild(cell);
  });
  board.appendChild(grid);
  updateStatus();
}

function renderFeatures(path) {
  const [catId, siteId] = path.split('/');
  const cat = categories.find(c => c.id === catId);
  const site = cat?.sites?.find(s => s.id === siteId);
  if (!cat || !site) { currentView = 'main'; render(); return; }

  renderBreadcrumb([
    { label: 'Circuit Breaker', view: 'main' },
    { label: cat.name, view: catId },
    { label: site.name, view: catId + '/' + siteId },
  ]);
  titleEl.textContent = '';
  board.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'cb-grid';

  (site.features || []).forEach(feat => {
    const isTripped = selections[cat.id].features[feat.id] || false;
    const wire = isTripped ? 'green' : 'red';
    const cell = createFuseCell(feat.name, isTripped, wire, feat.type === 'allowlist' ? 'allow list' : feat.type, false, '');

    cell.addEventListener('click', () => {
      if (document.body.classList.contains('client-locked')) return;
      cell.classList.add('just-toggled');
      setTimeout(() => cell.classList.remove('just-toggled'), 250);
      selections[cat.id].features[feat.id] = !selections[cat.id].features[feat.id];

      // Follower-only features: persist per-feature flag so each site is independent.
      if (feat.type === 'allowlist') {
        chrome.storage.sync.get(['followingOnly'], (data) => {
          const fo = data.followingOnly || {};
          fo[feat.id] = selections[cat.id].features[feat.id];
          chrome.storage.sync.set({ followingOnly: fo });
        });
      }

      saveAndRender();
    });

    grid.appendChild(cell);
  });

  board.appendChild(grid);
  updateStatus();
}

function createFuseCell(label, isTripped, wireColor, info, canDrill, icon) {
  const cell = document.createElement('div');
  cell.className = 'cb-cell';
  cell.dataset.s = isTripped ? '1' : '0';
  cell.dataset.w = wireColor;
  cell.innerHTML = `
    <div class="cb-wire"></div>
    <div class="cb-box">
      ${icon ? '<div class="cb-icon">' + icon + '</div>' : ''}
      <div class="cb-lb">${label}</div>
      <div class="cb-trk" role="switch" aria-checked="${isTripped}" aria-label="Block ${label}" tabindex="0"><div class="cb-lev"></div></div>
      ${info ? '<div class="cb-inf">' + info + '</div>' : ''}
      ${canDrill ? '<div class="cb-cfg">details ›</div>' : ''}
    </div>
    <div class="cb-wire"></div>
  `;
  return cell;
}

function updateStatus() {
  const tripped = categories.filter(c => selections[c.id]?.enabled).length;
  if (tripped === 0) { statusDot.className = 'status-dot'; statusText.textContent = 'Nothing blocked yet'; }
  else if (tripped === categories.length) { statusDot.className = 'status-dot active'; statusText.textContent = `All ${tripped} categories blocked`; }
  else { statusDot.className = 'status-dot partial'; statusText.textContent = `${tripped} of ${categories.length} blocked`; }
}

function saveAndRender() {
  chrome.storage.sync.set({ selections }, () => {
    const domains = [], urls = [], selectors = {};
    categories.forEach(cat => {
      const s = selections[cat.id];
      if (!s) return;
      (cat.sites || []).forEach(site => {
        const siteOn = s.sites[site.id];
        const siteFeatures = site.features || [];
        const allFeaturesOn = siteFeatures.length > 0 && siteFeatures.every(f => s.features[f.id]);

        // Whole site blocked
        if (siteOn && (siteFeatures.length === 0 || allFeaturesOn)) {
          (site.domains || []).forEach(d => { if (d && !domains.includes(d)) domains.push(d); });
          return;
        }

        // Individual features (regardless of site toggle)
        siteFeatures.forEach(feat => {
          if (!s.features[feat.id]) return;
          if (feat.type === 'url' && feat.urlFilter) {
            if (feat.requestDomains) {
              urls.push({ urlFilter: feat.urlFilter, requestDomains: feat.requestDomains });
            } else {
              urls.push(feat.urlFilter);
            }
          }
          if (feat.type === 'element' && feat.selector) {
            const h = feat.global ? '*' : (site.domains[0] || '').replace('www.', '');
            if (!selectors[h]) selectors[h] = [];
            selectors[h].push(feat.selector);
          }
          if (feat.elementSelectors) {
            const h = (site.domains[0] || '').replace('www.', '');
            if (!selectors[h]) selectors[h] = [];
            selectors[h].push(...feat.elementSelectors);
          }
        });
      });
    });
    chrome.runtime.sendMessage({ type: 'updateRules', domains, urls, selectors });
    render();
  });
}

// --- Sync UI ---
const syncContent = document.getElementById('sync-content');
const HOSTED_SERVER = 'https://circuitbreaker.app';

function renderSyncUI() {
  chrome.runtime.sendMessage({ type: 'sync_status' }, (status) => {
    if (!status || !status.enabled) {
      renderSignedOut();
    } else {
      renderSignedIn(status);
    }
  });
}

function renderSignedOut() {
  syncContent.innerHTML = `
    <div style="text-align:center;margin-bottom:14px">
      <div style="font-weight:700;font-size:.95rem;margin-bottom:4px">Sync across devices</div>
      <div style="font-size:.78rem;color:#666">Circuit Breaker works perfectly on its own. Want your breakers on all your devices?</div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:14px">
      <button id="sync-hosted-btn" style="flex:1;padding:10px;background:#12141a;border:1px solid #1e2028;border-radius:8px;color:#ccd;font-size:.78rem;font-weight:600;cursor:pointer;transition:.15s;font-family:inherit">
        We'll host it — $0.50/mo
      </button>
      <button id="sync-self-btn" style="flex:1;padding:10px;background:#12141a;border:1px solid #1e2028;border-radius:8px;color:#ccd;font-size:.78rem;font-weight:600;cursor:pointer;transition:.15s;font-family:inherit">
        Self-host (free)
      </button>
    </div>
    <div id="sync-form" style="display:none">
      <div id="sync-server-row" style="margin-bottom:8px;display:none">
        <input type="text" id="sync-server" placeholder="http://localhost:8787" style="width:100%;background:#07080a;border:1px solid #1e2028;border-radius:8px;padding:8px 12px;color:#e4e6ea;font-size:.82rem;outline:none">
      </div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <input type="email" id="sync-email" placeholder="Email" style="flex:1;background:#07080a;border:1px solid #1e2028;border-radius:8px;padding:8px 12px;color:#e4e6ea;font-size:.82rem;outline:none">
        <input type="password" id="sync-password" placeholder="Password" style="flex:1;background:#07080a;border:1px solid #1e2028;border-radius:8px;padding:8px 12px;color:#e4e6ea;font-size:.82rem;outline:none">
      </div>
      <div style="display:flex;gap:8px">
        <button id="sync-login-btn" style="flex:1;padding:8px;background:#22c55e;color:#000;border:none;border-radius:8px;font-weight:700;font-size:.82rem;cursor:pointer">Sign In</button>
        <button id="sync-register-btn" style="flex:1;padding:8px;background:#1e2028;color:#ccd;border:1px solid #2a2e38;border-radius:8px;font-weight:600;font-size:.82rem;cursor:pointer">Create Account</button>
      </div>
      <div id="sync-error" style="display:none;margin-top:8px;padding:8px 12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:6px;color:#fca5a5;font-size:.75rem"></div>
    </div>
  `;

  let selectedServer = HOSTED_SERVER;

  document.getElementById('sync-hosted-btn').addEventListener('click', () => {
    selectedServer = HOSTED_SERVER;
    document.getElementById('sync-form').style.display = 'block';
    document.getElementById('sync-server-row').style.display = 'none';
    document.getElementById('sync-hosted-btn').style.borderColor = '#22c55e';
    document.getElementById('sync-self-btn').style.borderColor = '#1e2028';
  });

  document.getElementById('sync-self-btn').addEventListener('click', () => {
    selectedServer = '';
    document.getElementById('sync-form').style.display = 'block';
    document.getElementById('sync-server-row').style.display = 'block';
    document.getElementById('sync-hosted-btn').style.borderColor = '#1e2028';
    document.getElementById('sync-self-btn').style.borderColor = '#22c55e';
  });

  document.getElementById('sync-login-btn')?.addEventListener('click', () => {
    const server = selectedServer || document.getElementById('sync-server').value;
    const email = document.getElementById('sync-email').value;
    const password = document.getElementById('sync-password').value;
    if (!server || !email || !password) return;

    chrome.runtime.sendMessage({ type: 'sync_signin', server, email, password }, (res) => {
      if (res?.error) {
        const err = document.getElementById('sync-error');
        err.textContent = res.error;
        err.style.display = 'block';
      } else {
        renderSyncUI();
      }
    });
  });

  document.getElementById('sync-register-btn')?.addEventListener('click', () => {
    const server = selectedServer || document.getElementById('sync-server').value;
    const email = document.getElementById('sync-email').value;
    const password = document.getElementById('sync-password').value;
    if (!server || !email || !password) return;

    chrome.runtime.sendMessage({ type: 'sync_signup', server, email, password }, (res) => {
      if (res?.error) {
        const err = document.getElementById('sync-error');
        err.textContent = res.error;
        err.style.display = 'block';
      } else {
        renderSyncUI();
      }
    });
  });
}

function renderSignedIn(status) {
  // Get device role to determine what to show
  chrome.runtime.sendMessage({ type: 'sync_device_role' }, (roleData) => {
    const isAdmin = roleData?.role === 'host';
    const isClient = roleData?.role === 'locked';

    syncContent.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,.3)"></span>
          <span style="font-size:.82rem;font-weight:600">Synced</span>
          <span style="font-size:.6rem;padding:2px 6px;border-radius:4px;background:${isAdmin ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)'};color:${isAdmin ? '#22c55e' : '#ef4444'};border:1px solid ${isAdmin ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)'}">${isAdmin ? 'host' : (isClient ? 'locked' : 'client')}</span>
          <span style="font-size:.65rem;color:#444">v${status.version}</span>
        </div>
        <div style="display:flex;gap:8px">
          <button id="sync-signout-btn" style="background:none;border:none;color:#444;font-size:.72rem;cursor:pointer;font-family:inherit">Sign out</button>
          <button id="sync-delete-btn" style="background:none;border:none;color:#ef4444;font-size:.72rem;cursor:pointer;font-family:inherit">Delete account</button>
        </div>
      </div>
      ${isClient ? '<div style="font-size:.72rem;color:#ef4444;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:6px;padding:8px;margin-bottom:10px;text-align:center">This device is locked — settings controlled by admin device</div>' : ''}
      <div style="font-size:.7rem;color:#444;margin-bottom:10px">Server: ${status.server}</div>
      <div id="sync-devices" style="margin-bottom:10px"></div>
      <div id="sync-sub" style="margin-bottom:8px"></div>
      <div style="display:flex;gap:6px">
        <button id="sync-web-btn" style="flex:1;padding:6px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:6px;color:#22c55e;font-size:.68rem;cursor:pointer;font-family:inherit;font-weight:600">Manage on website</button>
        ${isAdmin ? '<button id="sync-push-btn" style="flex:1;padding:6px;background:#12141a;border:1px solid #1e2028;border-radius:6px;color:#888;font-size:.68rem;cursor:pointer;font-family:inherit">Push now</button>' : ''}
        <button id="sync-pull-btn" style="flex:1;padding:6px;background:#12141a;border:1px solid #1e2028;border-radius:6px;color:#888;font-size:.68rem;cursor:pointer;font-family:inherit">Pull now</button>
      </div>
    `;

    document.getElementById('sync-signout-btn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'sync_signout' }, () => {
        document.body.classList.remove('client-locked');
        renderSyncUI();
      });
    });

    document.getElementById('sync-delete-btn').addEventListener('click', () => {
      if (!confirm('Delete your account and all synced data? This cannot be undone.')) return;
      chrome.runtime.sendMessage({ type: 'sync_delete_account' }, () => {
        document.body.classList.remove('client-locked');
        renderSyncUI();
      });
    });

    document.getElementById('sync-web-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://circuitbreaker.app' });
    });

    const pushBtn = document.getElementById('sync-push-btn');
    if (pushBtn) {
      pushBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'sync_force_push' }, () => renderSyncUI());
      });
    }

    document.getElementById('sync-pull-btn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'sync_force_pull' }, () => renderSyncUI());
    });

    // Load devices with role badges
    chrome.runtime.sendMessage({ type: 'sync_devices' }, (data) => {
      const el = document.getElementById('sync-devices');
      if (!data?.devices?.length) { el.innerHTML = '<div style="font-size:.7rem;color:#333">No devices</div>'; return; }
      el.innerHTML = data.devices.map(d => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:.72rem">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="color:#888">${d.name}</span>
            <span style="font-size:.55rem;padding:1px 5px;border-radius:3px;background:${d.role === 'host' ? 'rgba(34,197,94,.1)' : d.role === 'locked' ? 'rgba(239,68,68,.1)' : 'rgba(100,150,255,.1)'};color:${d.role === 'host' ? '#22c55e' : d.role === 'locked' ? '#ef4444' : '#6496ff'};border:1px solid ${d.role === 'host' ? 'rgba(34,197,94,.2)' : d.role === 'locked' ? 'rgba(239,68,68,.2)' : 'rgba(100,150,255,.2)'}">${d.role || 'client'}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            ${isAdmin && d.role !== 'host' ? `<button class="role-toggle" data-did="${d.id}" data-role="${d.role === 'locked' ? 'client' : 'locked'}" style="background:none;border:none;color:#555;font-size:.6rem;cursor:pointer;font-family:inherit">${d.role === 'locked' ? 'unlock' : 'lock'}</button>` : ''}
            <button class="remove-device" data-did="${d.id}" style="background:none;border:none;color:#333;font-size:.65rem;cursor:pointer;font-family:inherit">remove</button>
          </div>
        </div>
      `).join('');

      el.querySelectorAll('.role-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          chrome.runtime.sendMessage({
            type: 'sync_change_device_role',
            target_device_id: btn.dataset.did,
            role: btn.dataset.role,
          }, (res) => {
            if (res?.error) alert(res.error);
            else renderSyncUI();
          });
        });
      });

      el.querySelectorAll('.remove-device').forEach(btn => {
        btn.addEventListener('click', () => {
          chrome.runtime.sendMessage({ type: 'sync_remove_device', device_id: btn.dataset.did }, () => renderSyncUI());
        });
      });
    });

    // Load subscription (hosted only)
    chrome.runtime.sendMessage({ type: 'sync_subscription' }, (data) => {
      const el = document.getElementById('sync-sub');
      if (data?.plan === 'self-hosted') {
        el.innerHTML = '<div style="font-size:.7rem;color:#22c55e">Self-hosted (unlimited devices)</div>';
      } else if (data?.plan === 'pro') {
        el.innerHTML = '<div style="font-size:.7rem;color:#22c55e">Pro plan active</div>';
      } else {
        el.innerHTML = `
          <div style="font-size:.72rem;color:#888;margin-bottom:6px">Free plan — sync disabled. <strong style="color:#22c55e">$0.50/mo</strong> or <strong style="color:#22c55e">$5/yr</strong> for sync.</div>
          <div style="display:flex;gap:6px">
            <button class="sync-upgrade" data-plan="monthly" style="flex:1;padding:6px;background:#22c55e;color:#000;border:none;border-radius:6px;font-weight:700;font-size:.68rem;cursor:pointer">$0.50/month</button>
            <button class="sync-upgrade" data-plan="yearly" style="flex:1;padding:6px;background:#12141a;border:1px solid #22c55e;border-radius:6px;color:#22c55e;font-weight:600;font-size:.68rem;cursor:pointer">$5/year</button>
          </div>
        `;
        el.querySelectorAll('.sync-upgrade').forEach(btn => {
          btn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'sync_checkout', plan: btn.dataset.plan }, (data) => {
              if (data?.checkout_url) chrome.tabs.create({ url: data.checkout_url });
            });
          });
        });
      }
    });
  }); // end sync_device_role callback
}

renderSyncUI();

// Changelog toggle
document.getElementById('changelog-toggle').addEventListener('click', () => {
  const el = document.getElementById('changelog');
  if (el.style.display === 'none') {
    el.style.display = 'block';
    document.getElementById('changelog-toggle').style.color = '#888';
  } else {
    el.style.display = 'none';
    document.getElementById('changelog-toggle').style.color = '#3a3e48';
  }
});

// Populate changelog
document.getElementById('changelog').innerHTML = `
  <div style="font-weight:700;font-size:.9rem;color:#e0e2e8;margin-bottom:12px">Changelog</div>

  <div style="margin-bottom:14px">
    <div style="font-weight:700;color:#22c55e;margin-bottom:4px">v2.0.1 — Follower-Only Redirects</div>
    <ul style="padding-left:16px;color:#777">
      <li>YouTube / TikTok / Twitch "Following Only" now redirects home → native followed feed (was non-functional on TikTok/Twitch)</li>
      <li>Fixed shared-state bug where toggling the feature on one site affected the others</li>
      <li>Removed the manual channel-allowlist editor — uses your actual platform subscriptions</li>
    </ul>
  </div>

  <div style="margin-bottom:14px">
    <div style="font-weight:700;color:#ccd;margin-bottom:4px">v2.0.0 — Circuit Breaker</div>
    <ul style="padding-left:16px;color:#777">
      <li>Rebrand: FuseBox is now <b style="color:#ccd">Circuit Breaker</b></li>
      <li>New action language: "trip" replaces "switch off"</li>
      <li>New icon and branding throughout</li>
      <li>New domain: circuitbreaker.app</li>
      <li>Cookie consent scroll-lock fix (pages now scroll after hiding consent popups)</li>
      <li>Daily Mail comments selector updated</li>
      <li>XSS fix for channel name display</li>
    </ul>
  </div>

  <div style="margin-bottom:14px">
    <div style="font-weight:700;color:#ccd;margin-bottom:4px">v1.5.1 — Selector Updates
    </div>
    <div style="font-weight:700;color:#22c55e;margin-bottom:4px">v1.5.0 — Cloud Sync</div>
    <ul style="padding-left:16px;color:#777">
      <li>Cross-device sync (hosted $1/mo or $10/yr, or self-host free)</li>
      <li>Email + password auth with JWT</li>
      <li>Device management (unlimited devices)</li>
      <li>Auto-push/pull with debounce</li>
      <li>Stripe integration for subscriptions</li>
      <li>Self-hosted Docker container with SQLite</li>
    </ul>
  </div>

  <div style="margin-bottom:14px">
    <div style="font-weight:700;color:#ccd;margin-bottom:4px">v1.4.2 — Rule Engine Fix</div>
    <ul style="padding-left:16px;color:#777">
      <li>Fixed duplicate rule ID errors on extension reload</li>
      <li>Rules now use timestamp-based IDs to guarantee uniqueness</li>
      <li>Separate clear-then-add flow prevents race conditions</li>
    </ul>
  </div>

  <div style="margin-bottom:14px">
    <div style="font-weight:700;color:#ccd;margin-bottom:4px">v1.4.1 — Changelog & Amber Fix</div>
    <ul style="padding-left:16px;color:#777">
      <li>Added in-app changelog</li>
      <li>Version number in popup and options header</li>
      <li>Fixed amber wire color on sub-breakerboard</li>
    </ul>
  </div>

  <div style="margin-bottom:14px">
    <div style="font-weight:700;color:#22c55e;margin-bottom:4px">v1.4.0 — Feature Explosion</div>
    <ul style="padding-left:16px;color:#777">
      <li>Added 41 new blockable features across 13 sites</li>
      <li>YouTube: Autoplay, Live Chat, Premium Upsell, View Counts, Subscribe Button, Mixes</li>
      <li>TikTok: Like Counts, Share Button</li>
      <li>Twitter/X: Premium Upsell, Promoted Posts, Spaces, View Counts</li>
      <li>Reddit: Promoted Posts, Vote Counts, Suggested Subs</li>
      <li>Twitch: Pre-roll Ads, Bits, Subscribe Button, Prime Upsell</li>
      <li>Amazon: Sponsored Products, Prime Upsell, Reviews</li>
      <li>News sites: Cookie banners, autoplay video, comments, paywalls</li>
      <li>Fixed 13 broken selectors across 6 sites</li>
    </ul>
  </div>

  <div style="margin-bottom:14px">
    <div style="font-weight:700;color:#ccd;margin-bottom:4px">v1.3 — SPA Navigation Fix</div>
    <ul style="padding-left:16px;color:#777">
      <li>Fixed YouTube Shorts blocking on SPA navigation</li>
      <li>Content script intercepts history.pushState</li>
      <li>Inline blocked message instead of redirect</li>
      <li>YouTube channel search for Subs Only Mode</li>
      <li>Quick-allow button on blocked page</li>
    </ul>
  </div>

  <div style="margin-bottom:14px">
    <div style="font-weight:700;color:#ccd;margin-bottom:4px">v1.2 — Feature-Level Blocking</div>
    <ul style="padding-left:16px;color:#777">
      <li>3-level drill-down: Category &rarr; Site &rarr; Feature</li>
      <li>80+ blockable features across all major sites</li>
      <li>URL blocking + element hiding + SPA interception</li>
      <li>Subs Only Mode for YouTube and Twitch</li>
    </ul>
  </div>

  <div style="margin-bottom:14px">
    <div style="font-weight:700;color:#ccd;margin-bottom:4px">v1.1 — Browser Extension</div>
    <ul style="padding-left:16px;color:#777">
      <li>Pivoted from Cloudflare DNS to Chrome extension</li>
      <li>Circuit Breaker UI in extension popup</li>
      <li>12 categories, domain blocking, element hiding</li>
      <li>Branded blocked page</li>
    </ul>
  </div>

  <div>
    <div style="font-weight:700;color:#ccd;margin-bottom:4px">v1.0 — Initial Release</div>
    <ul style="padding-left:16px;color:#777">
      <li>Circuit Breaker web app with breakerboard visual metaphor</li>
      <li>Cloudflare Zero Trust Gateway DNS integration</li>
      <li>PIN-encrypted token storage</li>
      <li>Device setup guides for all platforms</li>
    </ul>
  </div>
`;

// Load state
chrome.storage.sync.get(['selections', 'openView'], (data) => {
  if (data.selections) selections = data.selections;
  initSelections();
  if (data.openView) {
    currentView = data.openView;
    chrome.storage.sync.remove('openView');
  }

  // Check device role before rendering
  chrome.runtime.sendMessage({ type: 'sync_device_role' }, (res) => {
    if (res?.role === 'locked') {
      document.body.classList.add('client-locked');
    }
    render();
  });
});
