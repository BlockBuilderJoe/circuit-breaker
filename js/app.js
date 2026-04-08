// Circuit Breaker Web Dashboard — Main Application Logic

const SYNC_KEYS = ['selections', 'blockedDomains', 'blockedUrls', 'hiddenSelectors', 'allowedChannels', 'subsOnlyMode'];

// Brand logos (official SVG marks) + colors for site labels
const BRANDS = {
  // Social Media
  youtube:    { logo: '<svg viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>' },
  tiktok:     { logo: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>' },
  instagram:  { logo: '<svg viewBox="0 0 24 24" fill="#E4405F"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 1 0 0-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 1 1-2.88 0 1.441 1.441 0 0 1 2.88 0z"/></svg>' },
  facebook:   { logo: '<svg viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' },
  twitter:    { logo: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
  snapchat:   { logo: '<svg viewBox="0 0 24 24" fill="#FFFC00"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.959-.289.21-.12.405-.07.585.015.21.12.345.27.345.48 0 .36-.27.585-.63.72-.36.135-.8.235-1.28.3-.105.015-.18.03-.255.06l-.014.004c-.06.015-.12.045-.165.09-.12.135-.12.33-.165.555-.03.13-.09.255-.165.36-.12.165-.315.27-.585.27-.15 0-.3-.03-.45-.075-.255-.06-.555-.12-.855-.12-.195 0-.39.015-.585.06-.33.075-.63.21-.915.42-.435.315-1.005.75-2.175.75s-1.74-.45-2.175-.75c-.285-.21-.585-.345-.915-.42a3.612 3.612 0 0 0-.585-.06c-.3 0-.6.06-.855.12a1.71 1.71 0 0 1-.45.075c-.345 0-.585-.165-.66-.375-.06-.12-.105-.24-.135-.375-.045-.225-.045-.42-.165-.555a.394.394 0 0 0-.18-.09c-.06-.03-.15-.045-.255-.06a4.898 4.898 0 0 1-1.28-.3 1.19 1.19 0 0 1-.465-.285.614.614 0 0 1-.165-.435c0-.21.135-.375.345-.48.18-.09.375-.135.585-.015.3.165.66.27.96.285.18 0 .33-.045.405-.09a17.13 17.13 0 0 1-.033-.57c-.104-1.628-.23-3.654.3-4.846C5.653 1.069 9.015.793 10.005.793h2.2z"/></svg>' },
  reddit:     { logo: '<svg viewBox="0 0 24 24" fill="#FF4500"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>' },
  pinterest:  { logo: '<svg viewBox="0 0 24 24" fill="#BD081C"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/></svg>' },
  linkedin:   { logo: '<svg viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>' },
  // Video Streaming
  netflix:    { logo: '<svg viewBox="0 0 24 24" fill="#E50914"><path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c.043.007.145 0 .145 0V0h-4.858zM.6 0v24c1.317-.012 3.072-.048 4.603-.104L.6 0z"/></svg>' },
  twitch:     { logo: '<svg viewBox="0 0 24 24" fill="#9146FF"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>' },
  hulu:       { logo: '<svg viewBox="0 0 24 24" fill="#1CE783"><path d="M1.592 5.14v13.718h3.022V11.93c0-.86.065-1.278.517-1.733.452-.453.86-.518 1.72-.518h1.246c.86 0 1.278.065 1.733.518.453.452.518.86.518 1.72v7.075h3.022V11.93c0-.86.065-1.278.517-1.733.452-.453.86-.518 1.72-.518h1.246c.86 0 1.278.065 1.733.518.453.452.518.86.518 1.72v7.075H22.4v-7.683c0-1.883-.29-2.676-1.379-3.766-1.09-1.09-1.883-1.379-3.766-1.379h-1.246c-1.883 0-2.676.29-3.766 1.379-.34.34-.595.657-.79.99-.196-.333-.45-.65-.791-.99-1.09-1.09-1.883-1.379-3.766-1.379H5.65c-1.883 0-2.676.29-3.766 1.379-.08.08-.152.158-.223.237V5.14z"/></svg>' },
  primevideo: { logo: '<svg viewBox="0 0 24 24" fill="#00A8E1"><path d="M1.08 12.394c-.076-.22-.105-.474-.105-.728V7.438c0-.254.03-.508.106-.728a1.26 1.26 0 0 1 .343-.537c.153-.14.34-.25.558-.322.22-.073.474-.11.762-.11.288 0 .541.037.762.11.22.073.406.183.558.322.153.14.267.317.343.537.077.22.106.474.106.728v4.228c0 .254-.03.508-.106.728a1.26 1.26 0 0 1-.343.537 1.572 1.572 0 0 1-.558.322c-.22.073-.474.11-.762.11-.288 0-.541-.037-.762-.11a1.572 1.572 0 0 1-.558-.322 1.26 1.26 0 0 1-.343-.537zm18.612 5.832c-2.29 1.676-5.612 2.57-8.47 2.57-4.006 0-7.613-1.482-10.338-3.948-.214-.194-.023-.458.235-.308 2.944 1.713 6.585 2.744 10.346 2.744 2.537 0 5.326-.526 7.893-1.615.387-.165.711.254.334.557z"/></svg>' },
  crunchyroll:{ logo: '<svg viewBox="0 0 24 24" fill="#F47521"><path d="M2.933 13.467a10.08 10.08 0 0 1-.146-1.72C2.787 6.558 7.175 2.17 12.363 2.17c5.187 0 9.389 4.202 9.576 9.389a9.558 9.558 0 0 1-3.498 7.615 6.108 6.108 0 0 0 1.482-3.972 6.176 6.176 0 0 0-6.176-6.176 6.176 6.176 0 0 0-6.176 6.176c0 1.096.293 2.122.8 3.01A9.503 9.503 0 0 1 2.933 13.467zM0 11.747C0 18.25 5.26 23.51 11.762 23.51a11.762 11.762 0 0 0 11.03-7.637A11.24 11.24 0 0 1 12.363.49C5.674.49 0 5.535 0 11.747z"/></svg>' },
  // Gaming
  steam:      { logo: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.373 12-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.974 1.3 1.191a2.263 2.263 0 0 0 2.898-1.354 2.253 2.253 0 0 0-.128-1.737 2.243 2.243 0 0 0-1.224-1.112 2.257 2.257 0 0 0-1.704.022l1.522.629c.832.344 1.227 1.294.883 2.122-.344.83-1.242 1.193-2.074.849zm8.398-9.3c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/></svg>' },
  roblox:     { logo: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M5.164 0L0 18.627 18.836 24 24 5.373zm8.478 15.264l-4.86-1.299 1.296-4.858 4.86 1.299z"/></svg>' },
  epic:       { logo: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M3.537 0C2.165 0 1.66.506 1.66 1.879V22.12c0 1.374.504 1.88 1.877 1.88h16.926c1.374 0 1.877-.506 1.877-1.88V1.88C22.34.506 21.837 0 20.463 0zM15.1 3.27h2.344v7.207h-3.848V7.598H15.1zm-4.17 0h3.849v2.122h-1.505v1.04h1.355v1.805h-1.355v1.04h1.505v2.13H10.93zm-4.148 0h2.345v5.085h1.504v2.122H6.782zm4.148 7.588h3.849v7.208H14.6V16.88h-1.504v1.186h-2.165zm-4.148 0h2.826v2.084H8.93v3.04h-1.56v-3.04H6.782zm8.297 2.084v3.04h1.505v-3.04z"/></svg>' },
  riot:       { logo: '<svg viewBox="0 0 24 24" fill="#D32936"><path d="M12.534 1.67L1.603 6.752l2.915 13.862 3.458-.443V9.618h8.297l.647-2.726h-8.48L12.535 1.67zM22.397 5.04l-6.12 2.347-.67 2.828h4.727v10.436l-8.696 1.114 4.08-9.798h-2.9L8.65 22.469l13.748-1.762z"/></svg>' },
  ea:         { logo: '<svg viewBox="0 0 24 24" fill="#fff"><rect width="24" height="24" rx="4" fill="#000"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="11" font-weight="900" font-family="Arial">EA</text></svg>' },
  minecraft:  { logo: '<svg viewBox="0 0 24 24" fill="#62B47A"><path d="M1.483 0l10.27 4.45L22.518 0l.093 15.32L12.002 24 1.39 15.32zm2.23 3.625v7.556l3.155 2.35V6.612l3.619-1.455-3.5-1.56zm13.572 0l-3.272 1.56 3.618 1.455v6.919l3.155-2.35V3.625z"/></svg>' },
  // Shopping
  amazon:     { logo: '<svg viewBox="0 0 24 24" fill="#FF9900"><path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.222-.1.383-.056.479.134.104.21.022.39-.22.53-.463.27-.96.51-1.493.722-1.808.715-3.682 1.198-5.622 1.447C12.04 22.62 9.9 22.47 7.833 21.93c-2.068-.54-3.96-1.41-5.676-2.608-.337-.237-.51-.484-.507-.738.003-.13.048-.24.14-.324zM6.67 15.63c0 .704.233 1.24.7 1.612.464.37 1.104.555 1.92.555.975 0 1.766-.363 2.373-1.088.606-.726.907-1.622.907-2.688v-.674a9.558 9.558 0 0 0-2.37-.216c-1.087.007-1.917.232-2.49.671-.577.44-.866 1.039-.866 1.8l-.174.028zm9.479-6.55c0 .738.01 1.36.03 1.86.02.5.07.936.15 1.312.08.376.194.67.345.878.15.21.35.312.596.312.298 0 .573-.14.83-.42.252-.278.47-.657.648-1.14.18-.482.316-1.04.414-1.668.095-.63.144-1.3.144-2.012 0-1.03-.1-1.958-.3-2.786-.2-.827-.5-1.527-.9-2.102-.4-.576-.89-1.015-1.47-1.32A4.28 4.28 0 0 0 14.7 1.5c-.67 0-1.3.163-1.88.49-.59.325-1.097.78-1.528 1.363-.43.584-.77 1.28-1.013 2.087-.243.808-.366 1.69-.366 2.645V9h4.236z"/></svg>' },
  ebay:       { logo: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#fff"/><text x="12" y="16" text-anchor="middle" font-size="9" font-weight="900" font-family="Arial"><tspan fill="#E53238">e</tspan><tspan fill="#0064D2">b</tspan><tspan fill="#F5AF02">a</tspan><tspan fill="#86B817">y</tspan></text></svg>' },
  aliexpress: { logo: '<svg viewBox="0 0 24 24" fill="#FF4747"><rect width="24" height="24" rx="4"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="8" font-weight="bold" font-family="Arial">Ali</text></svg>' },
  shein:      { logo: '<svg viewBox="0 0 24 24" fill="#000"><rect width="24" height="24" rx="4"/><text x="12" y="15" text-anchor="middle" fill="#fff" font-size="7" font-weight="900" font-family="Arial">SHEIN</text></svg>' },
  temu:       { logo: '<svg viewBox="0 0 24 24" fill="#FB6F20"><rect width="24" height="24" rx="4"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="8" font-weight="900" font-family="Arial">Temu</text></svg>' },
  asos:       { logo: '<svg viewBox="0 0 24 24" fill="#000"><rect width="24" height="24" rx="4"/><text x="12" y="15" text-anchor="middle" fill="#fff" font-size="7" font-weight="900" font-family="Arial">ASOS</text></svg>' },
  etsy:       { logo: '<svg viewBox="0 0 24 24" fill="#F16521"><path d="M8.559 3.074H7.06c-.27 0-.395.076-.467.283L4.677 9.551H4.57L3.127 3.462C3.059 3.167 2.994 3.074 2.72 3.074H1.228c-.3 0-.382.136-.299.418l2.504 8.89c.043.153.043.268 0 .418L1.36 18.432c-.1.317.005.454.3.454h1.462c.27 0 .393-.072.47-.283l6.09-15.112c.09-.22.01-.417-.282-.417zm6.93 9.753c-.844.43-1.776.61-2.644.61-1.414 0-2.127-.754-2.127-2.14V9.3c0-1.436.713-2.194 2.072-2.194.913 0 1.785.186 2.699.638V5.877c-.867-.408-1.841-.616-2.786-.616-3.16 0-4.712 1.752-4.712 4.743v1.363c0 2.93 1.442 4.645 4.33 4.645 1.143 0 2.22-.236 3.168-.725v-2.46zM24 3.074h-1.462c-.27 0-.393.072-.47.283l-2.99 7.418h-.108l-1.497-7.283c-.068-.295-.133-.418-.407-.418h-1.49c-.3 0-.383.136-.3.418l2.748 10.312c.043.153.043.268 0 .418L16.01 18.43c-.098.318.005.455.3.455h1.463c.27 0 .393-.072.469-.283L24.3 3.491c.087-.22.008-.417-.3-.417z"/></svg>' },
  wish:       { logo: '<svg viewBox="0 0 24 24" fill="#2FB7EC"><rect width="24" height="24" rx="4"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="8" font-weight="900" font-family="Arial">Wish</text></svg>' },
  // AI
  chatgpt:    { logo: '<svg viewBox="0 0 24 24" fill="#10A37F"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073z"/></svg>' },
  claude:     { logo: '<svg viewBox="0 0 24 24" fill="#D97757"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.248 17.474l-1.482-.856-.72 1.248c-.254.44-.88.44-1.135 0l-.72-1.248-1.481.856c-.44.254-.99-.12-.88-.627l.399-1.664-1.663-.399c-.507-.122-.627-.672-.254-.99l1.248-.72-.856-1.482c-.254-.44.12-.99.627-.88l1.664.399.399-1.663c.122-.508.672-.628.99-.254l.72 1.247 1.482-.855c.44-.254.99.12.88.627l-.4 1.664 1.664.399c.508.122.627.672.254.99l-1.247.72.855 1.481c.254.44-.12.99-.627.88l-1.663-.399-.4 1.664c-.12.507-.67.627-.99.254z"/></svg>' },
  gemini:     { logo: '<svg viewBox="0 0 24 24" fill="#8E75B2"><path d="M12 0C6.267 0 1.2 4.267.133 9.867a.6.6 0 0 0 .6.733h4.534a.6.6 0 0 0 .574-.433A6.667 6.667 0 0 1 12 5.333 6.667 6.667 0 0 1 18.16 10.167a.6.6 0 0 0 .573.433h4.534a.6.6 0 0 0 .6-.733C22.8 4.267 17.733 0 12 0zm0 13.4a.6.6 0 0 0-.6.6v9.4a.6.6 0 0 0 .6.6.6.6 0 0 0 .6-.6V14a.6.6 0 0 0-.6-.6z"/></svg>' },
  copilot:    { logo: '<svg viewBox="0 0 24 24" fill="#0078D4"><rect width="24" height="24" rx="4"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold" font-family="Arial">Co</text></svg>' },
  perplexity: { logo: '<svg viewBox="0 0 24 24" fill="#20808D"><rect width="24" height="24" rx="4"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold" font-family="Arial">Px</text></svg>' },
  midjourney: { logo: '<svg viewBox="0 0 24 24" fill="#fff"><rect width="24" height="24" rx="4" fill="#000"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold" font-family="Arial">MJ</text></svg>' },
  'character-ai': { logo: '<svg viewBox="0 0 24 24" fill="#AB6CFF"><rect width="24" height="24" rx="12"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold" font-family="Arial">c.</text></svg>' },
  poe:        { logo: '<svg viewBox="0 0 24 24" fill="#5B4FDB"><rect width="24" height="24" rx="4"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="9" font-weight="900" font-family="Arial">Poe</text></svg>' },
  'google-ai':{ logo: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 24a12 12 0 1 0 0-24 12 12 0 0 0 0 24z" fill="#fff"/><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.992 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#4285F4"/></svg>' },
  // News
  cnn:        { logo: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#CC0000"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="9" font-weight="900" font-family="Arial">CNN</text></svg>' },
  'bbc-news': { logo: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#000"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="9" font-weight="900" font-family="Arial">BBC</text></svg>' },
  foxnews:    { logo: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#003366"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="8" font-weight="900" font-family="Arial">FOX</text></svg>' },
  dailymail:  { logo: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#004DB3"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="8" font-weight="900" font-family="Arial">DM</text></svg>' },
  nytimes:    { logo: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#000"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="8" font-weight="900" font-family="Arial">NYT</text></svg>' },
  theguardian:{ logo: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#052962"/><text x="12" y="14" text-anchor="middle" fill="#FFCE4A" font-size="20" font-weight="900" font-family="Georgia">g</text></svg>' },
  buzzfeed:   { logo: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#E32"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="8" font-weight="900" font-family="Arial">BF</text></svg>' },
  huffpost:   { logo: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#0DBE00"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="8" font-weight="900" font-family="Arial">HP</text></svg>' },
  // Dating
  tinder:     { logo: '<svg viewBox="0 0 24 24" fill="#FF6B6B"><path d="M9.592 3.8C10.047 2.422 11.088.792 12.76.06c.162-.07.353.024.389.196.218 1.04.906 2.545 2.088 3.742 2.338 2.37 4.57 5.003 4.57 8.99A7.828 7.828 0 0 1 12 20.747a7.828 7.828 0 0 1-7.808-7.76c0-3.142 1.02-5.7 3.242-8.04.23-.241.62-.097.652.234.088.894.376 2.172 1.506 2.56.136.047.28-.01.34-.138a6.37 6.37 0 0 0 .66-3.803z"/></svg>' },
  bumble:     { logo: '<svg viewBox="0 0 24 24" fill="#FFC629"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 14.653c0 1.8-1.4 3.248-3.123 3.248h-4.76c-1.723 0-3.117-1.447-3.117-3.248v-3.21c0-.27.048-.53.134-.77.383-1.068 1.396-1.832 2.588-1.832.305 0 .597.056.872.154.26-.098.549-.154.85-.154h.116c.303 0 .59.056.85.154a2.77 2.77 0 0 1 .872-.154c1.192 0 2.204.764 2.587 1.833.086.24.131.5.131.77z"/></svg>' },
  hinge:      { logo: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#000"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="9" font-weight="900" font-family="Arial">H</text></svg>' },
  // Crypto
  coinbase:   { logo: '<svg viewBox="0 0 24 24" fill="#0052FF"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18.96a6.96 6.96 0 1 1 0-13.92 6.96 6.96 0 0 1 0 13.92zm3.478-8.438H14.04v-1.44c0-.794-.644-1.438-1.44-1.438h-1.2c-.794 0-1.438.644-1.438 1.44v1.438H8.522a.72.72 0 0 0-.72.72v1.198c0 .398.322.72.72.72h1.44v1.44c0 .794.644 1.438 1.438 1.438h1.2c.796 0 1.44-.644 1.44-1.44V13.16h1.438a.72.72 0 0 0 .72-.72V11.24a.72.72 0 0 0-.72-.72z"/></svg>' },
  binance:    { logo: '<svg viewBox="0 0 24 24" fill="#F0B90B"><path d="M12 0L7.373 4.627l1.712 1.712L12 3.424l2.915 2.915 1.712-1.712zm-7.373 7.373L0 12l4.627 4.627 1.712-1.712L3.424 12l2.915-2.915zm14.746 0l-1.712 1.712L20.576 12l-2.915 2.915 1.712 1.712L24 12zM12 8.73L8.73 12 12 15.27 15.27 12zm0 15.27l4.627-4.627-1.712-1.712L12 20.576l-2.915-2.915-1.712 1.712z"/></svg>' },
  // Gambling
  bet365:     { logo: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#027B5B"/><text x="12" y="16" text-anchor="middle" fill="#FFD700" font-size="7" font-weight="900" font-family="Arial">bet365</text></svg>' },
  draftkings: { logo: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#53D337"/><text x="12" y="16" text-anchor="middle" fill="#000" font-size="7" font-weight="900" font-family="Arial">DK</text></svg>' },
  // Adult (generic colored blocks)
  pornhub:    { logo: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#FFA31A"/><text x="12" y="16" text-anchor="middle" fill="#000" font-size="8" font-weight="900" font-family="Arial">PH</text></svg>' },
  onlyfans:   { logo: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#00AFF0"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="8" font-weight="900" font-family="Arial">OF</text></svg>' },
};

// Categories are NOT brands — don't add ™
const CATEGORY_IDS = new Set(categories?.map(c => c.id) || []);

// --- DOM refs ---
const heroSection = document.getElementById('hero-section');
const authScreen = document.getElementById('auth-screen');
const dashScreen = document.getElementById('dashboard-screen');
const board = document.getElementById('breakerboard');
const nav = document.getElementById('nav');
const titleEl = document.getElementById('title');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const syncBadge = document.getElementById('sync-badge');

let selections = {};
let currentView = 'main';
let pushTimer = null;
let extensionConnected = false;

// --- Theme ---

function initTheme() {
  // Migrate old theme key
  const oldTheme = localStorage.getItem('fb_theme');
  if (oldTheme !== null) {
    localStorage.setItem('cb_theme', oldTheme);
    localStorage.removeItem('fb_theme');
  }
  const saved = localStorage.getItem('cb_theme');
  if (saved === 'light') {
    document.body.classList.add('light');
    document.getElementById('theme-icon-sun').style.display = 'none';
    document.getElementById('theme-icon-moon').style.display = '';
  }
  document.getElementById('nav-theme')?.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem('cb_theme', isLight ? 'light' : 'dark');
  document.getElementById('theme-icon-sun').style.display = isLight ? 'none' : '';
  document.getElementById('theme-icon-moon').style.display = isLight ? '' : 'none';
}

// --- Extension detection (via postMessage / dashboard-bridge.js) ---

function detectExtension() {
  // Listen for PONG from the dashboard-bridge content script
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'CB_PONG') {
      extensionConnected = true;
      updateExtensionBadge();
    }
  });

  // Send a ping — if extension is installed, bridge will respond with PONG
  window.postMessage({ type: 'CB_PING' }, '*');

  // If no response after 500ms, mark as disconnected
  setTimeout(() => {
    if (!extensionConnected) updateExtensionBadge();
  }, 500);
}

function updateExtensionBadge() {
  const badge = document.getElementById('ext-badge');
  const prompt = document.getElementById('install-prompt');
  if (badge) {
    if (extensionConnected) {
      badge.innerHTML = '<span class="ext-dot"></span> Connected';
      badge.className = 'ext-badge connected';
    } else {
      badge.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Not installed';
      badge.className = 'ext-badge disconnected';
    }
  }
  if (prompt) {
    prompt.style.display = extensionConnected ? 'none' : '';
    if (!extensionConnected) prompt.classList.add('needs-ext');
  }
}

function flashInstallPrompt() {
  if (extensionConnected) return;
  const prompt = document.getElementById('install-prompt');
  const badge = document.getElementById('ext-badge');
  [prompt, badge].forEach(el => {
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  });
}

function sendToExtension(data) {
  if (!extensionConnected) return;
  window.postMessage({ type: 'CB_UPDATE', ...data }, '*');
}

// --- Platform Detection ---

function detectPlatform() {
  const ua = navigator.userAgent;
  let browser = 'Chrome', store = '#';
  if (ua.includes('Edg/')) { browser = 'Edge'; store = '#'; }
  else if (ua.includes('Firefox')) { browser = 'Firefox'; store = '#'; }
  else if (ua.includes('Safari') && !ua.includes('Chrome')) { browser = 'Safari'; store = '#'; }
  else { browser = 'Chrome'; store = '#'; }

  // Update hero install button
  const heroName = document.getElementById('hero-browser-name');
  const heroLink = document.getElementById('hero-install');
  if (heroName) heroName.textContent = browser;
  if (heroLink) heroLink.href = store;

  // Update download section
  const dlName = document.getElementById('download-browser-name');
  const dlLink = document.getElementById('download-main');
  if (dlName) dlName.textContent = browser;
  if (dlLink) dlLink.href = store;
}

// --- Hero Army ---

function renderHeroArmy() {
  const container = document.getElementById('hero-army');
  if (!container) return;

  // All 12 categories in heroic formation — shield (security) center front
  // Back row: 6 characters, smaller
  // Front row: 6 characters, with security-threats in the center position
  const lineup = [
    // Back row (smaller)
    { id: 'ads-trackers', label: 'Ads', size: 42 },
    { id: 'adult-content', label: 'Adult', size: 42 },
    { id: 'gambling', label: 'Gambling', size: 44 },
    { id: 'dating', label: 'Dating', size: 48 },
    { id: 'crypto', label: 'Crypto', size: 44 },
    { id: 'news', label: 'News', size: 42 },
    // Front row (larger, center is biggest)
    { id: 'social-media', label: 'Social', size: 52 },
    { id: 'video-streaming', label: 'Streaming', size: 52 },
    { id: 'gaming', label: 'Gaming', size: 54 },
    { id: 'security-threats', label: 'Security', size: 64, center: true },
    { id: 'shopping', label: 'Shopping', size: 54 },
    { id: 'ai', label: 'AI', size: 52 },
  ];

  // Render in two rows
  const backRow = document.createElement('div');
  backRow.style.cssText = 'display:flex;align-items:flex-end;justify-content:center;gap:4px;margin-bottom:-8px;position:relative;z-index:0;opacity:.85';
  const frontRow = document.createElement('div');
  frontRow.style.cssText = 'display:flex;align-items:flex-end;justify-content:center;gap:6px;position:relative;z-index:1';

  lineup.forEach((ch, i) => {
    const svg = charSVG(ch.id, 'green'); // All in green "ready" state
    if (!svg) return;
    const wrap = document.createElement('div');
    wrap.className = 'hero-char' + (ch.center ? ' hero-char-center' : (i >= 6 ? ' hero-char-front' : ''));
    wrap.innerHTML = `<div style="width:${ch.size}px;height:${ch.size}px">${svg}</div><span class="hero-char-label">${ch.label}</span>`;
    if (i < 6) backRow.appendChild(wrap);
    else frontRow.appendChild(wrap);
  });

  container.appendChild(backRow);
  container.appendChild(frontRow);
}

// --- Init ---

function init() {
  initTheme();
  detectPlatform();
  renderHeroArmy();

  // Smooth scroll for hero CTA
  document.getElementById('hero-try')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('why')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Hero fuse clicks → scroll to dashboard and open that category
  document.querySelectorAll('.hv-cb[data-cat]').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      const catId = el.dataset.cat;
      currentView = catId;
      render();
      document.getElementById('circuitboard')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Migrate old selections key
  const oldSelections = localStorage.getItem('fb_selections');
  if (oldSelections !== null) {
    localStorage.setItem('cb_selections', oldSelections);
    localStorage.removeItem('fb_selections');
  }
  // Load selections from localStorage
  const saved = localStorage.getItem('cb_selections');
  if (saved) {
    try { selections = JSON.parse(saved); } catch {}
  }

  // Always show dashboard — no screen switching
  showDashboard(isSignedIn());
}

// --- Auth ---

function showAuthPanel() {
  const panel = document.getElementById('auth-panel');
  if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }

  // Close other panels
  document.getElementById('devices-panel').style.display = 'none';
  document.getElementById('settings-panel').style.display = 'none';
  panel.style.display = '';

  let selectedServer = HOSTED_SERVER;

  document.getElementById('auth-hosted-btn').onclick = () => {
    selectedServer = HOSTED_SERVER;
    document.getElementById('auth-server-row').style.display = 'none';
    document.getElementById('auth-hosted-btn').classList.add('selected');
    document.getElementById('auth-self-btn').classList.remove('selected');
  };

  document.getElementById('auth-self-btn').onclick = () => {
    selectedServer = '';
    document.getElementById('auth-server-row').style.display = '';
    document.getElementById('auth-self-btn').classList.add('selected');
    document.getElementById('auth-hosted-btn').classList.remove('selected');
  };

  document.getElementById('auth-signin-btn').onclick = () => doAuth('signin');
  document.getElementById('auth-register-btn').onclick = () => doAuth('signup');
  document.getElementById('auth-password').onkeydown = (e) => { if (e.key === 'Enter') doAuth('signin'); };

  async function doAuth(mode) {
    const server = selectedServer || document.getElementById('auth-server').value;
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errEl = document.getElementById('auth-error');
    errEl.style.display = 'none';

    if (!server || !email || !password) {
      errEl.textContent = 'All fields are required';
      errEl.style.display = '';
      return;
    }

    try {
      if (mode === 'signup') {
        await signUp(server, email, password);
      } else {
        await signIn(server, email, password);
      }
      // Push current local selections to server on first sign-in
      const payload = buildSettingsPayload();
      await push(payload);
      panel.style.display = 'none';
      updateSyncUI();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.style.display = '';
    }
  }
}

// --- Dashboard ---

async function showDashboard(pullFromServer) {
  // No screen switching — dashboard is always visible on the page

  initSelections();

  if (pullFromServer && isSignedIn()) {
    const settings = await pull();
    if (settings?.selections) {
      selections = settings.selections;
      initSelections();
    }
  }

  // Detect extension
  detectExtension();

  // Wire up header buttons
  document.getElementById('dash-devices-btn').onclick = () => {
    document.getElementById('settings-panel').style.display = 'none';
    document.getElementById('auth-panel').style.display = 'none';
    const panel = document.getElementById('devices-panel');
    panel.style.display = panel.style.display === 'none' ? '' : 'none';
    if (panel.style.display !== 'none') loadDevicesPanel();
  };

  document.getElementById('devices-close-btn').onclick = () => {
    document.getElementById('devices-panel').style.display = 'none';
  };

  document.getElementById('dash-settings-btn').onclick = () => {
    document.getElementById('devices-panel').style.display = 'none';
    document.getElementById('auth-panel').style.display = 'none';
    const panel = document.getElementById('settings-panel');
    panel.style.display = panel.style.display === 'none' ? '' : 'none';
    if (panel.style.display !== 'none') loadSettingsPanel();
  };

  document.getElementById('settings-close-btn').onclick = () => {
    document.getElementById('settings-panel').style.display = 'none';
  };

  document.getElementById('auth-close-btn').onclick = () => {
    document.getElementById('auth-panel').style.display = 'none';
  };

  // Sync banner
  document.getElementById('sync-signin-btn')?.addEventListener('click', showAuthPanel);

  updateSyncUI();
  render();
}

function updateSyncUI() {
  const banner = document.getElementById('sync-banner');
  const badge = syncBadge;

  if (isSignedIn()) {
    if (banner) banner.style.display = 'none';
    badge.textContent = 'synced v' + getSyncVersion();
    // Show devices/settings buttons
    document.getElementById('dash-devices-btn').style.display = '';
    document.getElementById('dash-settings-btn').style.display = '';
  } else {
    if (banner) banner.style.display = '';
    badge.textContent = 'local only';
    // Hide devices/settings when not signed in
    document.getElementById('dash-devices-btn').style.display = 'none';
    document.getElementById('dash-settings-btn').style.display = 'none';
  }
}

// --- Selections ---

function initSelections() {
  categories.forEach(cat => {
    if (!selections[cat.id]) {
      selections[cat.id] = { enabled: cat.defaultOn || false, sites: {}, features: {} };
    }
    (cat.sites || []).forEach(site => {
      if (selections[cat.id].sites[site.id] === undefined) {
        selections[cat.id].sites[site.id] = cat.defaultOn || false;
      }
      (site.features || []).forEach(f => {
        if (selections[cat.id].features[f.id] === undefined) {
          selections[cat.id].features[f.id] = cat.defaultOn || false;
        }
      });
    });
  });
}

function getWireColor(catId) {
  const s = selections[catId];
  if (!s || !s.enabled) return 'red';
  const cat = categories.find(c => c.id === catId);
  if (!cat.sites || cat.sites.length === 0) return 'green';
  const blocked = cat.sites.filter(site => s.sites[site.id]).length;
  if (blocked === 0) return 'red';
  if (blocked === cat.sites.length) return 'green';
  return 'amber';
}

// --- Render ---

let lastRenderedView = null;

function render() {
  const viewChanged = currentView !== lastRenderedView;
  lastRenderedView = currentView;
  if (currentView === 'main') renderMain(viewChanged);
  else if (currentView.includes('/')) renderFeatures(currentView, viewChanged);
  else renderSites(currentView, viewChanged);
}

function renderBreadcrumb(crumbs) {
  nav.innerHTML = '';
  const bc = document.createElement('div');

  // Hide breadcrumb on main view
  if (crumbs.length <= 1) {
    bc.className = 'breadcrumb breadcrumb-main';
    nav.appendChild(bc);
    return;
  }

  bc.className = 'breadcrumb';

  // Back arrow — goes to previous level
  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerHTML = '&larr;';
  backBtn.title = 'Back';
  const prevView = crumbs.length >= 2 ? crumbs[crumbs.length - 2].view : 'main';
  backBtn.addEventListener('click', () => { currentView = prevView; render(); });
  bc.appendChild(backBtn);

  crumbs.forEach((c, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'sep';
      sep.textContent = '\u203a';
      bc.appendChild(sep);
    }
    const btn = document.createElement('button');
    btn.className = 'crumb' + (i === crumbs.length - 1 ? ' current' : '');
    btn.textContent = c.label;
    if (c.view !== undefined && i < crumbs.length - 1) {
      btn.addEventListener('click', () => { currentView = c.view; render(); });
    }
    bc.appendChild(btn);
  });
  nav.appendChild(bc);
}

function renderMain(animate) {
  renderBreadcrumb([{ label: 'Circuit Breaker', view: 'main' }]);
  titleEl.textContent = '';
  board.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'cb-grid cb-grid-main' + (animate ? ' cb-grid-animate' : '');

  // Short labels for main grid — single line, punchy
  const SHORT = {'Social Media':'Social','Video Streaming':'Streaming','Ads & Trackers':'Ads','Adult Content':'Adult','Security':'Security'};

  categories.forEach((cat, ci) => {
    const isTripped = selections[cat.id]?.enabled || false;
    const wire = getWireColor(cat.id);
    const hasSites = (cat.sites || []).length > 0;
    const shortName = SHORT[cat.name] || cat.name;
    const cell = createFuseCell(shortName, isTripped, wire, hasSites ? (cat.sites.length + ' sites') : '', hasSites, cat.icon, null, cat.id);
    cell.style.animationDelay = (ci * 40) + 'ms';

    function toggleCat() {
      const s = selections[cat.id];
      s.enabled = !s.enabled;
      (cat.sites || []).forEach(site => {
        s.sites[site.id] = s.enabled;
        (site.features || []).forEach(f => { s.features[f.id] = s.enabled; });
      });
      cell.classList.add('just-toggled');
      setTimeout(() => cell.classList.remove('just-toggled'), 250);
      saveAndSync();
    }

    const trk = cell.querySelector('.cb-trk');
    trk.addEventListener('click', (e) => { e.stopPropagation(); toggleCat(); });
    trk.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleCat(); } });

    cell.addEventListener('click', (e) => {
      if (e.target.closest('.cb-trk')) return;
      if (hasSites) { currentView = cat.id; render(); }
    });

    grid.appendChild(cell);
  });
  board.appendChild(grid);
  updateStatus();
}

function renderSites(catId, animate) {
  const cat = categories.find(c => c.id === catId);
  if (!cat) { currentView = 'main'; render(); return; }

  renderBreadcrumb([
    { label: 'Circuit Breaker', view: 'main' },
    { label: cat.name, view: cat.id },
  ]);
  titleEl.textContent = '';
  board.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'cb-grid cb-grid-sub' + (animate ? ' cb-grid-animate' : '');

  (cat.sites || []).forEach((site, si) => {
    const isTripped = selections[cat.id].sites[site.id] || false;
    const hasFeatures = (site.features || []).length > 0;
    let wire = 'red';
    if (isTripped) {
      wire = 'green';
    } else if (hasFeatures) {
      const anyFeatOn = (site.features || []).some(f => selections[cat.id].features[f.id]);
      const allFeatOn = (site.features || []).every(f => selections[cat.id].features[f.id]);
      if (allFeatOn) wire = 'green';
      else if (anyFeatOn) wire = 'amber';
    }
    const showTripped = isTripped || wire !== 'red';
    const cell = createFuseCell(site.name, showTripped, wire, hasFeatures ? (site.features.length + ' features') : '', hasFeatures, '', site.id, cat.id);
    cell.style.animationDelay = (si * 40) + 'ms';

    function toggleSite() {
      selections[cat.id].sites[site.id] = !selections[cat.id].sites[site.id];
      const anySiteOn = Object.values(selections[cat.id].sites).some(v => v);
      selections[cat.id].enabled = anySiteOn;
      (site.features || []).forEach(f => {
        selections[cat.id].features[f.id] = selections[cat.id].sites[site.id];
      });
      cell.classList.add('just-toggled');
      setTimeout(() => cell.classList.remove('just-toggled'), 250);
      saveAndSync();
    }

    const trk = cell.querySelector('.cb-trk');
    trk.addEventListener('click', (e) => { e.stopPropagation(); toggleSite(); });
    trk.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleSite(); } });

    cell.addEventListener('click', (e) => {
      if (e.target.closest('.cb-trk')) return;
      if (hasFeatures) { currentView = cat.id + '/' + site.id; render(); }
    });

    grid.appendChild(cell);
  });
  board.appendChild(grid);
  updateStatus();
}

function renderFeatures(path, animate) {
  const [catId, siteId] = path.split('/');
  const cat = categories.find(c => c.id === catId);
  const site = cat?.sites?.find(s => s.id === siteId);
  if (!cat || !site) { currentView = 'main'; render(); return; }

  renderBreadcrumb([
    { label: 'Circuit Breaker', view: 'main' },
    { label: cat.name, view: catId },
    { label: site.name, view: catId + '/' + siteId },
  ]);
  titleEl.textContent = '';
  board.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'cb-grid cb-grid-sub' + (animate ? ' cb-grid-animate' : '');

  (site.features || []).forEach(feat => {
    const isTripped = selections[cat.id].features[feat.id] || false;
    const wire = isTripped ? 'green' : 'red';
    const cell = createFuseCell(feat.name, isTripped, wire, feat.type === 'allowlist' ? 'allow list' : feat.type, false, '', siteId, catId);

    cell.addEventListener('click', () => {
      cell.classList.add('just-toggled');
      setTimeout(() => cell.classList.remove('just-toggled'), 250);
      selections[cat.id].features[feat.id] = !selections[cat.id].features[feat.id];

      // Cascade feature state back up to site and category level:
      // - If all features are now off, turn the site off
      // - If any feature is on, turn the site on
      // - Recalculate category.enabled from all sites
      const anyFeatureOn = (site.features || []).some(f => selections[cat.id].features[f.id]);
      const allFeaturesOn = (site.features || []).every(f => selections[cat.id].features[f.id]);
      selections[cat.id].sites[site.id] = anyFeatureOn;
      const anySiteOn = Object.values(selections[cat.id].sites).some(v => v);
      selections[cat.id].enabled = anySiteOn;

      saveAndSync();
    });

    grid.appendChild(cell);
  });

  board.appendChild(grid);
  updateStatus();
}

// Character paddle SVGs for specific categories
const CHAR_CATS = {
  'social-media': 'social-media', 'video-streaming': 'video-streaming', 'ads-trackers': 'ads-trackers', 'adult-content': 'adult-content', gambling: 'gambling', gaming: 'gaming', news: 'news', dating: 'dating', shopping: 'shopping', ai: 'ai', crypto: 'crypto', 'security-threats': 'security-threats'
};

function charEyes(st,ex,ey,er) {
  er=er||7;const gap=er*1.6;
  const iris=st===0?'#2a1a44':st===1?'#1a2a44':'#0a2a1a';
  if(st===0){
    const lx=-gap+ex,rx=gap+ex;
    return `<g>
      <path d="M${lx-er*.85},${ey+1}Q${lx},${ey-er*.7} ${lx+er*.85},${ey+1}" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M${rx-er*.85},${ey+1}Q${rx},${ey-er*.7} ${rx+er*.85},${ey+1}" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>
    </g>`;
  }
  const lx=-gap+ex,rx=gap+ex;
  const blink=st===2?'char-blink':'';
  return `<g>
    <circle cx="${lx}" cy="${ey}" r="${er+2}" fill="white"/>
    <g class="${blink}" style="transform-origin:${lx}px ${ey}px"><circle cx="${lx}" cy="${ey}" r="${er}" fill="${iris}"/><circle cx="${lx-er*.28}" cy="${ey-er*.28}" r="${er*.38}" fill="white" opacity=".8"/></g>
    <circle cx="${rx}" cy="${ey}" r="${er+2}" fill="white"/>
    <g class="${blink}" style="transform-origin:${rx}px ${ey}px"><circle cx="${rx}" cy="${ey}" r="${er}" fill="${iris}"/><circle cx="${rx-er*.28}" cy="${ey-er*.28}" r="${er*.38}" fill="white" opacity=".8"/></g>
  </g>`;
}

function charMouth(st,mx,my) {
  if(st===0) return `<path d="M${mx-4},${my+2}Q${mx},${my+5} ${mx+4},${my+2}" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round"/>`;
  if(st===1) return `<rect x="${mx-5}" y="${my-1}" width="10" height="2.5" rx="1.2" fill="#111"/>`;
  return `<path d="M${mx-6},${my}Q${mx},${my+7} ${mx+6},${my}" fill="#111"/><path d="M${mx-4},${my+1}Q${mx},${my+5} ${mx+4},${my+1}" fill="white"/>`;
}

function charZzz(ox,oy) {
  return `<text class="char-zzz" x="${ox}" y="${oy}" font-size="12" font-weight="800" fill="#fff" font-family="Arial" opacity=".7">z</text>
    <text class="char-zzz char-zzz-d1" x="${ox+8}" y="${oy-9}" font-size="9" font-weight="800" fill="#fff" font-family="Arial" opacity=".5">z</text>
    <text class="char-zzz char-zzz-d2" x="${ox+15}" y="${oy-17}" font-size="7" font-weight="800" fill="#fff" font-family="Arial" opacity=".35">z</text>`;
}

function charSVG(catId, wireColor) {
  const st = wireColor==='red'?0:wireColor==='amber'?1:2;
  const col = wireColor==='red'?'#4a5060':wireColor==='amber'?'#f5a623':'#3abf6e';
  const E = charEyes, M = charMouth, Z = st===0?charZzz:'';
  const zz = st===0?charZzz(20,-24):'';

  if(catId==='social-media') {
    // Speech bubble — centred, tail below
    return `<svg viewBox="-36 -36 72 72" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <polygon points="-8,18 8,18 -4,36" fill="${col}"/>
      <rect x="-30" y="-28" width="60" height="48" rx="24" fill="${col}"/>
      ${E(st,0,-6,8)}${M(st,0,8)}${zz}
    </svg>`;
  }
  if(catId==='adult-content') {
    // Tall pill with 18+ header and dark inner panel (like Security)
    return `<svg viewBox="-36 -40 72 80" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <rect x="-26" y="-36" width="52" height="72" rx="26" fill="${col}"/>
      <rect x="-22" y="-12" width="44" height="32" rx="18" fill="rgba(0,0,0,.13)"/>
      <text x="0" y="-20" font-size="14" font-weight="900" fill="rgba(0,0,0,.3)" font-family="Arial" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">18+</text>
      ${E(st,0,0,7)}${M(st,0,16)}${zz}
    </svg>`;
  }
  if(catId==='ads-trackers') {
    // Magnifying glass — centred lens, dark inner panel (like Security)
    const outerR=26,ringW=8,innerR=outerR-ringW;
    const rad=135*Math.PI/180;
    const hx=outerR*Math.cos(rad),hy=outerR*Math.sin(rad);
    return `<svg viewBox="-36 -36 72 72" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <rect x="${hx-5}" y="${hy-4}" width="10" height="28" rx="5" fill="${col}" transform="rotate(45,${hx},${hy})"/>
      <circle cx="0" cy="0" r="${outerR}" fill="${col}"/>
      <circle cx="0" cy="0" r="${innerR}" fill="rgba(0,0,0,.13)"/>
      ${E(st,0,-2,7)}${M(st,0,10)}${zz}
    </svg>`;
  }
  if(catId==='video-streaming') {
    // Play triangle — centred, face centred
    const r=9;
    const TL=[-26,-30],BL=[-26,30],R=[32,0];
    function along(ax,ay,bx,by,d){const len=Math.hypot(bx-ax,by-ay);return [ax+(bx-ax)*d/len,ay+(by-ay)*d/len];}
    function cp(prev,curr,next,rad){return{i:along(curr[0],curr[1],prev[0],prev[1],rad),o:along(curr[0],curr[1],next[0],next[1],rad),c:curr};}
    const c0=cp(BL,TL,R,r),c1=cp(TL,R,BL,r),c2=cp(R,BL,TL,r);
    const d=`M${c0.o[0]},${c0.o[1]}L${c1.i[0]},${c1.i[1]}Q${c1.c[0]},${c1.c[1]} ${c1.o[0]},${c1.o[1]}L${c2.i[0]},${c2.i[1]}Q${c2.c[0]},${c2.c[1]} ${c2.o[0]},${c2.o[1]}L${c0.i[0]},${c0.i[1]}Q${c0.c[0]},${c0.c[1]} ${c0.o[0]},${c0.o[1]}Z`;
    // Centre of triangle = (-26+(-26)+32)/3, (−30+30+0)/3 = roughly -7, 0
    return `<svg viewBox="-36 -36 72 72" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <path d="${d}" fill="${col}"/>
      ${E(st,-4,-2,8)}${M(st,-4,12)}${zz}
    </svg>`;
  }
  if(catId==='gambling') {
    // Playing card — Ace of Spades
    return `<svg viewBox="-36 -40 72 80" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <rect x="-26" y="-34" width="52" height="68" rx="8" fill="${col}"/>
      <text x="-17" y="-19" font-size="10" font-weight="900" fill="rgba(0,0,0,.28)" font-family="Arial" text-anchor="middle" dominant-baseline="middle">A</text>
      <text x="-17" y="-10" font-size="8" font-weight="900" fill="rgba(0,0,0,.22)" font-family="Arial" text-anchor="middle" dominant-baseline="middle">\u2660</text>
      <g transform="rotate(180,0,0)">
        <text x="-17" y="-19" font-size="10" font-weight="900" fill="rgba(0,0,0,.28)" font-family="Arial" text-anchor="middle" dominant-baseline="middle">A</text>
        <text x="-17" y="-10" font-size="8" font-weight="900" fill="rgba(0,0,0,.22)" font-family="Arial" text-anchor="middle" dominant-baseline="middle">\u2660</text>
      </g>
      <text x="0" y="-16" font-size="18" font-weight="900" fill="rgba(0,0,0,.2)" font-family="Arial" text-anchor="middle" dominant-baseline="middle">\u2660</text>
      ${E(st,0,0,7)}${M(st,0,14)}${zz}
    </svg>`;
  }
  if(catId==='gaming') {
    return `<svg viewBox="-36 -36 72 72" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <path d="M-24,24 L-24,-4 C-24,-30 -14,-34 0,-34 C14,-34 24,-30 24,-4 L24,24 Q18,16 12,24 Q6,32 0,24 Q-6,16 -12,24 Q-18,32 -24,24 Z" fill="${col}"/>
      <ellipse cx="-30" cy="2" rx="8" ry="6" fill="${col}" transform="rotate(-20,-30,2)"/>
      <ellipse cx="30" cy="2" rx="8" ry="6" fill="${col}" transform="rotate(20,30,2)"/>
      ${E(st,0,-10,8)}${M(st,0,4)}${zz}
    </svg>`;
  }
  if(catId==='news') {
    return `<svg viewBox="-36 -36 72 72" xmlns="http://www.w3.org/2000/svg">
      <rect x="-28" y="-32" width="56" height="64" rx="7" fill="${col}"/>
      <rect x="-22" y="-26" width="44" height="16" rx="4" fill="rgba(0,0,0,.18)"/>
      <rect x="-22" y="-4" width="44" height="4" rx="2" fill="rgba(0,0,0,.12)"/>
      <rect x="-22" y="6" width="44" height="4" rx="2" fill="rgba(0,0,0,.12)"/>
      <rect x="-22" y="16" width="30" height="4" rx="2" fill="rgba(0,0,0,.12)"/>
      ${E(st,0,-2,7)}${M(st,0,12)}${zz}
    </svg>`;
  }
  if(catId==='dating') {
    return `<svg viewBox="-36 -36 72 72" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <path d="M0,30 C-6,24 -36,8 -36,-12 C-36,-28 -24,-36 -12,-32 C-6,-30 -2,-26 0,-20 C2,-26 6,-30 12,-32 C24,-36 36,-28 36,-12 C36,8 6,24 0,30 Z" fill="${col}"/>
      ${E(st,0,-8,7)}${M(st,0,6)}${zz}
    </svg>`;
  }
  if(catId==='shopping') {
    // Shopping basket with hoop handle and slat lines
    return `<svg viewBox="-36 -40 72 80" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <path d="M-28,-36 L-28,-14 Q-28,-10 -24,-10 L24,-10 Q28,-10 28,-14 L28,-36" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round"/>
      <path d="M-30,-10 L30,-10 L24,30 Q24,34 20,34 L-20,34 Q-24,34 -24,30 Z" fill="${col}"/>
      <line x1="-12" y1="-4" x2="-10" y2="28" stroke="rgba(0,0,0,.12)" stroke-width="2" stroke-linecap="round"/>
      <line x1="0" y1="-4" x2="0" y2="28" stroke="rgba(0,0,0,.12)" stroke-width="2" stroke-linecap="round"/>
      <line x1="12" y1="-4" x2="10" y2="28" stroke="rgba(0,0,0,.12)" stroke-width="2" stroke-linecap="round"/>
      ${E(st,0,4,7)}${M(st,0,18)}${zz}
    </svg>`;
  }
  if(catId==='ai') {
    // Robot head with antenna, ear nubs, and face panel
    return `<svg viewBox="-36 -40 72 80" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <circle cx="0" cy="-38" r="5" fill="${col}"/>
      <rect x="-3" y="-33" width="6" height="14" rx="3" fill="${col}"/>
      <rect x="-38" y="-7" width="9" height="14" rx="4.5" fill="${col}"/>
      <rect x="29" y="-7" width="9" height="14" rx="4.5" fill="${col}"/>
      <rect x="-30" y="-20" width="60" height="50" rx="10" fill="${col}"/>
      <rect x="-23" y="-14" width="46" height="38" rx="7" fill="rgba(0,0,0,.13)"/>
      ${E(st,0,-4,7)}${M(st,0,12)}${zz}
    </svg>`;
  }
  if(catId==='crypto') {
    // Refined coin with rim bands, inner ring, ₿ symbol, divider line
    return `<svg viewBox="-36 -36 72 72" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <circle cx="0" cy="0" r="32" fill="${col}"/>
      <circle cx="0" cy="0" r="32" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="5"/>
      <circle cx="0" cy="0" r="23" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="1.5"/>
      <text x="0" y="-10" font-size="18" font-weight="900" fill="rgba(0,0,0,.25)" font-family="Arial" text-anchor="middle" dominant-baseline="middle">\u20BF</text>
      <line x1="-16" y1="-1" x2="16" y2="-1" stroke="rgba(0,0,0,.1)" stroke-width="1" stroke-linecap="round"/>
      ${E(st,0,6,7)}${M(st,0,18)}${zz}
    </svg>`;
  }
  if(catId==='security-threats') {
    // Shield shape with inner panel
    return `<svg viewBox="-36 -40 72 80" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <path d="M0,-36 C13,-36 30,-30 30,-16 L30,5 C30,22 18,33 0,40 C-18,33 -30,22 -30,5 L-30,-16 C-30,-30 -13,-36 0,-36 Z" fill="${col}"/>
      <path d="M0,-27 C9,-27 23,-22 23,-12 L23,4 C23,16 13,25 0,30 C-13,25 -23,16 -23,4 L-23,-12 C-23,-22 -9,-27 0,-27 Z" fill="rgba(0,0,0,.11)"/>
      ${E(st,0,-6,7)}${M(st,0,8)}${zz}
    </svg>`;
  }
  return null; // no custom character
}

function createFuseCell(label, isTripped, wireColor, info, canDrill, icon, siteId, catId) {
  const cell = document.createElement('div');
  cell.className = 'cb-cell';
  cell.dataset.s = isTripped ? '1' : '0';
  cell.dataset.w = wireColor;

  // Brand lookup — use favicon for actual logos, add ™ to company names
  const isFeatureLevel = siteId && !canDrill;

  // Favicon domain overrides — use the main brand domain for favicon, not ad/tracking subdomains
  const FAVICON_OVERRIDE = {
    'facebook-ads': 'facebook.com', 'amazon-ads': 'amazon.com', 'tiktok-ads': 'tiktok.com',
    'google-ads': 'google.com', 'generic-trackers': 'hotjar.com', 'analytics': 'google.com',
    'bbc-news': 'bbc.com', 'primevideo': 'amazon.com', 'disneyplus': 'disneyplus.com',
    'google-ai': 'google.com',
  };

  // Sites that represent multiple brands — don't show any single favicon
  const NO_FAVICON = ['network-ads', 'cookie-popups', 'malware', 'phishing', 'spyware', 'cryptomining', 'botnet', 'command-control'];

  // Get the best domain for this site's favicon
  let siteDomain = '';
  if (siteId && !NO_FAVICON.includes(siteId)) {
    siteDomain = FAVICON_OVERRIDE[siteId] || '';
    if (!siteDomain) {
      for (const c of categories) {
        const s = c.sites?.find(x => x.id === siteId);
        if (s?.domains?.[0]) { siteDomain = s.domains[0]; break; }
      }
    }
  }

  const faviconSmall = siteDomain ? `<img class="cb-brand-logo" src="https://www.google.com/s2/favicons?domain=${siteDomain}&sz=64" alt="" loading="lazy">` : '';
  const faviconBig = siteDomain ? `<img class="cb-brand-logo cb-brand-logo-lg" src="https://www.google.com/s2/favicons?domain=${siteDomain}&sz=64" alt="" loading="lazy">` : '';
  const displayLabel = isFeatureLevel
    ? label
    : (siteId ? label + '<span class="cb-tm">\u2122</span>' : label);
  const labelIcon = isFeatureLevel
    ? faviconBig
    : (faviconSmall || (icon ? '<div class="cb-label-icon">' + icon + '</div>' : ''));

  const pulseDots = '<div class="cb-pulse-dot"></div>'.repeat(8);
  const pulseDotsBotClass = 'cb-pulse-dot-bot';
  const botDots = `<div class="${pulseDotsBotClass}"></div>`.repeat(8);

  const gearSVG = `<svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="#bbb"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#bbb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // Custom character paddle for specific categories, or default square paddle
  const customChar = catId && CHAR_CATS[catId] ? charSVG(catId, wireColor) : null;
  const paddleHTML = customChar
    ? `<div class="cb-paddle cb-paddle-char">${customChar}</div>`
    : `<div class="cb-paddle">
        <div class="cb-paddle-shine"></div>
        <div class="cb-face cb-face-sleep">
          <div class="cb-eyes"><div class="cb-eye-shut"></div><div class="cb-eye-shut"></div></div>
          <div class="cb-zzz"><span class="cb-z1">z</span><span class="cb-z2">z</span></div>
        </div>
        <div class="cb-face cb-face-neutral">
          <div class="cb-eyes"><div class="cb-eye"></div><div class="cb-eye"></div></div>
          <div class="cb-neutral"></div>
        </div>
        <div class="cb-face cb-face-happy">
          <div class="cb-eyes"><div class="cb-eye"></div><div class="cb-eye"></div></div>
          <div class="cb-cheeks"><div class="cb-cheek"></div><div class="cb-cheek"></div></div>
          <div class="cb-smile"></div>
        </div>
      </div>`;

  // Bottom: site count, then screw under for drillable
  const bottomText = canDrill ? (info || '') : displayLabel;
  const bottomHTML = canDrill
    ? `<div class="cb-label-sm cb-cfg"><span class="cb-label-sm-text">${bottomText}</span></div>
       <div class="cb-screw-wrap cb-cfg"><div class="cb-screw-face"></div></div>`
    : `<div class="cb-label-sm"><span class="cb-label-sm-text">${bottomText}</span></div>`;

  cell.innerHTML = `
    <div class="cb-conduit">
      <div class="cb-conduit-cap"></div>
      <div class="cb-conduit-pipe"><div class="cb-pulse">${pulseDots}</div></div>
      <div class="cb-conduit-flare"></div>
    </div>
    <div class="cb-housing">
      <div class="cb-housing-inner">
        <div class="cb-terminal-top">
          <div class="cb-label-box">
            ${labelIcon}
            <span class="cb-label-text">${displayLabel}</span>
          </div>
        </div>
        <div class="cb-track-area">
          <div class="cb-track-line"></div>
          <div class="cb-trk" role="switch" aria-checked="${isTripped}" aria-label="Block ${label}" tabindex="0">
            ${paddleHTML}
          </div>
        </div>
        <div class="cb-terminal-bot">
          ${bottomHTML}
        </div>
        <div class="cb-status">${wireColor==='green'?'Blocked':wireColor==='amber'?'Filtered':'Open'}</div>
      </div>
    </div>
    <div class="cb-conduit">
      <div class="cb-conduit-flare-bot"></div>
      <div class="cb-conduit-pipe"><div class="cb-pulse-bot">${botDots}</div></div>
      <div class="cb-conduit-cap-bot"></div>
    </div>
  `;
  return cell;
}

function updateStatus() {
  const tripped = categories.filter(c => selections[c.id]?.enabled).length;
  if (tripped === 0) { statusDot.className = 'status-dot'; statusText.textContent = 'Nothing blocked yet'; }
  else if (tripped === categories.length) { statusDot.className = 'status-dot active'; statusText.textContent = `All ${tripped} categories blocked`; }
  else { statusDot.className = 'status-dot partial'; statusText.textContent = `${tripped} of ${categories.length} blocked`; }
}

// --- Save + Sync ---

function saveAndSync() {
  // Flash install prompt if extension not connected
  flashInstallPrompt();

  // Always save to localStorage
  localStorage.setItem('cb_selections', JSON.stringify(selections));

  // Build rules
  const payload = buildSettingsPayload();

  // Send directly to extension via postMessage (instant, no server needed)
  sendToExtension({
    selections,
    domains: payload.blockedDomains,
    urls: payload.blockedUrls,
    selectors: payload.hiddenSelectors,
  });

  // If signed in, also push to server (debounced)
  if (isSignedIn()) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      await push(payload);
      syncBadge.textContent = 'synced v' + getSyncVersion();
    }, 1000);
  }

  render();
}

function buildSettingsPayload() {
  const domains = [], urls = [], selectors = {};
  categories.forEach(cat => {
    const s = selections[cat.id];
    if (!s) return;
    (cat.sites || []).forEach(site => {
      const siteOn = s.sites[site.id];
      const siteFeatures = site.features || [];
      const allFeaturesOn = siteFeatures.length > 0 && siteFeatures.every(f => s.features[f.id]);
      if (siteOn && (siteFeatures.length === 0 || allFeaturesOn)) {
        (site.domains || []).forEach(d => { if (d && !domains.includes(d)) domains.push(d); });
        // Still collect element selectors — especially global ones (e.g. cookie popup CSS)
        // which need to apply on ALL sites, not just the provider's domain.
        // Many sites self-host consent scripts (e.g. sourcepoint.theguardian.com)
        // so network-level blocking alone won't catch them.
        siteFeatures.forEach(feat => {
          if (feat.type === 'element' && feat.selector) {
            const h = feat.global ? '*' : (site.domains[0] || '').replace('www.', '');
            if (!selectors[h]) selectors[h] = [];
            selectors[h].push(feat.selector);
          }
        });
        return;
      }
      siteFeatures.forEach(feat => {
        if (!s.features[feat.id]) return;
        if (feat.type === 'url' && feat.urlFilter) {
          urls.push(feat.requestDomains ? { urlFilter: feat.urlFilter, requestDomains: feat.requestDomains } : feat.urlFilter);
        }
        if (feat.type === 'element' && feat.selector) {
          // Use '*' for global selectors (cookie popups apply on all sites)
          const h = feat.global ? '*' : (site.domains[0] || '').replace('www.', '');
          if (!selectors[h]) selectors[h] = [];
          selectors[h].push(feat.selector);
        }
        if (feat.elementSelectors) {
          const h = (site.domains[0] || '').replace('www.', '');
          if (!selectors[h]) selectors[h] = [];
          selectors[h].push(...feat.elementSelectors);
        }
      });
    });
  });
  return { selections, blockedDomains: domains, blockedUrls: urls, hiddenSelectors: selectors };
}

// --- Devices Panel ---

async function loadDevicesPanel() {
  const listEl = document.getElementById('devices-list');
  const subEl = document.getElementById('devices-sub');
  const isHost = getDeviceRole() === 'host';
  const myDeviceId = getDeviceId();

  listEl.innerHTML = '<div style="font-size:.75rem;color:var(--text-tri)">Loading...</div>';

  const devices = await getDevices();
  if (devices.length === 0) {
    listEl.innerHTML = '<div style="font-size:.75rem;color:var(--text-tri)">No devices</div>';
    return;
  }

  listEl.innerHTML = devices.map(d => {
    const roleClass = d.role === 'host' ? 'admin' : d.role === 'locked' ? 'client' : 'admin';
    const canToggleLock = isHost && d.role !== 'host';
    const lockAction = d.role === 'locked' ? 'client' : 'locked';
    const lockLabel = d.role === 'locked' ? 'unlock' : 'lock';
    return `
      <div class="device-row">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="device-name">${d.name}${d.id === myDeviceId ? ' (this)' : ''}</span>
          <span class="role-badge ${roleClass}">${d.role || 'client'}</span>
        </div>
        <div class="device-actions">
          ${canToggleLock ? `<button class="role-toggle" data-did="${d.id}" data-role="${lockAction}">${lockLabel}</button>` : ''}
          <button class="remove-device" data-did="${d.id}">remove</button>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.role-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await changeDeviceRole(btn.dataset.did, btn.dataset.role);
        loadDevicesPanel();
      } catch (e) { alert(e.message); }
    });
  });

  listEl.querySelectorAll('.remove-device').forEach(btn => {
    btn.addEventListener('click', async () => {
      await removeDevice(btn.dataset.did);
      loadDevicesPanel();
    });
  });

  const sub = await getSubscription();
  if (sub?.plan === 'self-hosted') {
    subEl.innerHTML = '<div style="font-size:.72rem;color:var(--green);margin-top:12px">Self-hosted (unlimited devices)</div>';
  } else if (sub?.plan === 'pro') {
    subEl.innerHTML = '<div style="font-size:.72rem;color:var(--green);margin-top:12px">Pro plan active</div>';
  } else {
    subEl.innerHTML = `
      <div style="font-size:.72rem;color:var(--text-sec);margin-top:12px">Free plan. <strong style="color:var(--green)">$1/mo</strong> or <strong style="color:var(--green)">$10/yr</strong> for sync.</div>
      <div style="display:flex;gap:6px;margin-top:6px">
        <button class="checkout-btn btn-primary" data-plan="monthly" style="font-size:.72rem;padding:6px 12px">$1/month</button>
        <button class="checkout-btn btn-secondary" data-plan="yearly" style="font-size:.72rem;padding:6px 12px">$10/year</button>
      </div>
    `;
    subEl.querySelectorAll('.checkout-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const data = await createCheckout(btn.dataset.plan);
          if (data?.checkout_url) window.open(data.checkout_url, '_blank');
        } catch {}
      });
    });
  }
}

// --- Settings Panel ---

async function loadSettingsPanel() {
  const el = document.getElementById('settings-content');
  const role = getDeviceRole();
  const server = getServerUrl();
  const version = getSyncVersion();
  const sub = await getSubscription();
  const planLabel = sub?.plan === 'self-hosted' ? 'Self-hosted' : sub?.plan === 'pro' ? 'Pro' : 'Free';

  el.innerHTML = `
    <div class="settings-section"><div class="settings-label">Server</div><div class="settings-value">${server}</div></div>
    <div class="settings-section"><div class="settings-label">Device role</div><div class="settings-value"><span class="role-badge ${role === 'host' ? 'admin' : 'client'}">${role}</span></div></div>
    <div class="settings-section"><div class="settings-label">Sync version</div><div class="settings-value">v${version}</div></div>
    <div class="settings-section"><div class="settings-label">Plan</div><div class="settings-value">${planLabel}</div></div>
    <div class="settings-actions">
      <button id="settings-force-push" class="btn-secondary">Force push</button>
      <button id="settings-force-pull" class="btn-secondary">Force pull</button>
    </div>
    <div class="settings-danger">
      <button id="settings-signout" class="btn-ghost" style="color:var(--text-sec)">Sign out</button>
      <button id="settings-delete" class="btn-ghost" style="color:var(--red)">Delete account</button>
    </div>
  `;

  document.getElementById('settings-force-push').addEventListener('click', async () => {
    const ok = await push(buildSettingsPayload());
    if (ok) { syncBadge.textContent = 'synced v' + getSyncVersion(); }
  });

  document.getElementById('settings-force-pull').addEventListener('click', async () => {
    const settings = await pull();
    if (settings?.selections) {
      selections = settings.selections;
      localStorage.setItem('cb_selections', JSON.stringify(selections));
      initSelections();
      render();
    }
  });

  document.getElementById('settings-signout').addEventListener('click', () => {
    signOut();
    updateSyncUI();
  });

  document.getElementById('settings-delete').addEventListener('click', async () => {
    if (!confirm('Delete your account and all synced data? This cannot be undone.')) return;
    await deleteAccount();
    updateSyncUI();
  });
}

// --- Start ---
loadAuth();
init();
