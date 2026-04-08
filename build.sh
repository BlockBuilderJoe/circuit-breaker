#!/bin/bash
# Circuit Breaker — Build script for Chrome, Firefox, and Safari
# Usage: ./build.sh [chrome|firefox|safari|all]

set -e

TARGET=${1:-all}
ROOT="$(cd "$(dirname "$0")" && pwd)"
EXT="$ROOT/extension"
DIST="$ROOT/dist"

# Shared files to copy
copy_shared() {
  local dest=$1
  mkdir -p "$dest/background" "$dest/blocked" "$dest/content" "$dest/data/rules" "$dest/fonts" "$dest/icons" "$dest/options" "$dest/popup" "$dest/sync"

  cp "$EXT/fonts/"*.woff2 "$dest/fonts/" 2>/dev/null || true
  cp "$EXT/data/blocklists.js" "$dest/data/"
  cp "$EXT/data/rules/"*.json "$dest/data/rules/"
  cp "$EXT/content/content.js" "$dest/content/"
  cp "$EXT/content/content.css" "$dest/content/"
  cp "$EXT/content/dashboard-bridge.js" "$dest/content/"
  cp "$EXT/blocked/blocked.html" "$dest/blocked/"
  cp "$EXT/blocked/blocked.js" "$dest/blocked/"
  cp "$EXT/icons/"*.png "$dest/icons/"
  cp "$EXT/icons/"*.svg "$dest/icons/" 2>/dev/null || true
  cp "$EXT/options/options.html" "$dest/options/"
  cp "$EXT/options/options.js" "$dest/options/"
  cp "$EXT/popup/popup.css" "$dest/popup/"
  cp "$EXT/popup/popup.html" "$dest/popup/"
  cp "$EXT/popup/popup.js" "$dest/popup/"
  cp "$EXT/sync/sync.js" "$dest/sync/"
}

build_chrome() {
  echo "Building Chrome..."
  local dest="$DIST/chrome"
  rm -rf "$dest"
  copy_shared "$dest"

  # Chrome uses importScripts in service worker (classic)
  cp "$EXT/background/background.js" "$dest/background/"
  cp "$EXT/manifest.json" "$dest/manifest.json"

  echo "Chrome build: $dest"
}

build_firefox() {
  echo "Building Firefox..."
  local dest="$DIST/firefox"
  rm -rf "$dest"
  copy_shared "$dest"

  # Firefox MV3: background scripts (not service_worker), importScripts not available
  # Merge sync.js into background.js as a single file
  cat "$EXT/sync/sync.js" > "$dest/background/background.js"
  echo "" >> "$dest/background/background.js"
  # Append background.js without the importScripts line
  grep -v "^importScripts" "$EXT/background/background.js" >> "$dest/background/background.js"

  # Firefox manifest: use background.scripts instead of service_worker
  cat > "$dest/manifest.json" << 'MANIFEST'
{
  "manifest_version": 3,
  "name": "Circuit Breaker",
  "version": "2.0.0",
  "description": "Your circuit breaker for the internet. Block distracting sites, hide addictive features, and optionally sync across devices.",
  "browser_specific_settings": {
    "gecko": {
      "id": "circuitbreaker@josephpalmer.co.uk",
      "strict_min_version": "109.0"
    }
  },
  "permissions": [
    "storage",
    "declarativeNetRequest"
  ],
  "host_permissions": ["<all_urls>"],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "options_ui": {
    "page": "options/options.html",
    "open_in_tab": true
  },
  "background": {
    "scripts": ["background/background.js"]
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["data/blocklists.js", "content/content.js"],
      "css": ["content/content.css"],
      "run_at": "document_start"
    },
    {
      "matches": [
        "https://fuseboard-sync.joe-780.workers.dev/*",
        "https://switch-ahg.pages.dev/*",
        "https://circuitbreaker.app/*",
        "http://localhost/*"
      ],
      "js": ["content/dashboard-bridge.js"],
      "run_at": "document_idle"
    }
  ],
  "declarative_net_request": {
    "rule_resources": [
      { "id": "ads_trackers_network", "enabled": false, "path": "data/rules/ads-trackers.json" },
      { "id": "cookie_consent", "enabled": false, "path": "data/rules/cookie-consent.json" }
    ]
  },
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
MANIFEST

  echo "Firefox build: $dest"
}

build_safari() {
  echo "Building Safari..."
  local dest="$DIST/safari-src"
  rm -rf "$dest"
  copy_shared "$dest"

  # Safari uses the same approach as Firefox for background
  cat "$EXT/sync/sync.js" > "$dest/background/background.js"
  echo "" >> "$dest/background/background.js"
  grep -v "^importScripts" "$EXT/background/background.js" >> "$dest/background/background.js"

  # Safari manifest (MV3, similar to Chrome but no declarativeNetRequestFeedback)
  cat > "$dest/manifest.json" << 'MANIFEST'
{
  "manifest_version": 3,
  "name": "Circuit Breaker",
  "version": "2.0.0",
  "description": "Your circuit breaker for the internet. Block distracting sites, hide addictive features, and optionally sync across devices.",
  "permissions": [
    "storage",
    "declarativeNetRequest"
  ],
  "host_permissions": ["<all_urls>"],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "options_page": "options/options.html",
  "background": {
    "service_worker": "background/background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content.js"],
      "css": ["content/content.css"],
      "run_at": "document_start"
    },
    {
      "matches": [
        "https://fuseboard-sync.joe-780.workers.dev/*",
        "https://switch-ahg.pages.dev/*",
        "https://circuitbreaker.app/*",
        "http://localhost/*"
      ],
      "js": ["content/dashboard-bridge.js"],
      "run_at": "document_idle"
    }
  ],
  "declarative_net_request": {
    "rule_resources": [
      { "id": "ads_trackers_network", "enabled": false, "path": "data/rules/ads-trackers.json" },
      { "id": "cookie_consent", "enabled": false, "path": "data/rules/cookie-consent.json" }
    ]
  },
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
MANIFEST

  echo "Safari source build: $dest"
  echo ""
  echo "To create the Safari extension Xcode project, run:"
  echo "  xcrun safari-web-extension-converter $dest --project-location $DIST/safari-xcode --app-name CircuitBreaker --bundle-identifier co.uk.josephpalmer.CircuitBreaker"
}

build_dashboard() {
  echo "Building dashboard..."
  local dest="$ROOT/worker/public"
  mkdir -p "$dest/css" "$dest/js"
  cp "$ROOT/index.html" "$dest/"
  cp "$ROOT/css/dashboard.css" "$dest/css/"
  cp "$ROOT/favicon.svg" "$dest/favicon.svg"
  cp "$ROOT/favicon.png" "$dest/favicon.png"
  cp "$ROOT/apple-touch-icon.png" "$dest/apple-touch-icon.png" 2>/dev/null || true
  cp "$ROOT/js/api.js" "$ROOT/js/app.js" "$dest/js/"
  cp "$EXT/data/blocklists.js" "$ROOT/js/blocklists.js"
  cp "$ROOT/js/blocklists.js" "$dest/js/"
  echo "Dashboard build: $dest"
}

case "$TARGET" in
  chrome)  build_chrome ;;
  firefox) build_firefox ;;
  safari)  build_safari ;;
  dashboard) build_dashboard ;;
  production)
    echo "=== PRODUCTION BUILD ==="
    build_chrome
    build_firefox
    build_safari
    build_dashboard

    # Strip dev auto-reload from background.js (remove the IIFE block)
    echo "Stripping dev code..."
    for dir in chrome firefox safari-src; do
      bgfile="$DIST/$dir/background/background.js"
      if [ -f "$bgfile" ]; then
        # Remove everything between the dev comment and the closing })();
        python3 -c "
import re
with open('$bgfile','r') as f: s=f.read()
s=re.sub(r'// --- Dev auto-reload.*?\n\}\)\(\);','',s,flags=re.DOTALL)
with open('$bgfile','w') as f: f.write(s)
"
      fi
    done

    # Remove localhost from content_scripts and fix trailing commas
    for mf in "$DIST/chrome/manifest.json" "$DIST/firefox/manifest.json" "$DIST/safari-src/manifest.json"; do
      [ -f "$mf" ] || continue
      python3 -c "
import json, re
with open('$mf','r') as f: s=f.read()
s = re.sub(r',\s*\n\s*\"http://localhost/\*\"', '', s)
s = re.sub(r'\"http://localhost/\*\",?\s*\n?', '', s)
# Fix any remaining trailing commas before ] or }
s = re.sub(r',(\s*[\]\}])', r'\1', s)
json.loads(s)  # validate
with open('$mf','w') as f: f.write(s)
"
    done

    # Copy privacy policy to dashboard
    cp "$ROOT/privacy.html" "$ROOT/worker/public/"

    # Package zips
    echo "Packaging..."
    cd "$DIST/chrome" && zip -r "$DIST/circuitbreaker-chrome.zip" . -x "*.DS_Store" > /dev/null
    cd "$DIST/firefox" && zip -r "$DIST/circuitbreaker-firefox.zip" . -x "*.DS_Store" > /dev/null
    cd "$ROOT"

    echo ""
    echo "Production builds ready:"
    echo "  $DIST/circuitbreaker-chrome.zip (Chrome + Edge)"
    echo "  $DIST/circuitbreaker-firefox.zip (Firefox)"
    echo "  $DIST/safari-src/ (run xcrun to convert)"
    ;;
  all)
    build_chrome
    echo ""
    build_firefox
    echo ""
    build_safari
    echo ""
    build_dashboard
    ;;
  *)
    echo "Usage: $0 [chrome|firefox|safari|dashboard|all]"
    exit 1
    ;;
esac

# Write build stamp for dev auto-reload
date +%s > "$EXT/.build-stamp"

echo ""
echo "Done! Builds are in $DIST/"
echo ""
echo "Dev auto-reload: run this once in a separate terminal:"
echo "  cd extension && python3 -m http.server 8111"
