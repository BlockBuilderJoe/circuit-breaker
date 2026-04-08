import { Hono } from 'hono';
import { hashPassword, generateSalt, verifyPassword, createJWT, generateId, hashEmail, encryptEmail } from '../middleware/auth.js';

const auth = new Hono();

auth.post('/signup', async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) return c.json({ error: 'Email and password required' }, 400);
  if (password.length < 6) return c.json({ error: 'Password must be at least 6 characters' }, 400);

  const db = c.get('db');
  const secret = c.get('jwt_secret');

  // Hash email for lookups, encrypt for storage
  const emailHash = await hashEmail(email);
  const emailEnc = await encryptEmail(email, secret);

  // Check if email exists (via hash)
  const existing = await db.query('SELECT id FROM users WHERE email_hash = ?', [emailHash]);
  if (existing.length) return c.json({ error: 'Email already registered' }, 409);

  const userId = generateId();
  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  const now = new Date().toISOString();

  await db.run(
    'INSERT INTO users (id, email_hash, email_encrypted, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, emailHash, emailEnc, hash, salt, now]
  );

  const token = await createJWT({ user_id: userId }, secret, 900);
  const refreshToken = generateId();
  const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db.run(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
    [refreshToken, userId, refreshExpires]
  );

  return c.json({ token, refresh_token: refreshToken, user_id: userId });
});

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) return c.json({ error: 'Email and password required' }, 400);

  const db = c.get('db');
  const secret = c.get('jwt_secret');

  // Look up by email hash
  const emailHash = await hashEmail(email);
  const users = await db.query('SELECT * FROM users WHERE email_hash = ?', [emailHash]);
  if (!users.length) return c.json({ error: 'Invalid email or password' }, 401);

  const user = users[0];
  const valid = await verifyPassword(password, user.password_hash, user.salt);
  if (!valid) return c.json({ error: 'Invalid email or password' }, 401);

  const token = await createJWT({ user_id: user.id }, secret, 900);
  const refreshToken = generateId();
  const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db.run(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
    [refreshToken, user.id, refreshExpires]
  );

  return c.json({ token, refresh_token: refreshToken, user_id: user.id });
});

auth.post('/refresh', async (c) => {
  const { refresh_token } = await c.req.json();
  if (!refresh_token) return c.json({ error: 'Refresh token required' }, 400);

  const db = c.get('db');
  const secret = c.get('jwt_secret');

  const sessions = await db.query('SELECT * FROM sessions WHERE id = ?', [refresh_token]);
  if (!sessions.length) return c.json({ error: 'Invalid refresh token' }, 401);

  const session = sessions[0];
  if (new Date(session.expires_at) < new Date()) {
    await db.run('DELETE FROM sessions WHERE id = ?', [refresh_token]);
    return c.json({ error: 'Refresh token expired' }, 401);
  }

  const token = await createJWT({ user_id: session.user_id }, secret, 900);
  return c.json({ token });
});

auth.delete('/account', async (c) => {
  const db = c.get('db');
  const userId = c.get('user_id');
  await db.run('DELETE FROM users WHERE id = ?', [userId]);
  return c.json({ ok: true });
});

export default auth;
