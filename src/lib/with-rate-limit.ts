import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { checkRateLimit } from '@/lib/rate-limit';

type RouteGroup = 'auth' | 'api';

const RATE_LIMITS: Record<RouteGroup, { limit: number; windowSeconds: number }> = {
  auth: { limit: 10, windowSeconds: 60 },
  api: { limit: 60, windowSeconds: 60 },
};

/**
 * Apply rate limiting to an incoming request.
 * Call this at the top of any API route handler.
 *
 * Returns a NextResponse with 429 if rate limited, or null to proceed.
 */
export async function rateLimitOrRespond(
  request: NextRequest,
  group: RouteGroup = 'api',
): Promise<NextResponse | null> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const db = (ctx.env as { DB: D1Database }).DB;
    if (!db) return null; // fail open

    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      'unknown';

    const config = RATE_LIMITS[group];
    const key = `${ip}:${group}`;
    const result = await checkRateLimit(db, key, config.limit, config.windowSeconds);

    if (!result.allowed) {
      const retryAfter = String(result.resetAt - Math.floor(Date.now() / 1000));
      return NextResponse.json(
        { error: 'Too Many Requests', retryAfter: Number(retryAfter) },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter,
            'X-RateLimit-Limit': String(config.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetAt),
          },
        },
      );
    }

    // Attach rate limit headers to the response later if needed
    // Stored on the response for middleware-free usage
    return null; // proceed
  } catch {
    // Fail open — never block a request due to rate limiter failure
    return null;
  }
}

/**
 * Higher-order function that wraps an API route handler with rate limiting.
 *
 * Usage:
 *   export const GET = withRateLimit('api', async (request) => { ... });
 *   export const POST = withRateLimit('auth', async (request) => { ... });
 */
export function withRateLimit(
  group: RouteGroup,
  handler: (request: NextRequest) => Promise<NextResponse>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const blocked = await rateLimitOrRespond(request, group);
    if (blocked) return blocked;
    const response = await handler(request);
    return response;
  };
}
