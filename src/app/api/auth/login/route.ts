// POST /api/auth/login — Sign in
import { NextResponse } from 'next/server';
import { queryFirst, hashPassword } from '@/lib/db';
import { createSession, sessionCookieHeader, safeUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';

export async function POST(request: Request) {
  try {
    await initDBFromEnv();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await hashPassword(password);

    // Find user by email
    const user = await queryFirst<User>(
      `SELECT * FROM users WHERE email = ? AND is_active = 1`,
      [normalizedEmail]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Compare password
    if (user.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const token = await createSession(user.id);

    // Build response
    const response = NextResponse.json({
      success: true,
      user: safeUser(user),
      redirect: '/dashboard',
    });

    const [cookieKey, cookieValue] = sessionCookieHeader(token);
    response.headers.set(cookieKey, cookieValue);

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
