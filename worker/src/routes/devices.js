import { Hono } from 'hono';
import { generateId } from '../middleware/auth.js';

const devices = new Hono();

// List devices
devices.get('/', async (c) => {
  const db = c.get('db');
  const userId = c.get('user_id');
  const rows = await db.query('SELECT id, name, platform, role, last_seen, created_at FROM devices WHERE user_id = ? ORDER BY last_seen DESC', [userId]);
  return c.json({ devices: rows });
});

// Register device
devices.post('/', async (c) => {
  const db = c.get('db');
  const userId = c.get('user_id');
  const selfHosted = c.get('self_hosted');
  const { name, platform, role: requestedRole } = await c.req.json();

  if (!name) return c.json({ error: 'Device name required' }, 400);

  // Check device limit (10 for hosted, unlimited for self-hosted)
  if (!selfHosted) {
    const existing = await db.query('SELECT COUNT(*) as count FROM devices WHERE user_id = ?', [userId]);
    if (existing[0]?.count >= 10) {
      return c.json({ error: 'Device limit reached (10). Remove a device first.' }, 403);
    }
  }

  // Role comes from the client: 'host' (web dashboard) or 'client' (extension)
  const role = requestedRole === 'host' ? 'host' : 'client';

  const deviceId = generateId();
  const now = new Date().toISOString();

  await db.run(
    'INSERT INTO devices (id, user_id, name, platform, role, last_seen, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [deviceId, userId, name, platform || 'unknown', role, now, now]
  );

  return c.json({ device_id: deviceId, role });
});

// Change device role
devices.patch('/:id/role', async (c) => {
  const db = c.get('db');
  const userId = c.get('user_id');
  const targetDeviceId = c.req.param('id');
  const { role, requester_device_id } = await c.req.json();

  if (!['host', 'client', 'locked'].includes(role)) return c.json({ error: 'Invalid role' }, 400);

  // Verify requester is the host device
  const requester = await db.query('SELECT role FROM devices WHERE id = ? AND user_id = ?', [requester_device_id, userId]);
  if (!requester.length || requester[0].role !== 'host') {
    return c.json({ error: 'Only the host can change device roles' }, 403);
  }

  await db.run('UPDATE devices SET role = ? WHERE id = ? AND user_id = ?', [role, targetDeviceId, userId]);
  return c.json({ ok: true });
});

// Remove device
devices.delete('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('user_id');
  const deviceId = c.req.param('id');

  await db.run('DELETE FROM devices WHERE id = ? AND user_id = ?', [deviceId, userId]);
  return c.json({ ok: true });
});

export default devices;
