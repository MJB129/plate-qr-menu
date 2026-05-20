// GET /api/auth/me — Current user from session cookie
import { NextResponse } from 'next/server';
import { getCurrentUser, safeUser } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';

export async function GET(_request: Request) {
  try {
    await initDBFromEnv();

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('Auth me error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
