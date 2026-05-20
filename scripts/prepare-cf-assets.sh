#!/bin/bash
# Prepare the OpenNext build for Cloudflare Pages deployment by copying
# the worker, middleware, and server-functions into the assets directory.
#
# Cloudflare Pages compiles _worker.js (if present in build output) as the
# Pages Worker. We also need middleware/ and server-functions/ for the
# worker to resolve its imports at compile time.
#
# Also strips Durable Object exports from worker.js since we don't use them,
# and injects static asset serving code for CSS/JS/fonts.

set -e

OPENNEXT=".open-next"
ASSETS="$OPENNEXT/assets"
WORKER_JS="$ASSETS/_worker.js"

if [ ! -f "$OPENNEXT/worker.js" ]; then
  echo "ERROR: $OPENNEXT/worker.js not found — run cf:build first" >&2
  exit 1
fi

# Copy runtime dependencies into assets for worker compilation
cp -r "$OPENNEXT/middleware" "$ASSETS/"
cp -r "$OPENNEXT/server-functions" "$ASSETS/"
cp -r "$OPENNEXT/cloudflare" "$ASSETS/"

# Create _worker.js from worker.js with patches:
# 1. Strip Durable Object exports (can't resolve in Pages context)
# 2. Inject static asset serving — serves CSS/JS/fonts from env.ASSETS
sed \
  -e '/export { DOQueueHandler/d' \
  -e '/export { DOShardedTagCache/d' \
  -e '/export { BucketCachePurge/d' \
  -e '/const url = new URL(request.url);/a\
\
            // Serve static assets (CSS, JS, fonts) via Pages ASSETS binding\
            // Without this, _worker.js catches all requests and static files 404\
            if (url.pathname.startsWith("/_next/static/") ||\
                url.pathname.startsWith("/favicon.ico") ||\
                url.pathname.match(/\\.(css|js|woff2?|png|jpg|svg|ico|json)$/)) {\
                try {\
                    const asset = await env.ASSETS.fetch(request);\
                    if (asset && asset.ok) return asset;\
                } catch (e) { /* fall through */ }\
            }' \
  "$OPENNEXT/worker.js" > "$WORKER_JS"

echo "✓ Copied worker + middleware + server-functions into $ASSETS/"
echo "  _worker.js (patched: static assets, no DO exports)"
echo "  middleware/, server-functions/, cloudflare/"
