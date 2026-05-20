// POST /api/auth/logout — Sign out
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { destroySession, clearSessionHeader } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';

const SESSION_COOKIE = 'plate_session';

export async function POST(_request: Request) {
  try {
    await initDBFromEnv();

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

    if (sessionToken) {
      await destroySession(sessionToken);
    }

    const response = NextResponse.json({ success: true });

    const [cookieKey, cookieValue] = clearSessionHeader();
    response.headers.set(cookieKey, cookieValue);

    return response;
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
