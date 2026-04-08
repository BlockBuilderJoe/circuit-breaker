// FuseBoard Sync — Cloudflare Worker entry point
import { createApp } from './src/index.js';
import { D1Adapter } from './src/db/adapter.js';

const app = createApp(
  // Database: Cloudflare D1
  (c) => new D1Adapter(c.env.DB),
  // Config: from Worker environment
  (c) => ({
    jwtSecret: c.env.JWT_SECRET,
    selfHosted: false,
    stripeSecret: c.env.STRIPE_SECRET_KEY,
    stripeMonthlyPrice: c.env.STRIPE_MONTHLY_PRICE,
    stripeYearlyPrice: c.env.STRIPE_YEARLY_PRICE,
  })
);

export default app;
