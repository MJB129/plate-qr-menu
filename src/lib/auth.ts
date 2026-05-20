// Plate Dashboard — Auth Library
// Session management, password hashing, cookie helpers

import { cookies } from 'next/headers';
import {
  queryFirst,
  queryAll,
  execute,
  generateId,
  generateToken,
  hashPassword,
  now,
  isTrue,
} from './db';

// Types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  restaurant_name: string;
  plan: string;
  is_admin: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface SafeUser {
  id: string;
  email: string;
  restaurant_name: string;
  plan: string;
  is_admin: boolean;
  created_at: string;
}

// Strip sensitive fields for client
export function safeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    restaurant_name: user.restaurant_name,
    plan: user.plan,
    is_admin: isTrue(user.is_admin),
    created_at: user.created_at,
  };
}

const SESSION_COOKIE = 'plate_session';
const SESSION_DAYS = 30;

// Create a session for a user
export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const tokenHash = await hashPassword(token);
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const result = await execute(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`,
    [generateId(), userId, tokenHash, expiresAt, now()]
  );

  if (!result.success) {
    throw new Error('Failed to create session: ' + result.error);
  }

  return token;
}

// Verify a session token and return the user
export async function getSessionUser(token: string): Promise<User | null> {
  if (!token) return null;

  const tokenHash = await hashPassword(token);

  const session = await queryFirst<{
    user_id: string;
    expires_at: string;
  }>(
    `SELECT user_id, expires_at FROM sessions WHERE token_hash = ? AND expires_at > ?`,
    [tokenHash, now()]
  );

  if (!session) return null;

  // Extend session expiry
  const newExpiry = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  await execute(`UPDATE sessions SET expires_at = ? WHERE token_hash = ?`, [
    newExpiry,
    tokenHash,
  ]);

  const user = await queryFirst<User>(
    `SELECT * FROM users WHERE id = ? AND is_active = 1`,
    [session.user_id]
  );

  return user || null;
}

// Delete a session (logout)
export async function destroySession(token: string): Promise<void> {
  const tokenHash = await hashPassword(token);
  await execute(`DELETE FROM sessions WHERE token_hash = ?`, [tokenHash]);
}

// Get current user from cookie (for server components / API routes)
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return null;
  return getSessionUser(sessionToken);
}

// Require auth — get user or throw
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

// Set session cookie in response headers
export function sessionCookieHeader(token: string): [string, string] {
  return [
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${
      SESSION_DAYS * 24 * 60 * 60
    }; SameSite=Lax; Secure`,
  ];
}

// Clear session cookie
export function clearSessionHeader(): [string, string] {
  return [
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
  ];
}
