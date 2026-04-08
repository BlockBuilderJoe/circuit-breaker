// Circuit Breaker Web Dashboard — API Client
// Standalone auth + sync client that talks to the Circuit Breaker worker API.
// Uses localStorage instead of chrome.storage.

const HOSTED_SERVER = 'https://circuitbreaker.app';

let serverUrl = '';
let accessToken = '';
let refreshToken = '';
let deviceId = '';
let deviceRole = 'admin';
let syncVersion = 0;

function loadAuth() {
  serverUrl = localStorage.getItem('fb_server') || '';
  accessToken = localStorage.getItem('fb_access_token') || '';
  refreshToken = localStorage.getItem('fb_refresh_token') || '';
  deviceId = localStorage.getItem('fb_device_id') || '';
  deviceRole = localStorage.getItem('fb_device_role') || 'admin';
  syncVersion = parseInt(localStorage.getItem('fb_sync_version') || '0', 10);
}

function saveAuthTokens(data) {
  accessToken = data.token;
  refreshToken = data.refresh_token;
  localStorage.setItem('fb_server', serverUrl);
  localStorage.setItem('fb_access_token', accessToken);
  localStorage.setItem('fb_refresh_token', refreshToken);
}

function isSignedIn() {
  return !!(serverUrl && accessToken);
}

function getServerUrl() { return serverUrl; }
function getDeviceRole() { return deviceRole; }
function getSyncVersion() { return syncVersion; }
function getDeviceId() { return deviceId; }

// --- API helper with auto-refresh ---

async function apiFetch(method, path, body) {
  let res = await fetch(`${serverUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await fetch(`${serverUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    }
  }

  return res;
}

async function refreshAccessToken() {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${serverUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    accessToken = data.token;
    localStorage.setItem('fb_access_token', accessToken);
    return true;
  } catch {
    return false;
  }
}

// --- Auth ---

async function signUp(server, email, password) {
  serverUrl = server.replace(/\/$/, '');
  const res = await fetch(`${serverUrl}/api/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Sign up failed');
  }
  const data = await res.json();
  saveAuthTokens(data);
  await registerDevice();
  return data;
}

async function signIn(server, email, password) {
  serverUrl = server.replace(/\/$/, '');
  const res = await fetch(`${serverUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Sign in failed');
  }
  const data = await res.json();
  saveAuthTokens(data);
  await registerDevice();
  return data;
}

function signOut() {
  localStorage.removeItem('fb_server');
  localStorage.removeItem('fb_access_token');
  localStorage.removeItem('fb_refresh_token');
  localStorage.removeItem('fb_device_id');
  localStorage.removeItem('fb_device_role');
  localStorage.removeItem('fb_sync_version');
  serverUrl = '';
  accessToken = '';
  refreshToken = '';
  deviceId = '';
  deviceRole = 'admin';
  syncVersion = 0;
}

async function deleteAccount() {
  await apiFetch('DELETE', '/api/v1/auth/account');
  signOut();
}

async function registerDevice() {
  const name = 'Web Dashboard';
  const platform = 'web';
  const res = await apiFetch('POST', '/api/v1/devices', { name, platform, role: 'host' });
  if (res.ok) {
    const data = await res.json();
    deviceId = data.device_id;
    deviceRole = data.role || 'admin';
    localStorage.setItem('fb_device_id', deviceId);
    localStorage.setItem('fb_device_role', deviceRole);
  }
}

// --- Sync ---

async function pull() {
  if (!isSignedIn()) return null;
  try {
    const res = await apiFetch('GET', '/api/v1/sync');
    if (!res.ok) return null;
    const data = await res.json();
    if (data.settings && data.version > syncVersion) {
      syncVersion = data.version;
      localStorage.setItem('fb_sync_version', syncVersion);
      return data.settings;
    }
    return null;
  } catch {
    return null;
  }
}

async function push(settings) {
  if (!isSignedIn() || deviceRole === 'client') return false;
  try {
    const res = await apiFetch('PUT', '/api/v1/sync', {
      settings,
      device_id: deviceId,
    });
    if (res.ok) {
      const result = await res.json();
      syncVersion = result.version;
      localStorage.setItem('fb_sync_version', syncVersion);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// --- Devices ---

async function getDevices() {
  if (!isSignedIn()) return [];
  try {
    const res = await apiFetch('GET', '/api/v1/devices');
    if (!res.ok) return [];
    const data = await res.json();
    return data.devices || [];
  } catch {
    return [];
  }
}

async function removeDevice(id) {
  await apiFetch('DELETE', `/api/v1/devices/${id}`);
}

async function changeDeviceRole(targetDeviceId, role) {
  const res = await apiFetch('PATCH', `/api/v1/devices/${targetDeviceId}/role`, {
    role,
    requester_device_id: deviceId,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to change role');
  }
  return res.json();
}

async function refreshDeviceRole() {
  if (!isSignedIn() || !deviceId) return;
  try {
    const devices = await getDevices();
    const me = devices.find(d => d.id === deviceId);
    if (me && me.role !== deviceRole) {
      deviceRole = me.role;
      localStorage.setItem('fb_device_role', deviceRole);
    }
  } catch {}
}

// --- Subscription ---

async function getSubscription() {
  if (!isSignedIn()) return { plan: 'free' };
  try {
    const res = await apiFetch('GET', '/api/v1/subscription');
    if (!res.ok) return { plan: 'free' };
    return res.json();
  } catch {
    return { plan: 'free' };
  }
}

async function createCheckout(plan) {
  const res = await apiFetch('POST', '/api/v1/subscription/checkout', { plan });
  if (!res.ok) throw new Error('Checkout failed');
  return res.json();
}

// Init on load
loadAuth();
