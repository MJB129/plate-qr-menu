// POST /api/auth/login — Sign in
import { NextResponse } from 'next/server';
import { queryFirst, hashPassword } from '@/lib/db';
import { createSession, sessionCookieHeader, safeUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';

export async function POST(request: Request) {
  try {
    await initDBFromEnv();

    const contentType = request.headers.get('content-type') || '';
    let email: string, password: string;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } else {
      const formData = await request.formData();
      email = formData.get('email') as string;
      password = formData.get('password') as string;
    }

    if (!email || !password) {
      const isForm = request.headers.get('content-type')?.includes('application/x-www-form-urlencoded') || 
                     request.headers.get('content-type')?.includes('multipart/form-data');
      if (isForm) {
        return new Response('<html><body><meta http-equiv="refresh" content="0;url=/auth?error=Email+and+password+are+required"></body></html>', {
          status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
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
      const isForm = request.headers.get('content-type')?.includes('application/x-www-form-urlencoded') || 
                     request.headers.get('content-type')?.includes('multipart/form-data');
      if (isForm) {
        return new Response('<html><body><meta http-equiv="refresh" content="0;url=/auth?error=Invalid+email+or+password"></body></html>', {
          status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Compare password
    if (user.password_hash !== passwordHash) {
      const isForm = request.headers.get('content-type')?.includes('application/x-www-form-urlencoded') || 
                     request.headers.get('content-type')?.includes('multipart/form-data');
      if (isForm) {
        return new Response('<html><body><meta http-equiv="refresh" content="0;url=/auth?error=Invalid+email+or+password"></body></html>', {
          status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const token = await createSession(user.id);

    // Build response
    const isForm = request.headers.get('content-type')?.includes('application/x-www-form-urlencoded') || 
                   request.headers.get('content-type')?.includes('multipart/form-data');

    if (isForm) {
      // Form submission — return HTML that sets cookie then redirects
      // meta refresh is more reliable than JS redirect for cookie timing
      const html = `<html><body><meta http-equiv="refresh" content="0;url=/dashboard">Redirecting...</body></html>`;
      const [cookieKey, cookieValue] = sessionCookieHeader(token);
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          [cookieKey]: cookieValue,
        },
      });
    }

    // JSON submission — return JSON response
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
