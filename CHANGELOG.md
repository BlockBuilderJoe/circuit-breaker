# Circuit Breaker Changelog

## v2.0.0 — 2026-04-01
- **Rebrand**: FuseBox is now Circuit Breaker (circuitbreaker.app)
- New action language: "trip" replaces "switch off"
- New mascot icon throughout
- CSS class prefix changed from `fuse-` to `cb-`
- New domain: circuitbreaker.app (dashboard + sync from one worker)

## v1.5.1 — Selector Updates
- Netflix simplified to full domain block (no feature toggles)
- Removed obsolete Reddit features: Coins and Chat (both discontinued by Reddit)
- LinkedIn features updated to URL-based tests (Feed, Messaging, Promoted Posts)
- Fixed blocked page redirect (ERR_BLOCKED_BY_CLIENT → FuseBox blocked page)

## v1.5.0 — Cloud Sync
- Added cross-device sync (hosted at $0.50/mo or $5/yr, or self-host for free)
- Sync backend using Hono — runs on Cloudflare Workers and Docker
- Email + password auth with JWT tokens
- Device management (register, list, remove, 10-device limit for hosted)
- Auto-push on settings change (2s debounce)
- Auto-pull every 60 seconds
- Force push/pull buttons in settings
- Stripe integration for hosted subscriptions
- Self-hosted Docker container with SQLite
- Sync UI in options page: sign in, device list, subscription status

## v1.4.2 — Rule Engine Fix
- Fixed duplicate rule ID errors on extension reload
- Rules now use timestamp-based IDs to guarantee uniqueness
- Separate clear-then-add flow prevents race conditions

## v1.4.1 — Changelog & Amber Fix
- Added in-app changelog (visible in options page)
- Version number shown in popup and options header
- Fixed amber wire color on sub-fuseboard when some features are toggled

## v1.4.0 — Feature Explosion
- Added 41 new blockable features across 13 sites
- **YouTube**: Autoplay, Live Chat, Premium Upsell, View Counts, Subscribe Button, Mixes/Playlists
- **TikTok**: Like Counts, Share Button
- **Instagram**: Like Counts, Sponsored Posts
- **Twitter/X**: Premium Upsell, Promoted Posts, Spaces, View Counts, Bookmarks
- **Reddit**: Promoted Posts, Coins/Premium, Vote Counts, Suggested Subs
- **Twitch**: Pre-roll Ads, Bits/Donations, Subscribe Button, Prime Upsell
- **Amazon**: Sponsored Products, Prime Upsell, Reviews, Subscribe & Save
- **News sites**: Added features to CNN, BBC, Fox News, Daily Mail, NY Times, The Guardian (autoplay video, cookie banners, comments, paywalls, donation banners, sidebars)
- Fixed 13 broken CSS selectors across YouTube, TikTok, Reddit, Twitch, Amazon
- Updated Reddit selectors for new shreddit architecture
- Fixed YouTube Shorts sidebar selector (aria-label → title attribute)
- Fixed TikTok For You page URL (/ not /foryou)

## v1.3.0 — SPA Navigation Fix
- Fixed YouTube Shorts blocking on Single Page App navigation
- Content script now intercepts history.pushState for SPA sites
- Moved feature-level URL blocking from declarativeNetRequest to content script
- Fixed ERR_BLOCKED_BY_CLIENT error on sub-resource blocking
- Shows inline blocked message instead of redirect (prevents loops)
- Added YouTube channel search for Subs Only Mode
- Search YouTube channels live from the options page
- Quick-allow button on blocked page to add channels instantly

## v1.2.0 — Feature-Level Blocking
- Added 3-level drill-down: Category → Site → Feature
- YouTube features: Shorts, Trending, Comments, Up Next, Home Feed, Notifications, Shop, End Cards, Subs Only Mode
- TikTok features: For You, Live, Comments, Shop, Following Only
- Instagram features: Reels, Explore, Stories, Shop, Suggested Posts, Comments
- Facebook features: Reels, Marketplace, News Feed, Watch, Gaming, Groups, Notifications, Stories, Comments
- Twitter/X features: Trending, Explore, Notifications, Who to Follow, Replies, Like Counts, Retweet Counts, Grok AI
- Reddit features: Popular, r/all, Home Feed, Comments, Awards, Sidebar, Chat, NSFW
- LinkedIn features: Feed, Notifications, Messaging, Promoted Posts, Games
- Netflix features: Browse/Home, Autoplay Previews
- Twitch features: Browse, Clips, Chat, Recommendations, Followed Only
- Features use URL blocking (declarativeNetRequest) and element hiding (content script CSS injection)
- MutationObserver watches for dynamically loaded content
- Subs Only Mode: only allow videos from channels you add to your allow list

## v1.1.0 — Browser Extension
- Pivoted from Cloudflare DNS web app to Chrome browser extension
- No Cloudflare account needed, no API tokens, zero setup
- FuseBoard UI lives inside extension popup (10J lever-in-card style with wires)
- Full options page with drill-down navigation
- Domain blocking via chrome.declarativeNetRequest
- Element hiding via content script CSS injection
- Settings stored in chrome.storage.sync
- 12 categories: Social Media, Video Streaming, Ads & Trackers, Adult Content, Gambling, Gaming, News, Dating, Shopping, AI, Crypto, Security
- Branded "Blocked by FuseBoard" page
- Badge count shows number of active rules

## v1.0.0 — Initial Release (Web App)
- FuseBoard web app with fuseboard visual metaphor
- 10J lever-in-card design with animated wires
- Red/amber/green wire color logic (unprotected/partial/blocked)
- Cloudflare Zero Trust Gateway DNS integration
- API token auth with PIN-encrypted local storage
- Auto-creates DNS policies via Cloudflare API
- Device setup guides for iOS, macOS, Android, Windows, Linux, Router
- .mobileconfig profile generation for Apple devices
- PowerShell/shell script generation for Windows/Linux
- Share link for family members
- Deployed to Cloudflare Pages
