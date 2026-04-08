<p align="center">
  <img src="extension/icons/icon-128.png" width="80" alt="Circuit Breaker mascot" />
</p>

<h1 align="center">Circuit Breaker</h1>

<p align="center">
  <strong>Your circuit breaker for the internet.</strong><br/>
  Trip the distracting parts of the web. Keep what's useful.
</p>

<p align="center">
  <a href="https://circuitbreaker.app">Dashboard</a> &middot;
  <a href="#install">Install</a> &middot;
  <a href="#self-host">Self-Host</a> &middot;
  <a href="#how-it-works">How It Works</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-3abf6e?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/chrome-extension-4285F4?style=flat-square&logo=googlechrome&logoColor=white" alt="Chrome" />
  <img src="https://img.shields.io/badge/firefox-addon-FF7139?style=flat-square&logo=firefox&logoColor=white" alt="Firefox" />
  <img src="https://img.shields.io/badge/safari-extension-000000?style=flat-square&logo=safari&logoColor=white" alt="Safari" />
  <img src="https://img.shields.io/docker/pulls/josephpalmer/circuit-breaker?style=flat-square&color=3abf6e" alt="Docker Pulls" />
</p>

---

Most blockers are all-or-nothing. Circuit Breaker is surgical. Kill YouTube Shorts without killing YouTube. Cut social feeds but keep messaging. Trip the features engineered to waste your time and keep the ones you actually need.

**No sign-up required. No data collection. Free and open source.**

## How It Works

Circuit Breaker is a browser extension with a visual dashboard. You toggle breakers at three levels:

```
Category  ->  Site  ->  Feature
```

| Level | Example |
|-------|---------|
| **Category** | Trip all Social Media |
| **Site** | Trip just Instagram |
| **Feature** | Trip only Instagram Reels and Explore |

Blocked domains show a friendly "tripped" page. Blocked features are surgically hidden with CSS injection. SPA navigation is intercepted so nothing slips through on sites like YouTube or TikTok.

### 12 Categories

Social &middot; Streaming &middot; Ads &middot; Adult &middot; Gambling &middot; Gaming &middot; News &middot; Dating &middot; Shopping &middot; AI &middot; Crypto &middot; Security

### 100+ Individual Features

YouTube Shorts, TikTok For You, Instagram Reels, Reddit Popular, Twitter Trending, Twitch Pre-roll Ads, Amazon Sponsored Products, and many more.

---

<h2 id="install">Install</h2>

| Browser | Link |
|---------|------|
| **Chrome** | [Chrome Web Store](#) |
| **Firefox** | [Firefox Add-ons](#) |
| **Safari** | [Safari Extensions](#) |
| **Edge** | [Edge Add-ons](#) |

Or load the extension manually for development:

```bash
git clone https://github.com/BlockBuilderJoe/circuit-breaker.git
cd circuit-breaker
```

- **Chrome**: Go to `chrome://extensions` -> Enable Developer Mode -> Load Unpacked -> select `extension/`
- **Firefox**: Go to `about:debugging` -> This Firefox -> Load Temporary Add-on -> select `extension/manifest.json`

---

## The Strategy

1. **Delete the apps** from your phone
2. **Use the web versions** instead
3. **Install Circuit Breaker** to trip the parts designed to keep you scrolling

Apps are designed to bypass your self-control. The browser is where you take it back.

---

## Dashboard

Configure everything at **[circuitbreaker.app](https://circuitbreaker.app)** or use the extension popup directly. The dashboard is a static SPA that communicates with the extension via `postMessage` -- your settings never leave your browser unless you enable sync.

---

<h2 id="self-host">Self-Host with Docker</h2>

Circuit Breaker works 100% locally with no account. But if you want to **sync settings across devices**, you can either use the hosted service ($1/mo or $10/yr) or self-host the sync server for free.

### Quick Start

```bash
docker run -d \
  --name circuit-breaker \
  -p 8787:8787 \
  -v cb-data:/data \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  josephpalmer/circuit-breaker:latest
```

The dashboard + sync API is now running at `http://localhost:8787`.

### Docker Compose

```yaml
services:
  circuit-breaker:
    image: josephpalmer/circuit-breaker:latest
    ports:
      - "8787:8787"
    volumes:
      - cb-data:/data
    environment:
      - JWT_SECRET=your-secret-here  # Use: openssl rand -hex 32
      - DB_PATH=/data/circuitbreaker.db
      - PORT=8787
    restart: unless-stopped

volumes:
  cb-data:
```

```bash
docker compose up -d
```

### Connect the Extension

1. Open the Circuit Breaker dashboard (in-extension or at `localhost:8787`)
2. Click **Sync across devices?**
3. Select **Self-host (free)**
4. Enter your server URL: `http://localhost:8787`
5. Create an account and sign in

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | *required* | Secret key for auth tokens. Generate with `openssl rand -hex 32` |
| `DB_PATH` | `/data/circuitbreaker.db` | Path to SQLite database file |
| `PORT` | `8787` | Server port |

### What's Inside

- **Hono** web framework on Node.js
- **SQLite** (via better-sqlite3) with WAL mode
- **3 dependencies**, ~82KB total
- Dashboard served as static files from the same container
- Email/password auth with JWT tokens
- Device management (register, list, roles)
- Bidirectional settings sync with versioning

---

## Architecture

```
extension/                  Browser extension (Chrome, Firefox, Safari)
  background/               Service worker — declarativeNetRequest rules
  content/                  Content script — CSS injection, SPA interception
  blocked/                  "Tripped" page shown for blocked domains
  popup/                    Extension popup UI
  options/                  Full options page
  data/blocklists.js        Source of truth for all blocking rules
  sync/                     Sync client (polls server, pushes on change)

worker/                     Sync server (Cloudflare Worker or Docker)
  src/
    routes/                 Auth, sync, devices, subscription endpoints
    db/                     D1 adapter (Cloudflare) + SQLite adapter (Docker)
    middleware/             JWT auth, encryption
  node-entry.js             Docker/Node.js entry point
  worker-entry.js           Cloudflare Workers entry point
  Dockerfile
  docker-compose.yml

index.html                  Dashboard SPA
js/                         Dashboard JavaScript
css/                        Dashboard styles
```

### How Blocking Works

| Method | Used For | Mechanism |
|--------|----------|-----------|
| **Domain block** | Entire site blocks, restricted categories | `declarativeNetRequest` redirect to `blocked.html` using `requestDomains` |
| **Element hiding** | Individual features (feeds, buttons, UI) | Content script injects CSS `display: none !important` |
| **URL interception** | SPA navigation (Shorts, Reels, etc.) | Content script intercepts `history.pushState` and shows inline block |

Domain blocking uses `requestDomains` (not `urlFilter`) to ensure exact domain matching with automatic subdomain support.

---

## Build

```bash
# Build all targets (Chrome + Firefox + Safari + dashboard)
./build.sh all

# Individual targets
./build.sh chrome
./build.sh firefox
./build.sh safari
./build.sh dashboard
```

### Deploy

```bash
# Deploy sync worker + dashboard to Cloudflare
cd worker && npx wrangler deploy

# Deploy dashboard to Cloudflare Pages
npx wrangler pages deploy . --project-name circuit-breaker

# Build and push Docker image
cd worker
docker build -t josephpalmer/circuit-breaker:latest .
docker push josephpalmer/circuit-breaker:latest
```

---

## Testing

```bash
# Full Puppeteer test suite (element + URL + allowlist features)
npm test

# Restricted domain tests (gambling, adult, dating, crypto)
npm run test:restricted

# URL blocking logic tests (214 tests, no browser needed)
npm run test:url-blocking

# Quick Playwright smoke test
npm run test:quick
```

See `tests/results/dashboard.html` for the full test results dashboard.

---

## Privacy

- **No telemetry.** No analytics. No tracking.
- **Your data stays local** unless you opt into sync.
- Sync uses email/password auth with encrypted storage.
- Self-host the sync server if you want full control.
- The extension requests only the permissions it needs: `declarativeNetRequest`, `storage`, `activeTab`.

---

## Contributing

Contributions are welcome. If you want to add a new site or fix a broken selector:

1. Fork the repo
2. Add your site/selector to `extension/data/blocklists.js`
3. Test with `npm run test:url-blocking` and validate selectors on the live site
4. Submit a PR

See `CLAUDE.md` for detailed development instructions.

---

## License

MIT

---

<p align="center">
  <img src="extension/icons/icon-48.png" width="24" alt="" /><br/>
  <sub>Built by <a href="https://github.com/BlockBuilderJoe">@BlockBuilderJoe</a></sub><br/>
  <sub><a href="https://circuitbreaker.app">circuitbreaker.app</a></sub>
</p>
