import { Hono } from 'hono';
import { decryptEmail } from '../middleware/auth.js';

const subscription = new Hono();

// Get subscription status
subscription.get('/', async (c) => {
  const selfHosted = c.get('self_hosted');

  if (selfHosted) {
    return c.json({ plan: 'self-hosted', status: 'active', expires_at: null });
  }

  const db = c.get('db');
  const userId = c.get('user_id');
  const users = await db.query('SELECT plan, plan_expires, stripe_customer_id FROM users WHERE id = ?', [userId]);

  if (!users.length) return c.json({ error: 'User not found' }, 404);

  const user = users[0];
  const isExpired = user.plan_expires && new Date(user.plan_expires) < new Date();

  return c.json({
    plan: isExpired ? 'free' : user.plan,
    status: isExpired ? 'expired' : 'active',
    expires_at: user.plan_expires,
  });
});

// Create checkout session (Stripe)
subscription.post('/checkout', async (c) => {
  const selfHosted = c.get('self_hosted');
  if (selfHosted) return c.json({ error: 'Not available on self-hosted' }, 404);

  const stripeKey = c.get('stripe_secret');
  if (!stripeKey) return c.json({ error: 'Stripe not configured' }, 500);

  const db = c.get('db');
  const userId = c.get('user_id');
  const { plan } = await c.req.json();

  const users = await db.query('SELECT email_encrypted, stripe_customer_id FROM users WHERE id = ?', [userId]);
  if (!users.length) return c.json({ error: 'User not found' }, 404);

  const user = users[0];

  // Price IDs would be set up in Stripe dashboard
  const priceId = plan === 'yearly' ? c.get('stripe_yearly_price') : c.get('stripe_monthly_price');
  if (!priceId) return c.json({ error: 'Invalid plan' }, 400);

  const params = new URLSearchParams({
    'mode': 'subscription',
    'success_url': 'https://circuitbreaker.app/sync-success',
    'cancel_url': 'https://circuitbreaker.app/sync-cancel',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'client_reference_id': userId,
  });

  if (user.stripe_customer_id) {
    params.set('customer', user.stripe_customer_id);
  } else {
    const email = await decryptEmail(user.email_encrypted, c.get('jwt_secret'));
    params.set('customer_email', email);
  }

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const session = await res.json();
  if (session.error) return c.json({ error: session.error.message }, 400);

  return c.json({ checkout_url: session.url });
});

// Customer portal
subscription.post('/portal', async (c) => {
  const selfHosted = c.get('self_hosted');
  if (selfHosted) return c.json({ error: 'Not available on self-hosted' }, 404);

  const stripeKey = c.get('stripe_secret');
  const db = c.get('db');
  const userId = c.get('user_id');

  const users = await db.query('SELECT stripe_customer_id FROM users WHERE id = ?', [userId]);
  if (!users.length || !users[0].stripe_customer_id) return c.json({ error: 'No subscription found' }, 404);

  const params = new URLSearchParams({
    'customer': users[0].stripe_customer_id,
    'return_url': 'https://circuitbreaker.app/settings',
  });

  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const session = await res.json();
  return c.json({ portal_url: session.url });
});

export default subscription;
