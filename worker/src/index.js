import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth.js';
import syncRoutes from './routes/sync.js';
import deviceRoutes from './routes/devices.js';
import subscriptionRoutes from './routes/subscription.js';
import { verifyJWT } from './middleware/auth.js';

export function createApp(getDb, getConfig) {
  const app = new Hono();

  // CORS
  app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }));

  // Inject db and config
  app.use('*', async (c, next) => {
    c.set('db', getDb(c));
    const config = getConfig(c);
    c.set('jwt_secret', config.jwtSecret);
    c.set('self_hosted', config.selfHosted);
    c.set('stripe_secret', config.stripeSecret || null);
    c.set('stripe_monthly_price', config.stripeMonthlyPrice || null);
    c.set('stripe_yearly_price', config.stripeYearlyPrice || null);
    await next();
  });

  // Info
  app.get('/api/v1/info', (c) => c.json({
    name: 'FuseBoard Sync',
    version: '1.4.2',
    mode: c.get('self_hosted') ? 'self-hosted' : 'hosted',
  }));

  // Public auth routes
  app.route('/api/v1/auth', authRoutes);

  // Auth middleware for protected routes
  app.use('/api/v1/sync/*', async (c, next) => {
    const result = await checkAuth(c);
    if (result) return result;
    await next();
  });
  app.use('/api/v1/devices/*', async (c, next) => {
    const result = await checkAuth(c);
    if (result) return result;
    await next();
  });
  app.use('/api/v1/subscription/*', async (c, next) => {
    const result = await checkAuth(c);
    if (result) return result;
    await next();
  });

  // Protected routes
  app.route('/api/v1/sync', syncRoutes);
  app.route('/api/v1/devices', deviceRoutes);
  app.route('/api/v1/subscription', subscriptionRoutes);

  // Stripe webhook (no auth)
  app.post('/api/v1/webhooks/stripe', async (c) => {
    if (c.get('self_hosted')) return c.json({ error: 'Not available' }, 404);
    const db = c.get('db');
    const event = await c.req.json();

    if (event.type === 'checkout.session.completed') {
      const userId = event.data.object.client_reference_id;
      const customerId = event.data.object.customer;
      if (userId) await db.run('UPDATE users SET plan = ?, stripe_customer_id = ? WHERE id = ?', ['pro', customerId, userId]);
    }
    if (event.type === 'customer.subscription.deleted') {
      const customerId = event.data.object.customer;
      await db.run('UPDATE users SET plan = ? WHERE stripe_customer_id = ?', ['free', customerId]);
    }
    return c.json({ received: true });
  });

  return app;
}

async function checkAuth(c) {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);
  const payload = await verifyJWT(auth.slice(7), c.get('jwt_secret'));
  if (!payload) return c.json({ error: 'Invalid or expired token' }, 401);
  c.set('user_id', payload.user_id);
  return null;
}
