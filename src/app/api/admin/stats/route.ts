// GET /api/admin/stats — Super admin stats
import { NextResponse } from 'next/server';
import { queryAll, queryFirst } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';
import { isTrue } from '@/lib/db';

export async function GET() {
  try {
    await initDBFromEnv();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTrue(user.is_admin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all active users with menu counts
    const users = await queryAll<{
      id: string;
      email: string;
      restaurant_name: string;
      plan: string;
      is_admin: number;
      created_at: string;
      menu_count: number;
    }>(
      `SELECT u.id, u.email, u.restaurant_name, u.plan, u.is_admin, u.created_at,
              COUNT(m.id) as menu_count
       FROM users u
       LEFT JOIN menus m ON u.id = m.user_id
       WHERE u.is_active = 1
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    // Compute plan stats
    const stats = {
      total: users.length,
      free: 0,
      starter: 0,
      pro: 0,
      enterprise: 0,
    };

    for (const u of users) {
      const plan = u.plan || 'free';
      if (plan in stats) {
        (stats as Record<string, number>)[plan]++;
      }
    }

    const restaurants = users.map((u) => ({
      id: u.id,
      email: u.email,
      restaurant_name: u.restaurant_name,
      plan: u.plan || 'free',
      is_admin: isTrue(u.is_admin),
      menu_count: u.menu_count,
      created_at: u.created_at,
    }));

    return NextResponse.json({ restaurants, stats });
  } catch (err) {
    console.error('GET /api/admin/stats error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
