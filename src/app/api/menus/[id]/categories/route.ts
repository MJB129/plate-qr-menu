// POST /api/menus/[id]/categories — Create a new category for a menu
import { NextResponse } from 'next/server';
import { queryFirst, execute, generateId, now } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDBFromEnv();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: menuId } = await params;

    // Verify menu exists and belongs to user
    const menu = await queryFirst<{ id: string; user_id: string }>(
      `SELECT id, user_id FROM menus WHERE id = ?`,
      [menuId]
    );

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    if (menu.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    // Validate
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Get the current max sort_order for this menu
    const maxOrder = await queryFirst<{ max_order: number }>(
      `SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM menu_categories WHERE menu_id = ?`,
      [menuId]
    );

    const sortOrder = (maxOrder?.max_order ?? -1) + 1;
    const id = generateId();
    const timestamp = now();

    const result = await execute(
      `INSERT INTO menu_categories (id, menu_id, name, description, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, menuId, name.trim(), description?.trim() || null, sortOrder, timestamp]
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }

    const category = await queryFirst(
      `SELECT id, menu_id, name, description, sort_order, created_at FROM menu_categories WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    console.error('POST /api/menus/[id]/categories error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
