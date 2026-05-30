export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp (seconds)
}

export async function checkRateLimit(
  db: D1Database,
  key: string,
  limit: number,
  windowSecs: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSecs) * windowSecs;
  const resetAt = windowStart + windowSecs;

  const upsert = db.prepare(
    `INSERT INTO rate_limit_buckets (key, count, window_start)
     VALUES (?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN window_start = excluded.window_start
                    THEN count + 1
                    ELSE 1 END,
       window_start = excluded.window_start`
  ).bind(key, windowStart);

  const select = db.prepare(
    `SELECT count FROM rate_limit_buckets WHERE key = ?`
  ).bind(key);

  const [, selectResult] = await db.batch<{ count: number }>([upsert, select]);
  const count = selectResult.results[0]?.count ?? 1;

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}
