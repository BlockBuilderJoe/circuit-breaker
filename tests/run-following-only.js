#!/usr/bin/env node

/**
 * Circuit Breaker — Follower-Only Redirect Unit Tests
 *
 * Tests content.js checkFollowingOnly() logic in isolation.
 * No browser needed — mirrors the FOLLOWING_REDIRECTS table and the
 * path-matching rules and verifies that the right paths redirect while
 * individual video/channel/watch pages are left alone.
 *
 * Run:  node run-following-only.js
 */

// Must match extension/content/content.js FOLLOWING_REDIRECTS exactly.
const FOLLOWING_REDIRECTS = [
  { featureId: 'yt-subs-only', domain: 'youtube.com', target: '/feed/subscriptions', homePaths: ['/', ''] },
  { featureId: 'tt-following', domain: 'tiktok.com', target: '/following', homePaths: ['/', '', '/foryou', '/explore'] },
  { featureId: 'tw-subs-only', domain: 'twitch.tv', target: '/directory/following', homePaths: ['/', ''] },
];

function wouldRedirect(hostname, pathname, followingOnly) {
  hostname = hostname.replace('www.', '');
  const rule = FOLLOWING_REDIRECTS.find(r => hostname === r.domain || hostname.endsWith('.' + r.domain));
  if (!rule) return null;
  if (!followingOnly[rule.featureId]) return null;
  if (pathname === rule.target || pathname.startsWith(rule.target + '/')) return null;
  if (!rule.homePaths.includes(pathname)) return null;
  return rule.target;
}

const cases = [
  // YouTube: should redirect from home, leave watch/feed/search alone
  ['yt-subs-only ON  | youtube.com/              → redirect', 'www.youtube.com', '/', { 'yt-subs-only': true }, '/feed/subscriptions'],
  ['yt-subs-only ON  | youtube.com/feed/subs    → no-op (already there)', 'www.youtube.com', '/feed/subscriptions', { 'yt-subs-only': true }, null],
  ['yt-subs-only ON  | youtube.com/feed/subs/X  → no-op (inside target)', 'www.youtube.com', '/feed/subscriptions/videos', { 'yt-subs-only': true }, null],
  ['yt-subs-only ON  | youtube.com/watch?v=X    → no-op', 'www.youtube.com', '/watch', { 'yt-subs-only': true }, null],
  ['yt-subs-only ON  | youtube.com/feed/trending → no-op', 'www.youtube.com', '/feed/trending', { 'yt-subs-only': true }, null],
  ['yt-subs-only ON  | youtube.com/@channel     → no-op', 'www.youtube.com', '/@somechannel', { 'yt-subs-only': true }, null],
  ['yt-subs-only OFF | youtube.com/             → no-op', 'www.youtube.com', '/', { 'yt-subs-only': false }, null],

  // TikTok: home, foryou, explore all redirect; /following and video pages don't
  ['tt-following ON  | tiktok.com/              → redirect', 'www.tiktok.com', '/', { 'tt-following': true }, '/following'],
  ['tt-following ON  | tiktok.com/foryou        → redirect', 'www.tiktok.com', '/foryou', { 'tt-following': true }, '/following'],
  ['tt-following ON  | tiktok.com/explore       → redirect', 'www.tiktok.com', '/explore', { 'tt-following': true }, '/following'],
  ['tt-following ON  | tiktok.com/following     → no-op', 'www.tiktok.com', '/following', { 'tt-following': true }, null],
  ['tt-following ON  | tiktok.com/@user/video/1 → no-op', 'www.tiktok.com', '/@user/video/123', { 'tt-following': true }, null],
  ['tt-following ON  | tiktok.com/@user         → no-op', 'www.tiktok.com', '/@somebody', { 'tt-following': true }, null],
  ['tt-following ON  | tiktok.com/live          → no-op', 'www.tiktok.com', '/live', { 'tt-following': true }, null],
  ['tt-following OFF | tiktok.com/foryou        → no-op', 'www.tiktok.com', '/foryou', {}, null],

  // Twitch: home redirects, channel pages don't
  ['tw-subs-only ON  | twitch.tv/               → redirect', 'www.twitch.tv', '/', { 'tw-subs-only': true }, '/directory/following'],
  ['tw-subs-only ON  | twitch.tv/directory/following → no-op', 'www.twitch.tv', '/directory/following', { 'tw-subs-only': true }, null],
  ['tw-subs-only ON  | twitch.tv/directory/following/X → no-op', 'www.twitch.tv', '/directory/following/live', { 'tw-subs-only': true }, null],
  ['tw-subs-only ON  | twitch.tv/channelname    → no-op', 'www.twitch.tv', '/ninja', { 'tw-subs-only': true }, null],
  ['tw-subs-only ON  | twitch.tv/directory      → no-op', 'www.twitch.tv', '/directory', { 'tw-subs-only': true }, null],

  // Cross-site: enabling tiktok shouldn't affect youtube
  ['tt ON / yt OFF   | youtube.com/             → no-op', 'www.youtube.com', '/', { 'tt-following': true }, null],
  ['yt ON / tt OFF   | tiktok.com/foryou        → no-op', 'www.tiktok.com', '/foryou', { 'yt-subs-only': true }, null],

  // Unrelated host: never matches
  ['any ON           | google.com/              → no-op', 'www.google.com', '/', { 'yt-subs-only': true, 'tt-following': true, 'tw-subs-only': true }, null],
];

let pass = 0, fail = 0;
for (const [label, host, path, fo, expected] of cases) {
  const actual = wouldRedirect(host, path, fo);
  if (actual === expected) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected: ${expected}`);
    console.log(`      actual:   ${actual}`);
  }
}

console.log('');
console.log('════════════════════════════════════════════════════════');
console.log(`  Total: ${cases.length}  |  ✅ Passed: ${pass}  |  ❌ Failed: ${fail}`);
console.log('════════════════════════════════════════════════════════');
process.exit(fail > 0 ? 1 : 0);
