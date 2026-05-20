// D1 initialization via getCloudflareContext
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { initDB } from './db';

let initialized = false;

export async function initDBFromEnv() {
  if (initialized) return;

  try {
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx.env as Record<string, unknown>;
    const rawDB = env.DB;

    if (rawDB && typeof rawDB === 'object') {
      // Try to access as D1Database directly
      initDB(rawDB as D1Database);
      initialized = true;
      return;
    }
  } catch (err) {
    console.error('initDBFromEnv error:', err);
  }

  console.warn('D1 binding "DB" not found');
}
