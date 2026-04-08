// Auth middleware + crypto helpers
// Uses Web Crypto API — works in both Cloudflare Workers and Node.js 20+

const encoder = new TextEncoder();

// --- Password Hashing (PBKDF2-SHA256) ---

export async function hashPassword(password, salt) {
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: hexToBytes(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  return bytesToHex(new Uint8Array(bits));
}

export function generateSalt() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
}

export async function verifyPassword(password, hash, salt) {
  const computed = await hashPassword(password, salt);
  return computed === hash;
}

// --- JWT ---

export async function createJWT(payload, secret, expiresInSeconds) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
  const bodyB64 = btoa(JSON.stringify(body)).replace(/=/g, '');
  const unsigned = `${headerB64}.${bodyB64}`;

  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(unsigned));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return `${unsigned}.${sigB64}`;
}

export async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, bodyB64, sigB64] = parts;
  const unsigned = `${headerB64}.${bodyB64}`;

  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const sig = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const valid = await crypto.subtle.verify('HMAC', key, sig, encoder.encode(unsigned));

  if (!valid) return null;

  const body = JSON.parse(atob(bodyB64));
  if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;

  return body;
}

// --- Auth Middleware for Hono ---

export function authMiddleware(secret) {
  return async (c, next) => {
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);

    const payload = await verifyJWT(auth.slice(7), secret);
    if (!payload) return c.json({ error: 'Invalid or expired token' }, 401);

    c.set('user_id', payload.user_id);
    await next();
  };
}

// --- Email Encryption (AES-256-GCM) + Hash (SHA-256) ---

export async function hashEmail(email) {
  const normalized = email.toLowerCase().trim();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(normalized));
  return bytesToHex(new Uint8Array(hash));
}

export async function encryptEmail(email, secret) {
  const normalized = email.toLowerCase().trim();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode('fusebox-email-enc'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(normalized));
  return bytesToHex(iv) + ':' + bytesToHex(new Uint8Array(encrypted));
}

export async function decryptEmail(encryptedStr, secret) {
  const [ivHex, dataHex] = encryptedStr.split(':');
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode('fusebox-email-enc'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
  );
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: hexToBytes(ivHex) }, key, hexToBytes(dataHex));
  return new TextDecoder().decode(decrypted);
}

// --- Helpers ---

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  return bytes;
}

export function generateId() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
}
