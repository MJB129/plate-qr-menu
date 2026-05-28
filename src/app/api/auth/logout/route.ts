// POST /api/auth/logout — Sign out
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { destroySession, clearSessionHeader } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';

const SESSION_COOKIE = 'plate_session';

export async function POST(request: Request) {
  try {
    await initDBFromEnv();

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

    if (sessionToken) {
      await destroySession(sessionToken);
    }

    const isForm = request.headers.get('content-type')?.includes('application/x-www-form-urlencoded') ||
                   request.headers.get('content-type')?.includes('multipart/form-data');

    if (isForm) {
      const html = `<html><body><meta http-equiv="refresh" content="0;url=/auth">Signed out.</body></html>`;
      const [key, val] = clearSessionHeader();
      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', [key]: val },
      });
    }

    const response = NextResponse.json({ success: true });
    const [key, val] = clearSessionHeader();
    response.headers.set(key, val);
    return response;
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
