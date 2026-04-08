// Circuit Breaker Sync — Node.js / Docker entry point
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { createApp } from './src/index.js';
import { SqliteAdapter } from './src/db/adapter.js';

const DB_PATH = process.env.DB_PATH || '/data/circuitbreaker.db';
const PORT = parseInt(process.env.PORT || '8787');
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === 'change-me-to-a-random-string') {
  console.error('ERROR: Set a secure JWT_SECRET environment variable');
  process.exit(1);
}

// Init SQLite
const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Run schema
const schema = readFileSync(new URL('./src/db/schema.sql', import.meta.url), 'utf-8');
sqlite.exec(schema);

const db = new SqliteAdapter(sqlite);

const app = createApp(
  () => db,
  () => ({
    jwtSecret: JWT_SECRET,
    selfHosted: true,
    stripeSecret: null,
    stripeMonthlyPrice: null,
    stripeYearlyPrice: null,
  })
);

// Serve dashboard static files from ./public/
app.use('/*', serveStatic({ root: './public' }));

console.log(`Circuit Breaker Sync (self-hosted) running on port ${PORT}`);
serve({ fetch: app.fetch, port: PORT });
