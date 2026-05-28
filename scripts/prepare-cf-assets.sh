#!/bin/bash
# Prepare the OpenNext build for Cloudflare Pages deployment by copying
# the worker, middleware, and server-functions into the assets directory.
#
# Cloudflare Pages compiles _worker.js (if present in build output) as the
# Pages Worker. We also need middleware/ and server-functions/ for the
# worker to resolve its imports at compile time.
#
# A _routes.json file is generated so Cloudflare Pages CDN serves all
# /_next/static/* requests directly without hitting the worker —
# this is the primary mechanism for reliable CSS/JS delivery.

set -e

OPENNEXT=".open-next"
ASSETS="$OPENNEXT/assets"

if [ ! -f "$OPENNEXT/worker.js" ]; then
  echo "ERROR: $OPENNEXT/worker.js not found — run cf:build first" >&2
  exit 1
fi

# Copy runtime dependencies into assets for worker compilation
cp -r "$OPENNEXT/middleware" "$ASSETS/"
cp -r "$OPENNEXT/server-functions" "$ASSETS/"
cp -r "$OPENNEXT/cloudflare" "$ASSETS/"

# Patch worker.js using the Node.js script (handles CRLF and all OpenNext formats)
node "$(dirname "$0")/patch-worker.mjs" "$OPENNEXT/worker.js" "$ASSETS/_worker.js"

echo "  _worker.js (patched: static asset fallback, no DO exports)"
echo "  middleware/, server-functions/, cloudflare/"

# Generate _routes.json so Cloudflare Pages CDN serves static assets
# directly without invoking the worker — most reliable path for CSS/font/JS.
cat > "$ASSETS/_routes.json" << 'ROUTESEOF'
{
  "version": 1,
  "include": ["/*"],
  "exclude": [
    "/_next/static/*",
    "/favicon.ico",
    "/*.jpg",
    "/*.jpeg",
    "/*.png",
    "/*.gif",
    "/*.svg",
    "/*.ico",
    "/*.woff",
    "/*.woff2",
    "/*.ttf",
    "/*.otf",
    "/*.webp"
  ]
}
ROUTESEOF

echo "  _routes.json (/_next/static/* bypasses worker via CDN)"
echo ""
echo "✓ Cloudflare Pages assets ready in $ASSETS/"
