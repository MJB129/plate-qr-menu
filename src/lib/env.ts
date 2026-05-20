// D1 initialization via @opennextjs/cloudflare
// Works in both local dev (wrangler dev) and Cloudflare Pages production

import { initDB } from './db';

let initialized = false;

export async function initDBFromEnv() {
  if (initialized) return;

  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx.env as Record<string, unknown>;

    if (env.DB) {
      initDB(env.DB as D1Database);
      initialized = true;
      return;
    }
  } catch {
    // Fallback: try process.env for some adapter patterns
    const envDB = (process.env as Record<string, unknown>).DB;
    if (envDB && typeof envDB === 'object') {
      initDB(envDB as D1Database);
      initialized = true;
      return;
    }
  }

  if (!initialized) {
    console.warn(
      'D1 not available — DB operations will fail. Make sure wrangler.toml has a D1 binding named "DB".'
    );
  }
}
