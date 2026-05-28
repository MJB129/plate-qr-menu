// Patch the OpenNext worker.js for Cloudflare Pages deployment:
// 1. Strip Durable Object exports (not available in Pages context)
// 2. Inject static asset fallback serving via env.ASSETS
import { readFileSync, writeFileSync } from 'fs';

const [, , srcPath, dstPath] = process.argv;
if (!srcPath || !dstPath) {
  console.error('Usage: node patch-worker.mjs <src> <dst>');
  process.exit(1);
}

let code = readFileSync(srcPath, 'utf8');

// Strip Durable Object exports
code = code
  .replace(/^export \{ DOQueueHandler[^\n]*\n/m, '')
  .replace(/^export \{ DOShardedTagCache[^\n]*\n/m, '')
  .replace(/^export \{ BucketCachePurge[^\n]*\n/m, '');

// Inject static asset serving right after the URL is parsed.
// Regex handles both LF and CRLF line endings.
const anchor = /const url = new URL\(request\.url\);/;
if (!anchor.test(code)) {
  console.error('ERROR: injection anchor not found in worker.js — check OpenNext output');
  process.exit(1);
}

const ASSET_GUARD = `const url = new URL(request.url);

            // Serve static assets via ASSETS binding.
            // _routes.json handles /_next/static/* at the CDN level, but this
            // fallback catches anything that slips through to the worker.
            if (
              url.pathname.startsWith('/_next/static/') ||
              url.pathname === '/favicon.ico' ||
              /\\.(css|js|woff2?|png|jpe?g|svg|ico|json)$/.test(url.pathname)
            ) {
              try {
                const asset = await env.ASSETS.fetch(request);
                if (asset && asset.ok) return asset;
              } catch (_) { /* fall through to Next.js handler */ }
            }`;

let patched = false;
code = code.replace(anchor, (match) => {
  if (patched) return match;
  patched = true;
  return ASSET_GUARD;
});

writeFileSync(dstPath, code);
console.log('✓ worker.js patched successfully');
