import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { checkRateLimit } from '@/lib/rate-limit';

export async function proxy(request: NextRequest) {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const db = (ctx.env as { DB: D1Database }).DB;

    if (!db) return NextResponse.next();

    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      'unknown';

    const { pathname } = request.nextUrl;
    const isAuthRoute =
      pathname === '/api/auth/login' || pathname === '/api/auth/register';

    const limit = isAuthRoute ? 10 : 60;
    const key = `${ip}:${isAuthRoute ? 'auth' : 'api'}`;

    const result = await checkRateLimit(db, key, limit, 60);

    if (!result.allowed) {
      const retryAfter = String(result.resetAt - Math.floor(Date.now() / 1000));
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': retryAfter,
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetAt),
          'Content-Type': 'text/plain',
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetAt));
    return response;
  } catch (err) {
    // Fail open — never block requests due to rate limiter failure
    console.error('[rate-limit] proxy error:', err);
    return NextResponse.next();
  }
}

export const runtime = 'edge';

export const config = {
  matcher: ['/api/:path*'],
};
