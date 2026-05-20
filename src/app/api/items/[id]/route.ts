// PUT /api/items/[id] — Update an item
// DELETE /api/items/[id] — Delete an item
import { NextResponse } from 'next/server';
import { queryFirst, execute, now, toInt } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDBFromEnv();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify item exists and belongs to user's menu (via category → menu)
    const item = await queryFirst<{
      id: string;
      category_id: string;
      user_id?: string;
    }>(
      `SELECT i.id, i.category_id, m.user_id
       FROM menu_items i
       JOIN menu_categories c ON i.category_id = c.id
       JOIN menus m ON c.menu_id = m.id
       WHERE i.id = ?`,
      [id]
    );

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, image_url, dietary_tags, is_available } =
      body;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Item name cannot be empty' },
          { status: 400 }
        );
      }
      updates.push('name = ?');
      values.push(name.trim());
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description?.trim() || null);
    }

    if (price !== undefined) {
      const itemPrice = parseFloat(String(price));
      if (isNaN(itemPrice) || itemPrice < 0) {
        return NextResponse.json(
          { error: 'Price must be a valid non-negative number' },
          { status: 400 }
        );
      }
      updates.push('price = ?');
      values.push(itemPrice);
    }

    if (image_url !== undefined) {
      updates.push('image_url = ?');
      values.push(image_url?.trim() || null);
    }

    if (dietary_tags !== undefined) {
      let tags = '[]';
      if (typeof dietary_tags === 'string') {
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
      }
      updates.push('dietary_tags = ?');
      values.push(tags);
    }

    if (is_available !== undefined) {
      updates.push('is_available = ?');
      values.push(toInt(!!is_available));
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = ?');
    values.push(now());
    values.push(id);

    const result = await execute(
      `UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to update item' },
        { status: 500 }
      );
    }

    const updated = await queryFirst(
      `SELECT id, category_id, name, description, price, image_url, dietary_tags, sort_order, is_available, created_at, updated_at FROM menu_items WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ item: updated });
  } catch (err) {
    console.error('PUT /api/items/[id] error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDBFromEnv();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify item exists and belongs to user's menu
    const item = await queryFirst<{
      id: string;
      category_id: string;
      user_id?: string;
    }>(
      `SELECT i.id, i.category_id, m.user_id
       FROM menu_items i
       JOIN menu_categories c ON i.category_id = c.id
       JOIN menus m ON c.menu_id = m.id
       WHERE i.id = ?`,
      [id]
    );

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await execute(`DELETE FROM menu_items WHERE id = ?`, [id]);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to delete item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/items/[id] error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
