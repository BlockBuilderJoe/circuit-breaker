// Circuit Breaker — Fun themed blocked page
// Shows the category character that blocked the site + a random pun

const G = '#2dc653'; // green — the character is protecting you

// --- Character SVGs (green/happy state) ---
function eyes(ex, ey, er) {
  er = er || 8;
  const gap = er * 1.6, iris = '#0a2a1a';
  const lx = -gap + ex, rx = gap + ex;
  return `<circle cx="${lx}" cy="${ey}" r="${er+2.5}" fill="#fff"/>
    <circle cx="${lx}" cy="${ey}" r="${er}" fill="${iris}"/><circle cx="${lx-er*.28}" cy="${ey-er*.28}" r="${er*.38}" fill="#fff" opacity=".8"/>
    <circle cx="${rx}" cy="${ey}" r="${er+2.5}" fill="#fff"/>
    <circle cx="${rx}" cy="${ey}" r="${er}" fill="${iris}"/><circle cx="${rx-er*.28}" cy="${ey-er*.28}" r="${er*.38}" fill="#fff" opacity=".8"/>`;
}
function mouth(mx, my) {
  return `<path d="M${mx-7},${my}Q${mx},${my+9} ${mx+7},${my}" fill="${'#0a2a1a'}"/><path d="M${mx-5},${my+1}Q${mx},${my+6} ${mx+5},${my+1}" fill="#fff"/>`;
}
const E = eyes, M = mouth;

const CHARACTERS = {
  'social-media': `<svg viewBox="-40 -40 80 80" style="overflow:visible"><polygon points="-10,20 10,20 -5,40" fill="${G}"/><rect x="-32" y="-30" width="64" height="52" rx="26" fill="${G}"/>${E(0,-8)}${M(0,8)}</svg>`,
  'video-streaming': `<svg viewBox="-40 -40 80 80" style="overflow:visible"><path d="M-28,-32 Q-28,-40 -18,-40 L34,-6 Q42,0 34,6 L-18,40 Q-28,40 -28,32 Z" fill="${G}" rx="8"/>${E(-5,0)}${M(-5,14)}</svg>`,
  'ads-trackers': `<svg viewBox="-40 -40 80 80" style="overflow:visible"><rect x="${-20+Math.cos(135*Math.PI/180)*28-5}" y="${Math.sin(135*Math.PI/180)*28-4}" width="10" height="30" rx="5" fill="${G}" transform="rotate(45,${Math.cos(135*Math.PI/180)*28},${Math.sin(135*Math.PI/180)*28})"/><circle cx="0" cy="0" r="28" fill="${G}"/><circle cx="0" cy="0" r="20" fill="rgba(0,0,0,.13)"/>${E(0,-2)}${M(0,12)}</svg>`,
  'adult-content': `<svg viewBox="-40 -44 80 88" style="overflow:visible"><rect x="-28" y="-38" width="56" height="76" rx="28" fill="${G}"/><rect x="-24" y="-14" width="48" height="34" rx="20" fill="rgba(0,0,0,.13)"/><text x="0" y="-22" font-size="15" font-weight="900" fill="rgba(0,0,0,.3)" font-family="Arial" text-anchor="middle" dominant-baseline="middle">18+</text>${E(0,0)}${M(0,16)}</svg>`,
  'gambling': `<svg viewBox="-40 -44 80 88" style="overflow:visible"><rect x="-28" y="-36" width="56" height="72" rx="8" fill="${G}"/><text x="-18" y="-20" font-size="11" font-weight="900" fill="rgba(0,0,0,.28)" font-family="Arial" text-anchor="middle">A</text><text x="-18" y="-11" font-size="9" fill="rgba(0,0,0,.22)" font-family="Arial" text-anchor="middle">\u2660</text><text x="0" y="-18" font-size="20" fill="rgba(0,0,0,.2)" font-family="Arial" text-anchor="middle">\u2660</text>${E(0,0)}${M(0,14)}</svg>`,
  'gaming': `<svg viewBox="-40 -40 80 80" style="overflow:visible"><path d="M-26,26 L-26,-4 C-26,-32 -16,-36 0,-36 C16,-36 26,-32 26,-4 L26,26 Q20,18 14,26 Q8,34 0,26 Q-8,18 -14,26 Q-20,34 -26,26 Z" fill="${G}"/><ellipse cx="-32" cy="2" rx="9" ry="7" fill="${G}" transform="rotate(-20,-32,2)"/><ellipse cx="32" cy="2" rx="9" ry="7" fill="${G}" transform="rotate(20,32,2)"/>${E(0,-12)}${M(0,6)}</svg>`,
  'news': `<svg viewBox="-40 -40 80 80"><rect x="-30" y="-34" width="60" height="68" rx="8" fill="${G}"/><rect x="-24" y="-28" width="48" height="16" rx="4" fill="rgba(0,0,0,.18)"/><rect x="-24" y="-6" width="48" height="4" rx="2" fill="rgba(0,0,0,.12)"/><rect x="-24" y="4" width="48" height="4" rx="2" fill="rgba(0,0,0,.12)"/>${E(0,-2)}${M(0,16)}</svg>`,
  'dating': `<svg viewBox="-40 -40 80 80" style="overflow:visible"><path d="M0,32 C-8,26 -38,10 -38,-14 C-38,-30 -26,-38 -14,-34 C-8,-32 -4,-28 0,-22 C4,-28 8,-32 14,-34 C26,-38 38,-30 38,-14 C38,10 8,26 0,32 Z" fill="${G}"/>${E(0,-10)}${M(0,6)}</svg>`,
  'shopping': `<svg viewBox="-40 -44 80 88" style="overflow:visible"><path d="M-30,-38 L-30,-16 Q-30,-12 -26,-12 L26,-12 Q30,-12 30,-16 L30,-38" fill="none" stroke="${G}" stroke-width="9" stroke-linecap="round"/><path d="M-32,-12 L32,-12 L26,32 Q26,36 22,36 L-22,36 Q-26,36 -26,32 Z" fill="${G}"/>${E(0,4)}${M(0,20)}</svg>`,
  'ai': `<svg viewBox="-40 -44 80 88" style="overflow:visible"><circle cx="0" cy="-40" r="6" fill="${G}"/><rect x="-3" y="-35" width="6" height="14" rx="3" fill="${G}"/><rect x="-40" y="-8" width="10" height="16" rx="5" fill="${G}"/><rect x="30" y="-8" width="10" height="16" rx="5" fill="${G}"/><rect x="-32" y="-22" width="64" height="54" rx="12" fill="${G}"/><rect x="-25" y="-16" width="50" height="40" rx="8" fill="rgba(0,0,0,.13)"/>${E(0,-4)}${M(0,14)}</svg>`,
  'crypto': `<svg viewBox="-40 -40 80 80" style="overflow:visible"><circle cx="0" cy="0" r="34" fill="${G}"/><circle cx="0" cy="0" r="34" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="5"/><circle cx="0" cy="0" r="25" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="1.5"/><text x="0" y="-12" font-size="20" font-weight="900" fill="rgba(0,0,0,.25)" font-family="Arial" text-anchor="middle" dominant-baseline="middle">\u20BF</text>${E(0,6)}${M(0,20)}</svg>`,
  'security-threats': `<svg viewBox="-40 -44 80 88" style="overflow:visible"><path d="M0,-38 C14,-38 32,-32 32,-18 L32,6 C32,24 20,36 0,42 C-20,36 -32,24 -32,6 L-32,-18 C-32,-32 -14,-38 0,-38 Z" fill="${G}"/><path d="M0,-29 C10,-29 25,-24 25,-14 L25,4 C25,18 14,27 0,32 C-14,27 -25,18 -25,4 L-25,-14 C-25,-24 -10,-29 0,-29 Z" fill="rgba(0,0,0,.11)"/>${E(0,-6)}${M(0,10)}</svg>`,
};

// --- Pun messages per category (3 each) ---
const PUNS = {
  'social-media': [
    "Shhh\u2026 your social feeds are taking a nap. Go make some real-life memories!",
    "This feed has been tripped. Your future self says thanks.",
    "No scrolling here! Your social breaker is doing its job.",
  ],
  'video-streaming': [
    "Plot twist: there's a whole world outside this screen.",
    "Your streaming breaker tripped \u2014 that's enough episodes for now.",
    "The stream has been tripped. Time for something offline!",
  ],
  'ads-trackers': [
    "Nothing to track here! Your ad breaker is keeping you invisible.",
    "Ads? Never heard of them. Your tracker breaker says you're welcome.",
    "This ad has been tripped. Your attention is not for sale.",
  ],
  'adult-content': [
    "This content has been tripped. Your 18+ breaker is on guard.",
    "Nothing to see here! Literally. Your adult breaker is working.",
    "Tripped! Your 18+ guard is keeping things clean.",
  ],
  'gambling': [
    "The house always wins\u2026 but not today. Your gambling breaker folded this hand.",
    "No bets here! Your gambling breaker says the odds are in your favour.",
    "All in\u2026 on self-control. Your gambling breaker played the winning hand.",
  ],
  'gaming': [
    "Game over! \u2026for distractions, that is. Your gaming breaker used TRIP!",
    "Your gaming breaker used TRIP! It's super effective!",
    "Achievement unlocked: Self-control! +100 XP. Your gaming breaker levels you up.",
  ],
  'news': [
    "Breaking news: You don't need to read more news right now.",
    "Extra! Extra! Your news breaker says take a break!",
    "Your daily doom-scroll quota has been reached. Come back never.",
  ],
  'dating': [
    "Your dating breaker swiped left on this site. You deserve better!",
    "This match has been unmatched. Your dating breaker knows your worth.",
    "Tripped! The only connection you need right now is with yourself.",
  ],
  'shopping': [
    "Your cart is empty and your wallet is full. Your shopping breaker did that.",
    "This store is closed! Your shopping breaker saved you from impulse buys.",
    "Add to cart? More like add to \u2018things I don't need.\u2019 Tripped!",
  ],
  'ai': [
    "Your AI breaker said \u2018I'm sorry Dave, I can't let you do that.\u2019",
    "The robots can wait. Your AI breaker has spoken.",
    "Tripped! Sometimes the best prompt is touching grass.",
  ],
  'crypto': [
    "HODL\u2026 your attention, that is. Your crypto breaker is protecting your focus.",
    "This coin has been tripped. To the moon? More like to bed.",
    "Your crypto breaker says the real investment is in yourself.",
  ],
  'security-threats': [
    "Threat neutralised! Your security breaker has your back.",
    "This site has been flagged and tripped. Your shield is up!",
    "Your security breaker blocked this threat. Stay safe out there!",
  ],
};

// --- Domain → Category lookup ---
function findCategory(hostname) {
  if (!hostname || !categories) return null;
  const host = hostname.replace('www.', '');
  for (const cat of categories) {
    for (const site of (cat.sites || [])) {
      if ((site.domains || []).some(d => host === d || host.endsWith('.' + d))) {
        return cat.id;
      }
    }
  }
  return null;
}

// --- Render ---
const blockedUrl = document.referrer || '';
let hostname = '';
try { hostname = new URL(blockedUrl).hostname; } catch {}

const catId = findCategory(hostname);

// Pick a random category if we can't determine which one
const allCatIds = Object.keys(CHARACTERS);
const displayCat = catId || allCatIds[Math.floor(Math.random() * allCatIds.length)];

// Show character
document.getElementById('character').innerHTML = CHARACTERS[displayCat] || CHARACTERS['security-threats'];

// Show random pun
const puns = PUNS[displayCat] || PUNS['security-threats'];
document.getElementById('pun').textContent = puns[Math.floor(Math.random() * puns.length)];

// Show blocked URL
document.getElementById('blocked-url').textContent = hostname || 'Blocked site';

// Go back button
document.getElementById('go-back').addEventListener('click', (e) => {
  e.preventDefault();
  history.back();
});
