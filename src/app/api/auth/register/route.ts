// POST /api/auth/register — Create account
import { NextResponse } from 'next/server';
import {
  queryFirst,
  execute,
  generateId,
  hashPassword,
  now,
} from '@/lib/db';
import { createSession, sessionCookieHeader, safeUser } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';

export async function POST(request: Request) {
  try {
    await initDBFromEnv();
    const { email, password, restaurantName } = await request.json();

    // Validate
    if (!email || !password || !restaurantName) {
      return NextResponse.json(
        { error: 'Email, password, and restaurant name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing
    const existing = await queryFirst<{ id: string }>(
      `SELECT id FROM users WHERE email = ?`,
      [normalizedEmail]
    );
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const id = generateId();
    const passwordHash = await hashPassword(password);
    const result = await execute(
      `INSERT INTO users (id, email, password_hash, restaurant_name, plan, is_admin, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'free', 0, 1, ?, ?)`,
      [id, normalizedEmail, passwordHash, restaurantName.trim(), now(), now()]
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Create session
    const token = await createSession(id);

    // Return user + set cookie
    const user = await queryFirst<import('@/lib/auth').User>(
      `SELECT * FROM users WHERE id = ?`,
      [id]
    );

    const response = NextResponse.json({
      success: true,
      user: user ? safeUser(user) : null,
      redirect: '/dashboard',
    });

    const [key, value] = sessionCookieHeader(token);
    response.headers.set(key, value);

    return response;
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
