// POST /api/categories/[id]/items — Create a new item in a category
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

    const { id: categoryId } = await params;

    // Verify category exists and belongs to user's menu
    const category = await queryFirst<{
      id: string;
      menu_id: string;
      user_id?: string;
    }>(
      `SELECT c.id, c.menu_id, m.user_id
       FROM menu_categories c
       JOIN menus m ON c.menu_id = m.id
       WHERE c.id = ?`,
      [categoryId]
    );

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    if (category.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, image_url, dietary_tags } = body;

    // Validate
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Item name is required' },
        { status: 400 }
      );
    }

    const itemPrice =
      price !== undefined ? parseFloat(String(price)) : 0;
    if (isNaN(itemPrice) || itemPrice < 0) {
      return NextResponse.json(
        { error: 'Price must be a valid non-negative number' },
        { status: 400 }
      );
    }

    // Parse dietary_tags — default to '[]'
    let tags = '[]';
    if (dietary_tags !== undefined) {
      if (typeof dietary_tags === 'string') {
        // Validate it's valid JSON
        try {
          JSON.parse(dietary_tags);
          tags = dietary_tags;
        } catch {
          return NextResponse.json(
            { error: 'dietary_tags must be a valid JSON array string' },
            { status: 400 }
          );
        }
      } else if (Array.isArray(dietary_tags)) {
        tags = JSON.stringify(dietary_tags);
      } else {
        return NextResponse.json(
          { error: 'dietary_tags must be a JSON array string' },
          { status: 400 }
        );
      }
    }

    // Get the current max sort_order for this category
    const maxOrder = await queryFirst<{ max_order: number }>(
      `SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM menu_items WHERE category_id = ?`,
      [categoryId]
    );

    const sortOrder = (maxOrder?.max_order ?? -1) + 1;
    const id = generateId();
    const timestamp = now();

    const result = await execute(
      `INSERT INTO menu_items (id, category_id, name, description, price, image_url, dietary_tags, sort_order, is_available, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        categoryId,
        name.trim(),
        description?.trim() || null,
        itemPrice,
        image_url?.trim() || null,
        tags,
        sortOrder,
        timestamp,
        timestamp,
      ]
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to create item' },
        { status: 500 }
      );
    }

    const item = await queryFirst(
      `SELECT id, category_id, name, description, price, image_url, dietary_tags, sort_order, is_available, created_at, updated_at FROM menu_items WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error('POST /api/categories/[id]/items error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
