#!/bin/bash
# Patch the OpenNext middleware to route API calls to the Next.js handler
# instead of serving them as static HTML pages.
#
# OpenNext's getStaticAPIRoutes() collects API routes from the Next.js
# routes-manifest (where they're listed as "static") and feeds them to
# the static route matcher. This causes the middleware to serve API
# endpoints as prerendered HTML instead of forwarding to the server function.
#
# This script replaces that call with an empty array, forcing API routes
# through the Next.js handler where they belong.

HANDLER=".open-next/middleware/handler.mjs"

if [ ! -f "$HANDLER" ]; then
  echo "ERROR: $HANDLER not found — run cf:build first" >&2
  exit 1
fi

# Replace: return [...pagesStaticAPIRoutes, ...appPathsStaticAPIRoutes];
# With:    return [];  (API routes handled by Next.js server function)
sed -i 's/return \[\.\.\.pagesStaticAPIRoutes, \.\.\.appPathsStaticAPIRoutes\];/return []; \/\/ API routes handled by Next.js server function/' "$HANDLER"

if grep -q "return \[\];" "$HANDLER"; then
  echo "✓ Patched $HANDLER — API routes will bypass static serving"
else
  echo "⚠ Could not verify patch in $HANDLER. The sed pattern may have changed."
fi
