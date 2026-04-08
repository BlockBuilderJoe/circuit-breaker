// Circuit Breaker — Blocklist data model
// Each category maps to Cloudflare Gateway DNS policy expressions

const categories = [
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Trip social networking platforms',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg>`,
    defaultOn: false,
    cfType: 'content_category',
    cfCategoryIds: [149],
    sites: [
      { id: 'tiktok', name: 'TikTok', domains: ['tiktok.com', 'tiktokv.com', 'tiktokcdn.com', 'musical.ly'], features: [
        { id: 'tt-fyp', name: 'For You', type: 'url', urlFilter: '||tiktok.com/', requestDomains: ['tiktok.com'], elementSelectors: ['[data-e2e="recommend-list-item-container"]', '[data-e2e="feed-video"]'] },
        { id: 'tt-live', name: 'Live', type: 'url', urlFilter: '/live', requestDomains: ['tiktok.com'], elementSelectors: ['[data-e2e="nav-live"]', '[data-e2e="live-badge"]'] },
        { id: 'tt-comments', name: 'Comments', type: 'element', selector: '[data-e2e="comment-list"], [data-e2e="comment-input"], [data-e2e="comment-icon"], [data-e2e="comment-count"]' },
        { id: 'tt-shop', name: 'Shop', type: 'url', urlFilter: '/shop', requestDomains: ['tiktok.com'], elementSelectors: ['[data-e2e="tiktok-shop"]', 'a[href*="/shop"]', '[data-e2e="nav-shop"]'] },
        { id: 'tt-following', name: 'Following Only', type: 'allowlist', description: 'Only allow content from accounts you follow' },
        { id: 'tt-likes', name: 'Like Counts', type: 'element', selector: '[data-e2e="like-count"], [data-e2e="browse-like-count"]' },
        { id: 'tt-share', name: 'Share Button', type: 'element', selector: '[data-e2e="share-icon"], [data-e2e="share-button"]' },
      ]},
      { id: 'instagram', name: 'Instagram', domains: ['instagram.com', 'cdninstagram.com'], features: [
        { id: 'ig-reels', name: 'Reels', type: 'url', urlFilter: '/reels', requestDomains: ['instagram.com'] },
        { id: 'ig-explore', name: 'Explore', type: 'url', urlFilter: '/explore', requestDomains: ['instagram.com'] },
        { id: 'ig-stories', name: 'Stories', type: 'element', selector: '[aria-label="Stories tray"], [aria-label*="story"], [aria-label*="Story"]' },
        { id: 'ig-shop', name: 'Shop', type: 'url', urlFilter: '/shop', requestDomains: ['instagram.com'] },
        { id: 'ig-suggested', name: 'Suggested Posts', type: 'element', selector: '[data-testid="suggested-posts"], article ~ article' },
        { id: 'ig-comments', name: 'Comments', type: 'element', selector: '[placeholder="Add a comment…"], article section div:has(svg[aria-label="Comment"])' },
        { id: 'ig-like-counts', name: 'Like Counts', type: 'element', selector: 'article section span[role="button"]' },
        { id: 'ig-ads', name: 'Sponsored Posts', type: 'element', selector: '[data-testid="sponsored"], article:has(a[href*="ads/about"])' },
      ]},
      { id: 'facebook', name: 'Facebook', domains: ['facebook.com', 'fbcdn.net', 'fb.com', 'facebook.net', 'fbsbx.com'], features: [
        { id: 'fb-reels', name: 'Reels', type: 'url', urlFilter: '/reel', requestDomains: ['facebook.com'] },
        { id: 'fb-marketplace', name: 'Marketplace', type: 'url', urlFilter: '/marketplace', requestDomains: ['facebook.com'] },
        { id: 'fb-feed', name: 'News Feed', type: 'element', selector: '[role="feed"]' },
        { id: 'fb-watch', name: 'Watch', type: 'url', urlFilter: '/watch', requestDomains: ['facebook.com'] },
        { id: 'fb-gaming', name: 'Gaming', type: 'url', urlFilter: '/gaming', requestDomains: ['facebook.com'] },
        { id: 'fb-groups', name: 'Groups', type: 'url', urlFilter: '/groups', requestDomains: ['facebook.com'] },
        { id: 'fb-notifications', name: 'Notifications', type: 'element', selector: '[aria-label="Notifications"], [data-testid="notif_container"]' },
        { id: 'fb-stories', name: 'Stories', type: 'element', selector: '[aria-label="Stories"]' },
        { id: 'fb-comments', name: 'Comments', type: 'element', selector: '[aria-label="Write a comment"], ul.x1n2onr6' },
      ]},
      { id: 'twitter', name: 'Twitter / X', domains: ['twitter.com', 'x.com', 't.co', 'twimg.com'], features: [
        { id: 'tw-trending', name: 'Trending', type: 'element', selector: '[aria-label="Timeline: Trending now"], [data-testid="trend"]' },
        { id: 'tw-explore', name: 'Explore', type: 'url', urlFilter: '/explore', requestDomains: ['x.com', 'twitter.com'] },
        { id: 'tw-notifications', name: 'Notifications', type: 'url', urlFilter: '/notifications', requestDomains: ['x.com', 'twitter.com'] },
        { id: 'tw-whotofollow', name: 'Who to Follow', type: 'element', selector: '[data-testid="UserCell"], [aria-label="Who to follow"]' },
        { id: 'tw-replies', name: 'Replies', type: 'element', selector: '[data-testid="reply"]' },
        { id: 'tw-likes', name: 'Like Counts', type: 'element', selector: '[data-testid="like"], [data-testid="unlike"]' },
        { id: 'tw-retweets', name: 'Retweet Counts', type: 'element', selector: '[data-testid="retweet"], [data-testid="unretweet"]' },
        { id: 'tw-grok', name: 'Grok AI', type: 'element', selector: 'a[href*="/i/grok"], [aria-label="Grok"]' },
        { id: 'tw-premium', name: 'Premium Upsell', type: 'element', selector: 'a[href*="/i/premium_sign_up"], [data-testid="premium"], aside[aria-label*="Premium"]' },
        { id: 'tw-ads', name: 'Promoted Posts', type: 'element', selector: '[data-testid="placementTracking"]' },
        { id: 'tw-spaces', name: 'Spaces', type: 'element', selector: 'a[href*="/i/spaces"], [aria-label*="Space"]' },
        { id: 'tw-view-counts', name: 'View Counts', type: 'element', selector: 'a[href*="/analytics"], [aria-label*="views"]' },
        { id: 'tw-bookmark', name: 'Bookmarks', type: 'url', urlFilter: '/i/bookmarks', requestDomains: ['x.com', 'twitter.com'] },
      ]},
      { id: 'snapchat', name: 'Snapchat', domains: ['snapchat.com', 'snap.com', 'sc-cdn.net', 'snapkit.co'], features: [
        { id: 'sc-discover', name: 'Discover', type: 'url', urlFilter: '/discover', requestDomains: ['snapchat.com'] },
        { id: 'sc-spotlight', name: 'Spotlight', type: 'url', urlFilter: '/spotlight', requestDomains: ['snapchat.com'] },
      ]},
      { id: 'reddit', name: 'Reddit', domains: ['reddit.com', 'redd.it', 'redditstatic.com', 'redditmedia.com'], features: [
        { id: 'rd-popular', name: 'Popular', type: 'url', urlFilter: '/r/popular', requestDomains: ['reddit.com'] },
        { id: 'rd-all', name: 'r/all', type: 'url', urlFilter: '/r/all', requestDomains: ['reddit.com'] },
        { id: 'rd-home', name: 'Home Feed', type: 'element', selector: 'shreddit-feed, .ListingLayout-outerContainer' },
        { id: 'rd-comments', name: 'Comments', type: 'element', selector: '[id^="comment-tree"], shreddit-comment-tree, shreddit-comment, .Comment' },
        { id: 'rd-awards', name: 'Awards', type: 'element', selector: 'shreddit-post-award-button, [award-count], [data-testid="award-button"], .award-icon' },
        { id: 'rd-sidebar', name: 'Sidebar / Trending', type: 'element', selector: '[data-testid="sidebar"], #right-sidebar-container' },
        { id: 'rd-nsfw', name: 'NSFW Content', type: 'element', selector: 'shreddit-post[nsfw], shreddit-post:has([nsfw]), .Post:has(.icon-nsfw)' },
        { id: 'rd-promoted', name: 'Promoted Posts', type: 'element', selector: 'shreddit-post[is-promoted], .promotedlink, [data-promoted="true"]' },
        { id: 'rd-vote-counts', name: 'Vote Counts', type: 'element', selector: 'faceplate-number, [score], .score' },
        { id: 'rd-suggested', name: 'Suggested Subs', type: 'element', selector: 'pdp-right-rail, #right-sidebar-container aside, [data-testid="subreddit-recommendation"]' },
      ]},
      { id: 'pinterest', name: 'Pinterest', domains: ['pinterest.com', 'pinimg.com'], features: [
        { id: 'pn-home', name: 'Home Feed', type: 'url', urlFilter: '||pinterest.com/', requestDomains: ['pinterest.com'] },
        { id: 'pn-shop', name: 'Shop', type: 'element', selector: '[data-test-id="shopping-spotlight"], [data-test-id*="shop"], a[href*="/shop/"], a[href*="/shopping/"]' },
        { id: 'pn-notifications', name: 'Notifications', type: 'element', selector: '[aria-label="Notifications"]' },
      ]},
      { id: 'linkedin', name: 'LinkedIn', domains: ['linkedin.com', 'licdn.com'], features: [
        { id: 'li-feed', name: 'Feed', type: 'url', urlFilter: '/feed', requestDomains: ['linkedin.com'] },
        { id: 'li-notifications', name: 'Notifications', type: 'url', urlFilter: '/notifications', requestDomains: ['linkedin.com'] },
        { id: 'li-messaging', name: 'Messaging', type: 'url', urlFilter: '/messaging', requestDomains: ['linkedin.com'] },
        { id: 'li-ads', name: 'Promoted Posts', type: 'url', urlFilter: '/jobs', requestDomains: ['linkedin.com'] },
        { id: 'li-games', name: 'Games', type: 'url', urlFilter: '/games', requestDomains: ['linkedin.com'] },
      ]},
    ]
  },
  {
    id: 'video-streaming',
    name: 'Video Streaming',
    description: 'Trip streaming platforms',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
    defaultOn: false,
    cfType: 'content_category',
    cfCategoryIds: [164],
    sites: [
      { id: 'youtube', name: 'YouTube', domains: ['youtube.com', 'youtu.be', 'ytimg.com', 'googlevideo.com', 'yt3.ggpht.com'], features: [
        { id: 'yt-shorts', name: 'Shorts', type: 'url', urlFilter: '/shorts', requestDomains: ['youtube.com'], elementSelectors: ['ytd-reel-shelf-renderer', 'ytd-rich-shelf-renderer[is-shorts]', '[title="Shorts"]', 'ytd-mini-guide-entry-renderer:has(a[title="Shorts"])', 'ytd-guide-entry-renderer:has(a[title="Shorts"])', 'a[href*="/shorts/"]', 'ytd-shorts'] },
        { id: 'yt-trending', name: 'Trending', type: 'url', urlFilter: '/feed/trending', requestDomains: ['youtube.com'], elementSelectors: ['[title="Trending"]', 'ytd-guide-entry-renderer:has(a[title="Trending"])'] },
        { id: 'yt-comments', name: 'Comments', type: 'element', selector: '#comments, ytd-comments' },
        { id: 'yt-recommendations', name: 'Up Next', type: 'element', selector: '#related, #secondary, ytd-watch-next-secondary-results-renderer' },
        { id: 'yt-home', name: 'Home Feed', type: 'element', selector: 'ytd-rich-grid-renderer, ytd-browse[page-subtype="home"] ytd-rich-item-renderer, ytd-feed-nudge-renderer' },
        { id: 'yt-notifications', name: 'Notifications', type: 'element', selector: 'ytd-notification-topbar-button-renderer' },
        { id: 'yt-shop', name: 'Shop', type: 'element', selector: 'ytd-merch-shelf-renderer, ytd-structured-description-content-renderer, #merch-shelf, ytd-product-details-renderer, [aria-label="Shopping"], ytd-guide-entry-renderer:has(a[title="Shopping"]), button[aria-label="Shopping"]' },
        { id: 'yt-endscreen', name: 'End Cards', type: 'element', selector: '.ytp-endscreen-content, .ytp-ce-element, .ytp-ce-covering-overlay, .ytp-ce-element-shadow, .ytp-cards-teaser, .ytp-cards-button, .ytp-cards-button-icon, .ytp-suggestion-set, .html5-endscreen, .videowall-endscreen, iv-endscreen, .ytp-endscreen-previous, .ytp-endscreen-next, .annotation' },
        { id: 'yt-subs-only', name: 'Subs Only Mode', type: 'allowlist', description: 'Only allow videos from channels you add to your allow list' },
        { id: 'yt-autoplay', name: 'Autoplay', type: 'element', selector: '.ytp-autonav-toggle-button, [data-tooltip-target-id="ytp-autonav-toggle-button"]' },
        { id: 'yt-live-chat', name: 'Live Chat', type: 'element', selector: '#chat, ytd-live-chat-frame, #chat-container' },
        { id: 'yt-premium-upsell', name: 'Premium Upsell', type: 'element', selector: 'ytd-mealbar-promo-renderer, ytd-popup-container, tp-yt-paper-dialog:has(.premium), ytd-enforcement-message-view-model' },
        { id: 'yt-view-count', name: 'View Counts', type: 'element', selector: '#info-strings .view-count, ytd-video-view-count-renderer, .ytd-video-meta-block' },
        { id: 'yt-subscribe-btn', name: 'Subscribe Button', type: 'element', selector: '#subscribe-button, ytd-subscribe-button-renderer' },
        { id: 'yt-playlist-mix', name: 'Mixes / Playlists', type: 'element', selector: 'ytd-radio-renderer, ytd-compact-radio-renderer, ytd-rich-item-renderer:has(a[href*="list="])' },
        { id: 'yt-ads', name: 'Ads', type: 'element', selector: '.ytp-ad-module, .ytp-ad-overlay-container, .ytp-ad-text, .ytp-ad-skip-button-container, .ytp-ad-image-overlay, .video-ads, #player-ads, #masthead-ad, ytd-ad-slot-renderer, ytd-banner-promo-renderer, ytd-promoted-sparkles-web-renderer, ytd-promoted-video-renderer, ytd-display-ad-renderer, ytd-in-feed-ad-layout-renderer, ytd-rich-item-renderer:has(.ytd-ad-slot-renderer), #related ytd-promoted-sparkles-web-renderer, tp-yt-paper-dialog:has(#mealbar-promo-renderer)' },
      ]},
      { id: 'netflix', name: 'Netflix', domains: ['netflix.com', 'nflxvideo.net', 'nflximg.net', 'nflxext.com'] },
      { id: 'disneyplus', name: 'Disney+', domains: ['disneyplus.com', 'disney-plus.net', 'dssott.com', 'bamgrid.com'], features: [
        { id: 'dp-home', name: 'Home/Browse', type: 'url', urlFilter: '/home', requestDomains: ['disneyplus.com'] },
      ]},
      { id: 'hulu', name: 'Hulu', domains: ['hulu.com', 'hulustream.com', 'huluim.com'], features: [
        { id: 'hu-home', name: 'Home/Browse', type: 'url', urlFilter: '/hub', requestDomains: ['hulu.com'] },
      ]},
      { id: 'twitch', name: 'Twitch', domains: ['twitch.tv', 'twitchcdn.net', 'jtvnw.net'], features: [
        { id: 'tw-browse', name: 'Browse', type: 'url', urlFilter: '/directory', requestDomains: ['twitch.tv'] },
        { id: 'tw-clips', name: 'Clips', type: 'url', urlFilter: '/clip', requestDomains: ['twitch.tv'] },
        { id: 'tw-chat', name: 'Chat', type: 'element', selector: '.chat-shell, [data-a-target="chat-input"], .stream-chat' },
        { id: 'tw-recommendations', name: 'Recommendations', type: 'element', selector: '.side-nav-section[aria-label*="Also Watch"], .side-nav-section[aria-label*="Recommended"], .recommended-channels, [data-a-target="recommended-channel"]' },
        { id: 'tw-subs-only', name: 'Followed Only', type: 'allowlist', description: 'Only allow streams from channels you follow' },
        { id: 'twtv-ads', name: 'Pre-roll Ads', type: 'element', selector: '[data-a-target="video-ad-overlay"], [data-a-target="video-ad-label"], [class*="ad-overlay"]' },
        { id: 'twtv-bits', name: 'Bits/Donations', type: 'element', selector: 'button[aria-label*="Bits"], [data-a-target="bits-button"], [class*="bits"]' },
        { id: 'twtv-sub-btn', name: 'Subscribe Button', type: 'element', selector: '[data-a-target="subscribe-button"], [data-a-target="subscribed-button"]' },
        { id: 'twtv-prime', name: 'Prime Upsell', type: 'element', selector: '[data-a-target="prime-offer"], .prime-offers' },
      ]},
      { id: 'primevideo', name: 'Prime Video', domains: ['primevideo.com', 'amazonvideo.com'], features: [
        { id: 'pv-store', name: 'Store/Buy', type: 'element', selector: '[data-testid="buy-button"], .o_purchase-button' },
      ]},
      { id: 'crunchyroll', name: 'Crunchyroll', domains: ['crunchyroll.com', 'vrv.co'] },
    ]
  },
  {
    id: 'ads-trackers',
    name: 'Ads & Trackers',
    description: 'Trip ads and tracking',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
    defaultOn: false,
    cfType: 'content_category',
    cfCategoryIds: [66],
    sites: [
      { id: 'network-ads', name: 'Ads', domains: ['doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'facebook.net', 'amazon-adsystem.com'] },
      { id: 'cookie-popups', name: 'Cookie Popups', domains: ['onetrust.com', 'cookiebot.com', 'quantcast.com', 'trustarc.com'], features: [
        { id: 'cookie-css', name: 'Cookie Banner CSS', type: 'element', global: true, selector: '#onetrust-banner-sdk, #onetrust-consent-sdk, .onetrust-pc-dark-filter, #CybotCookiebotDialog, #CybotCookiebotDialogBodyUnderlay, .cmp-container, [id^="sp_message_container"], .sp_message_open, #sp_message_overlay, .fc-consent-root, .fc-dialog-overlay, #qc-cmp2-container, .qc-cmp2-container, #truste-consent-track, .trustarc-banner, #didomi-host, .didomi-popup-container, [class*="consent-banner"], [id*="consent-banner"], .js-consent-banner, #usercentrics-root, .iubenda-cs-container, #cookiescript_injected, [id*="cookie-law"], [class*="cookie-banner"], [id*="cookie-banner"], [class*="cookie-notice"], [id*="cookie-notice"], .cc-window, .cc-banner, #sp-cc-wrapper, #cos-banner, #gdpr-banner, #gdpr-banner-container, #gdpr-new-container, [class*="_shein_privacy"], #gdpr-single-choice-overlay, tiktok-cookie-banner, #cookie-consent, .osano-cm-window, .evidon-consent-button, [data-testid="cookie-policy-manage-dialog"], .almacmp-modalwrap, #ppms_cm_popup_overlay, .cmpboxBG, #cmpbox, #cmpbox2, .cmp-root, [id*="cookie-preferences"], [class*="cookie-consent"], [id*="cookieconsent"], [data-testid="consent-banner"], [data-testid="main-cookies-banner-container"]' },
      ]},
      { id: 'analytics', name: 'Google Analytics', domains: ['google-analytics.com', 'analytics.google.com', 'googletagmanager.com'] },
    ]
  },
  {
    id: 'adult-content',
    name: 'Adult Content',
    description: 'Trip adult material',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
    defaultOn: false,
    cfType: 'content_category',
    cfCategoryIds: [67, 125, 133],
    sites: [
      { id: 'pornhub', name: 'Pornhub', domains: ['pornhub.com', 'phncdn.com'] },
      { id: 'xvideos', name: 'XVideos', domains: ['xvideos.com', 'xnxx.com'] },
      { id: 'onlyfans', name: 'OnlyFans', domains: ['onlyfans.com'] },
      { id: 'xhamster', name: 'xHamster', domains: ['xhamster.com'] },
      { id: 'redtube', name: 'RedTube', domains: ['redtube.com'] },
      { id: 'chaturbate', name: 'Chaturbate', domains: ['chaturbate.com'] },
    ]
  },
  {
    id: 'gambling',
    name: 'Gambling',
    description: 'Trip betting and gambling',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="4"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`,
    defaultOn: false,
    cfType: 'content_category',
    cfCategoryIds: [99],
    sites: [
      { id: 'bet365', name: 'Bet365', domains: ['bet365.com'] },
      { id: 'draftkings', name: 'DraftKings', domains: ['draftkings.com'] },
      { id: 'fanduel', name: 'FanDuel', domains: ['fanduel.com'] },
      { id: 'betfair', name: 'Betfair', domains: ['betfair.com'] },
      { id: 'williamhill', name: 'William Hill', domains: ['williamhill.com'] },
      { id: 'paddypower', name: 'Paddy Power', domains: ['paddypower.com'] },
      { id: 'pokerstars', name: 'PokerStars', domains: ['pokerstars.com', 'pokerstars.net'] },
      { id: 'ladbrokes', name: 'Ladbrokes', domains: ['ladbrokes.com'] },
    ]
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Trip gaming platforms',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="6"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="11" r="0.5" fill="currentColor" stroke="none"/><circle cx="17" cy="13" r="0.5" fill="currentColor" stroke="none"/></svg>`,
    defaultOn: false,
    cfType: 'domain',
    cfCategoryIds: [],
    sites: [
      { id: 'steam', name: 'Steam', domains: ['store.steampowered.com', 'steampowered.com', 'steamcommunity.com', 'steamstatic.com'], features: [
        { id: 'st-store', name: 'Store', type: 'url', urlFilter: '||store.steampowered.com', requestDomains: ['store.steampowered.com'] },
        { id: 'st-community', name: 'Community', type: 'url', urlFilter: '||steamcommunity.com', requestDomains: ['steamcommunity.com'] },
        { id: 'st-market', name: 'Market', type: 'url', urlFilter: '/market', requestDomains: ['steamcommunity.com'] },
      ]},
      { id: 'epic', name: 'Epic Games', domains: ['epicgames.com', 'unrealengine.com', 'fortnite.com'], features: [
        { id: 'ep-store', name: 'Store', type: 'url', urlFilter: '||store.epicgames.com', requestDomains: ['store.epicgames.com'] },
        { id: 'ep-fortnite', name: 'Fortnite', type: 'url', urlFilter: '||fortnite.com', requestDomains: ['fortnite.com'] },
      ]},
      { id: 'roblox', name: 'Roblox', domains: ['roblox.com', 'rbxcdn.com'], features: [
        { id: 'rb-catalog', name: 'Avatar Shop', type: 'url', urlFilter: '/catalog', requestDomains: ['roblox.com'] },
        { id: 'rb-discover', name: 'Discover', type: 'url', urlFilter: '/charts', requestDomains: ['roblox.com'] },
      ]},
      { id: 'riot', name: 'Riot Games', domains: ['riotgames.com', 'leagueoflegends.com'] },
      { id: 'ea', name: 'EA Games', domains: ['ea.com', 'origin.com'] },
      { id: 'minecraft', name: 'Minecraft', domains: ['minecraft.net', 'mojang.com'] },
    ]
  },
  {
    id: 'news',
    name: 'News',
    description: 'Trip news and doomscrolling',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><line x1="10" y1="6" x2="18" y2="6"/><line x1="10" y1="10" x2="18" y2="10"/><line x1="10" y1="14" x2="14" y2="14"/></svg>`,
    defaultOn: false,
    cfType: 'content_category',
    cfCategoryIds: [122],
    sites: [
      { id: 'cnn', name: 'CNN', domains: ['cnn.com', 'cnn.io'], features: [
        { id: 'cnn-video', name: 'Autoplay Video', type: 'element', selector: '.video-resource, .cn-video-player, [data-component-name="video-player"]' },
        { id: 'cnn-banner', name: 'Cookie/Consent', type: 'element', selector: '#onetrust-banner-sdk, .evidon-banner, [class*="consent-banner"], [id*="consent"]' },
        { id: 'cnn-trending', name: 'Trending', type: 'element', selector: '.container_ribbon, .zn-trending' },
      ]},
      { id: 'bbc-news', name: 'BBC News', domains: ['bbc.co.uk', 'bbc.com', 'bbci.co.uk'], features: [
        { id: 'bbc-cookie', name: 'Cookie Banner', type: 'element', selector: '#cookie-banner, .fc-consent-root, [id*="consent"]' },
        { id: 'bbc-video', name: 'Autoplay Video', type: 'element', selector: '[class*="media-player"], [class*="MediaPlayer"], [data-testid="portrait-video-experience"], video' },
        { id: 'bbc-comments', name: 'Comments', type: 'element', selector: '[data-testid="participate:comments"], #comments-container' },
        { id: 'bbc-related', name: 'Related Stories', type: 'element', selector: '[data-component="mostRead"], [data-component="mostWatched"], [data-testid="related-topics"]' },
      ]},
      { id: 'foxnews', name: 'Fox News', domains: ['foxnews.com', 'foxbusiness.com'], features: [
        { id: 'fox-video', name: 'Autoplay Video', type: 'element', selector: '.video-container, video, [class*="video-player"]' },
        { id: 'fox-trending', name: 'Trending', type: 'element', selector: '[class*="trending"], .sidebar .collection' },
      ]},
      { id: 'dailymail', name: 'Daily Mail', domains: ['dailymail.co.uk', 'mailonline.com'], features: [
        { id: 'dm-sidebar', name: 'Sidebar of Shame', type: 'element', selector: '[class*="right-column"], #content .beta' },
        { id: 'dm-comments', name: 'Comments', type: 'element', selector: '#reader-comments, .article-reader-comments, #reader-comments-container' },
        { id: 'dm-related', name: 'Related Articles', type: 'element', selector: '.related-carousel, .mol-fe-related-articles, [class*="related"]' },
        { id: 'dm-video', name: 'Autoplay Video', type: 'element', selector: '.vjs-tech, .vjs-player, video' },
      ]},
      { id: 'nytimes', name: 'NY Times', domains: ['nytimes.com', 'nyt.com'], features: [
        { id: 'nyt-paywall', name: 'Paywall Overlay', type: 'element', selector: '#gateway-content, [data-testid="inline-message"], [class*="gateway"], [class*="Paywall"]' },
        { id: 'nyt-comments', name: 'Comments', type: 'element', selector: '#commentsContainer, #comments-panel, [data-testid="comments"]' },
        { id: 'nyt-cookie', name: 'Cookie Banner', type: 'element', selector: '#fides-banner, [data-testid="GDPR-consent"], #complianceOverlay' },
      ]},
      { id: 'theguardian', name: 'The Guardian', domains: ['theguardian.com', 'guim.co.uk'], features: [
        { id: 'gu-donate', name: 'Donation Banner', type: 'element', selector: '.contributions-banner, [data-component="reader-revenue-banner"], .site-message' },
        { id: 'gu-comments', name: 'Comments', type: 'element', selector: '#comments, .discussion__comments, [data-component="discussion"], gu-island[name*="Discussion"]' },
        { id: 'gu-related', name: 'More Stories', type: 'element', selector: 'gu-island[name="OnwardsUpper"], gu-island[name="MostViewedFooterData"], gu-island[name="MostViewedRightWithAd"], [data-component="more-on-this-story"], [data-component="most-popular"], [data-link-name*="most-viewed"]' },
        { id: 'gu-cookie', name: 'Cookie Banner', type: 'element', selector: '[id^="sp_message_container"], .js-manage-consent, .cmp-container' },
      ]},
      { id: 'buzzfeed', name: 'BuzzFeed', domains: ['buzzfeed.com', 'buzzfeednews.com'] },
      { id: 'huffpost', name: 'HuffPost', domains: ['huffpost.com', 'huffingtonpost.com'] },
    ]
  },
  {
    id: 'dating',
    name: 'Dating',
    description: 'Trip dating apps and sites',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    defaultOn: false,
    cfType: 'domain',
    cfCategoryIds: [],
    sites: [
      { id: 'tinder', name: 'Tinder', domains: ['tinder.com', 'gotinder.com'] },
      { id: 'bumble', name: 'Bumble', domains: ['bumble.com'] },
      { id: 'hinge', name: 'Hinge', domains: ['hinge.co'] },
      { id: 'match', name: 'Match.com', domains: ['match.com'] },
      { id: 'okcupid', name: 'OkCupid', domains: ['okcupid.com'] },
      { id: 'grindr', name: 'Grindr', domains: ['grindr.com'] },
    ]
  },
  {
    id: 'shopping',
    name: 'Shopping',
    description: 'Trip online shopping',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
    defaultOn: false,
    cfType: 'domain',
    cfCategoryIds: [],
    sites: [
      { id: 'amazon', name: 'Amazon', domains: ['amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr'], features: [
        { id: 'az-deals', name: 'Deals', type: 'url', urlFilter: '/deals', requestDomains: ['amazon.com', 'amazon.co.uk'] },
        { id: 'az-recommendations', name: 'Recommendations', type: 'element', selector: '#similarities_feature_div, #sp_detail, #sponsoredProducts2_feature_div, .a-carousel-container, .feed-carousel' },
        { id: 'az-buy-again', name: 'Buy Again', type: 'element', selector: '[data-component-type="s-impression-counter"], [data-component-type="s-reorder-items"]' },
        { id: 'az-sponsored', name: 'Sponsored Products', type: 'element', selector: '#sponsoredProducts2_feature_div, .puis-sponsored-label-text, .AdHolder, #sp_detail' },
        { id: 'az-prime-upsell', name: 'Prime Upsell', type: 'element', selector: '#primeDPUpsellStaticContainerNPA, #prime-desktop-dp_feature_div_01, .prime-upsell, [data-testid="prime-banner"]' },
        { id: 'az-reviews', name: 'Reviews', type: 'element', selector: '#reviews-medley-footer, #reviewsMedley, #customerReviews' },
        { id: 'az-subscribe-save', name: 'Subscribe & Save', type: 'element', selector: '#snsAccordionRowMiddle, .sns-widget' },
      ]},
      { id: 'ebay', name: 'eBay', domains: ['ebay.com', 'ebay.co.uk'], features: [
        { id: 'eb-deals', name: 'Daily Deals', type: 'url', urlFilter: '/deals', requestDomains: ['ebay.com', 'ebay.co.uk'] },
      ]},
      { id: 'aliexpress', name: 'AliExpress', domains: ['aliexpress.com'] },
      { id: 'shein', name: 'Shein', domains: ['shein.com', 'shein.co.uk'] },
      { id: 'temu', name: 'Temu', domains: ['temu.com'] },
      { id: 'asos', name: 'ASOS', domains: ['asos.com'] },
      { id: 'etsy', name: 'Etsy', domains: ['etsy.com'] },
      { id: 'wish', name: 'Wish', domains: ['wish.com'] },
    ]
  },
  {
    id: 'ai',
    name: 'AI',
    description: 'Trip AI chatbots and tools',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14h.01"/><path d="M8 14h.01"/><path d="M12 18v4"/><path d="M8 22h8"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M12 2V0"/></svg>`,
    defaultOn: false,
    cfType: 'domain',
    cfCategoryIds: [],
    sites: [
      { id: 'chatgpt', name: 'ChatGPT', domains: ['chat.openai.com', 'chatgpt.com', 'openai.com'], features: [
        { id: 'gpt-image', name: 'Image Gen', type: 'url', urlFilter: '/g/g-2fkFE8rbu-dall-e', requestDomains: ['chatgpt.com'], elementSelectors: ['[role="menuitemradio"]', '[data-testid="use-case-prompt-chips"]'] },
        { id: 'gpt-browse', name: 'Web Browse', type: 'element', selector: '[data-testid="use-case-prompt-chips"]' },
      ]},
      { id: 'claude', name: 'Claude', domains: ['claude.ai', 'anthropic.com'] },
      { id: 'gemini', name: 'Gemini', domains: ['gemini.google.com', 'bard.google.com'] },
      { id: 'copilot', name: 'Copilot', domains: ['copilot.microsoft.com', 'bing.com'] },
      { id: 'perplexity', name: 'Perplexity', domains: ['perplexity.ai'] },
      { id: 'midjourney', name: 'Midjourney', domains: ['midjourney.com'], features: [
        { id: 'mj-explore', name: 'Explore', type: 'url', urlFilter: '/explore', requestDomains: ['midjourney.com'] },
      ]},
      { id: 'character-ai', name: 'Character.AI', domains: ['character.ai', 'beta.character.ai'] },
      { id: 'poe', name: 'Poe', domains: ['poe.com'] },
      { id: 'google-ai', name: 'Google AI', domains: ['google.com', 'google.co.uk'], features: [
        { id: 'ggl-ai-overview', name: 'AI Overview', type: 'element', selector: '#m-x-content, .OZ9ddf, .M8OgIe, div:has(> .nk9vdc)' },
        { id: 'ggl-ai-mode', name: 'AI Mode Tab', type: 'element', selector: 'a[href*="udm=50"]' },
        { id: 'ggl-paa', name: 'People Also Ask', type: 'element', selector: 'div.related-question-pair, div[data-sgrd], [data-initq]' },
      ]},
    ]
  },
  {
    id: 'crypto',
    name: 'Crypto',
    description: 'Trip crypto exchanges and wallets',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    defaultOn: false,
    cfType: 'domain',
    cfCategoryIds: [],
    sites: [
      { id: 'coinbase', name: 'Coinbase', domains: ['coinbase.com'] },
      { id: 'binance', name: 'Binance', domains: ['binance.com', 'binance.us'] },
      { id: 'crypto-com', name: 'Crypto.com', domains: ['crypto.com'] },
      { id: 'kraken', name: 'Kraken', domains: ['kraken.com'] },
      { id: 'opensea', name: 'OpenSea', domains: ['opensea.io'] },
      { id: 'metamask', name: 'MetaMask', domains: ['metamask.io'] },
      { id: 'coingecko', name: 'CoinGecko', domains: ['coingecko.com'] },
      { id: 'coinmarketcap', name: 'CoinMarketCap', domains: ['coinmarketcap.com'] },
    ]
  },
  {
    id: 'security-threats',
    name: 'Security',
    description: 'Trip malware, phishing, and spyware',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>`,
    defaultOn: true,
    cfType: 'security_category',
    cfCategoryIds: [68, 178, 80, 83, 176, 175, 117, 131, 134, 151, 153],
    sites: [
      { id: 'malware', name: 'Malware', domains: [] },
      { id: 'phishing', name: 'Phishing', domains: [] },
      { id: 'spyware', name: 'Spyware', domains: [] },
      { id: 'cryptomining', name: 'Cryptomining', domains: [] },
      { id: 'botnet', name: 'Botnets', domains: [] },
      { id: 'command-control', name: 'C&C Servers', domains: [] },
    ]
  },
];

// Generate Cloudflare Gateway traffic expression from selections
function generatePolicies(state) {
  const policies = [];

  for (const category of categories) {
    const catState = state[category.id];
    if (!catState || !catState.enabled) continue;

    // Check if all sites are selected or individual picks
    const allSitesOn = category.sites.length === 0 ||
      category.sites.every(s => catState.sites?.[s.id] !== false);

    if (allSitesOn && category.cfType === 'content_category') {
      policies.push({
        name: `Circuit Breaker - Off ${category.name}`,
        action: 'block',
        traffic: `any(dns.content_category[*] in {${category.cfCategoryIds.join(' ')}})`,
        enabled: true,
      });
    } else if (allSitesOn && category.cfType === 'security_category') {
      policies.push({
        name: `Circuit Breaker - Off ${category.name}`,
        action: 'block',
        traffic: `any(dns.security_category[*] in {${category.cfCategoryIds.join(' ')}})`,
        enabled: true,
      });
    } else {
      // Individual site selection — use domain-based rules
      const selectedDomains = category.sites
        .filter(s => catState.sites?.[s.id] !== false)
        .flatMap(s => s.domains);

      if (selectedDomains.length > 0) {
        const domainList = selectedDomains.map(d => `"${d}"`).join(' ');
        policies.push({
          name: `Circuit Breaker - Off ${category.name} (Custom)`,
          action: 'block',
          traffic: `any(dns.domains[*] in {${domainList}})`,
          enabled: true,
        });
      }
    }
  }

  return policies;
}

// Generate policies for custom domains
function generateCustomPolicy(domains) {
  if (!domains || domains.length === 0) return null;
  const domainList = domains.map(d => `"${d}"`).join(' ');
  return {
    name: 'Circuit Breaker - Custom Sites Off',
    action: 'block',
    traffic: `any(dns.domains[*] in {${domainList}})`,
    enabled: true,
  };
}
