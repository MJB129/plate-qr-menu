// GET /api/auth/me — Current user from session cookie
// PUT /api/auth/me — Update current user
import { NextResponse } from 'next/server';
import { getCurrentUser, safeUser } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';
import { execute } from '@/lib/db';

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

export async function PUT(request: Request) {
  try {
    await initDBFromEnv();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { restaurant_name } = body;

    if (restaurant_name !== undefined) {
      if (typeof restaurant_name !== 'string' || restaurant_name.length > 100) {
        return NextResponse.json(
          { error: 'Restaurant name must be a string under 100 characters' },
          { status: 400 }
        );
      }
      await execute(
        `UPDATE users SET restaurant_name = ?, updated_at = datetime('now') WHERE id = ?`,
        [restaurant_name.trim(), user.id]
      );
    }

    const updated = await getCurrentUser();
    return NextResponse.json({ success: true, user: safeUser(updated || user) });
  } catch (err) {
    console.error('PUT /api/auth/me error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
