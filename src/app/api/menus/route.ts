// GET /api/menus — List all menus for current user
// POST /api/menus — Create a new menu
import { NextResponse } from 'next/server';
import { queryAll, queryFirst, execute, generateId, now } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';

export async function GET() {
  try {
    await initDBFromEnv();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const menus = await queryAll<{
      id: string;
      name: string;
      slug: string;
      is_published: number;
      theme: string;
      created_at: string;
    }>(
      `SELECT id, name, slug, is_published, theme, created_at FROM menus WHERE user_id = ? ORDER BY created_at DESC`,
      [user.id]
    );

    return NextResponse.json({ menus });
  } catch (err) {
    console.error('GET /api/menus error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await initDBFromEnv();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, theme } = body;

    // Validate
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Menu name is required' },
        { status: 400 }
      );
    }

    const menuName = name.trim();
    // Auto-generate slug from name if not provided
    const menuSlug =
      slug && typeof slug === 'string' && slug.trim().length > 0
        ? slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : menuName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

    if (!menuSlug) {
      return NextResponse.json(
        { error: 'Could not generate a valid slug from the provided name' },
        { status: 400 }
      );
    }

    // Check slug uniqueness for this user
    const existing = await queryFirst<{ id: string }>(
      `SELECT id FROM menus WHERE user_id = ? AND slug = ?`,
      [user.id, menuSlug]
    );
    if (existing) {
      return NextResponse.json(
        { error: 'A menu with this slug already exists. Please use a different name or slug.' },
        { status: 409 }
      );
    }

    const id = generateId();
    const menuTheme = theme || 'warm';
    const timestamp = now();

    const result = await execute(
      `INSERT INTO menus (id, user_id, name, slug, is_published, theme, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
      [id, user.id, menuName, menuSlug, menuTheme, timestamp, timestamp]
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to create menu' },
        { status: 500 }
      );
    }

    const menu = await queryFirst(
      `SELECT id, name, slug, is_published, theme, created_at FROM menus WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ menu }, { status: 201 });
  } catch (err) {
    console.error('POST /api/menus error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
