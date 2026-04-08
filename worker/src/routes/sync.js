import { Hono } from 'hono';

const sync = new Hono();

// Get current settings
sync.get('/', async (c) => {
  const db = c.get('db');
  const userId = c.get('user_id');

  const rows = await db.query('SELECT payload, version, updated_at FROM settings WHERE user_id = ?', [userId]);

  if (!rows.length) {
    return c.json({ settings: null, version: 0, updated_at: null });
  }

  const row = rows[0];
  return c.json({
    settings: JSON.parse(row.payload),
    version: row.version,
    updated_at: row.updated_at,
  });
});

// Push settings
sync.put('/', async (c) => {
  const db = c.get('db');
  const userId = c.get('user_id');
  const { settings, device_id } = await c.req.json();

  if (!settings) return c.json({ error: 'Settings required' }, 400);

  // Client devices cannot push settings
  if (device_id) {
    const deviceRows = await db.query('SELECT role FROM devices WHERE id = ? AND user_id = ?', [device_id, userId]);
    if (deviceRows.length && deviceRows[0].role === 'client') {
      return c.json({ error: 'Client devices cannot modify settings' }, 403);
    }
  }

  const now = new Date().toISOString();
  const payload = JSON.stringify(settings);

  // Upsert: insert or update
  const existing = await db.query('SELECT version FROM settings WHERE user_id = ?', [userId]);

  if (existing.length) {
    const newVersion = existing[0].version + 1;
    await db.run(
      'UPDATE settings SET payload = ?, version = ?, updated_at = ?, updated_by = ? WHERE user_id = ?',
      [payload, newVersion, now, device_id || null, userId]
    );
    return c.json({ ok: true, version: newVersion });
  } else {
    await db.run(
      'INSERT INTO settings (user_id, payload, version, updated_at, updated_by) VALUES (?, ?, 1, ?, ?)',
      [userId, payload, now, device_id || null]
    );
    return c.json({ ok: true, version: 1 });
  }
});

export default sync;
