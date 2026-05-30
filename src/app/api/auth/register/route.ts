// POST /api/auth/register — Create account
import { NextRequest, NextResponse } from 'next/server';
import {
  queryFirst,
  execute,
  hashPassword,
  generateId,
  now,
} from '@/lib/db';
import { createSession, sessionCookieHeader, safeUser } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';
import { rateLimitOrRespond } from '@/lib/with-rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimited = await rateLimitOrRespond(request, 'auth');
    if (rateLimited) return rateLimited;

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
    const passwordHash = await hashPassword(password);
    const id = generateId();
    
    // Admin emails — these accounts get full admin access
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'mbutler@romedigital.tech').split(',').map(e => e.trim().toLowerCase());
    const isAdmin = ADMIN_EMAILS.includes(normalizedEmail) ? 1 : 0;
    
    const result = await execute(
      `INSERT INTO users (id, email, password_hash, restaurant_name, plan, is_admin, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [id, normalizedEmail, passwordHash, restaurantName.trim(), isAdmin ? 'enterprise' : 'free', isAdmin, now(), now()]
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to create account', detail: result.error },
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
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    );
  }
}
