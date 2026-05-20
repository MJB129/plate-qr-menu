#!/bin/bash
# Prepare the OpenNext build for Cloudflare Pages deployment by copying
# the worker, middleware, and server-functions into the assets directory.
#
# Cloudflare Pages compiles _worker.js (if present in build output) as the
# Pages Worker. We also need middleware/ and server-functions/ for the
# worker to resolve its imports at compile time.
#
# Also strips Durable Object exports from worker.js since we don't use them.

set -e

OPENNEXT=".open-next"
ASSETS="$OPENNEXT/assets"

if [ ! -f "$OPENNEXT/worker.js" ]; then
  echo "ERROR: $OPENNEXT/worker.js not found — run cf:build first" >&2
  exit 1
fi

# Create _worker.js (stripped of Durable Object exports that can't resolve)
sed -e '/export { DOQueueHandler/d' \
    -e '/export { DOShardedTagCache/d' \
    -e '/export { BucketCachePurge/d' \
    "$OPENNEXT/worker.js" > "$ASSETS/_worker.js"

# Copy runtime dependencies into assets for worker compilation
cp -r "$OPENNEXT/middleware" "$ASSETS/"
cp -r "$OPENNEXT/server-functions" "$ASSETS/"
cp -r "$OPENNEXT/cloudflare" "$ASSETS/"

echo "✓ Copied worker + middleware + server-functions into $ASSETS/"
echo "  _worker.js, middleware/, server-functions/, cloudflare/"
