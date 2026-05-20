// PUT /api/categories/[id] — Update a category
// DELETE /api/categories/[id] — Delete a category (cascading to items)
import { NextResponse } from 'next/server';
import { queryFirst, execute, now } from '@/lib/db';
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
      [id]
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
    const { name, description } = body;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Category name cannot be empty' },
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

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(id);

    const result = await execute(
      `UPDATE menu_categories SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      );
    }

    const updated = await queryFirst(
      `SELECT id, menu_id, name, description, sort_order, created_at FROM menu_categories WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ category: updated });
  } catch (err) {
    console.error('PUT /api/categories/[id] error:', err);
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
      [id]
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

    // Delete cascades to items via FK constraints
    const result = await execute(`DELETE FROM menu_categories WHERE id = ?`, [
      id,
    ]);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/categories/[id] error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
