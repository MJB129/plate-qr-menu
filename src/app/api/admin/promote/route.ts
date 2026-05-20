// POST /api/admin/promote — Promote a user to admin (setup utility)
// Only works if there are 0 admin users (first-run scenario)
import { NextResponse } from 'next/server';
import { queryFirst, execute } from '@/lib/db';
import { hashPassword } from '@/lib/db';
import { initDBFromEnv } from '@/lib/env';

export async function POST(request: Request) {
  try {
    await initDBFromEnv();
    const { email, password } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // If password provided, update it too
    if (password) {
      const pHash = await hashPassword(password);
      await execute(
        `UPDATE users SET is_admin = 1, plan = 'enterprise', password_hash = ?, updated_at = datetime('now') WHERE email = ?`,
        [pHash, normalizedEmail]
      );
    } else {
      await execute(
        `UPDATE users SET is_admin = 1, plan = 'enterprise', updated_at = datetime('now') WHERE email = ?`,
        [normalizedEmail]
      );
    }

    const user = await queryFirst(`SELECT id, email, is_admin, plan FROM users WHERE email = ?`, [normalizedEmail]);
    
    return NextResponse.json({ success: true, user });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
