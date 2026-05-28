// GET /api/menus/[id] — Get menu with nested categories and items
// PUT /api/menus/[id] — Update menu
// DELETE /api/menus/[id] — Delete menu
import { NextResponse } from 'next/server';
import { queryFirst, queryAll, execute, now, toInt } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';

export async function GET(
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

    // Get menu and verify ownership
    const menu = await queryFirst<{
      id: string;
      user_id: string;
      name: string;
      slug: string;
      is_published: number;
      theme: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, user_id, name, slug, is_published, theme, created_at, updated_at FROM menus WHERE id = ?`,
      [id]
    );

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    if (menu.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get categories (ordered by sort_order)
    const categories = await queryAll<{
      id: string;
      menu_id: string;
      name: string;
      description: string;
      sort_order: number;
      created_at: string;
    }>(
      `SELECT id, menu_id, name, description, sort_order, created_at FROM menu_categories WHERE menu_id = ? ORDER BY sort_order ASC`,
      [id]
    );

    // Get items for each category
    const categoriesWithItems = await Promise.all(
      categories.map(async (cat) => {
        const items = await queryAll<{
          id: string;
          category_id: string;
          name: string;
          description: string;
          price: number;
          image_url: string;
          dietary_tags: string;
          sort_order: number;
          is_available: number;
          created_at: string;
          updated_at: string;
        }>(
          `SELECT id, category_id, name, description, price, image_url, dietary_tags, sort_order, is_available, created_at, updated_at FROM menu_items WHERE category_id = ? ORDER BY sort_order ASC`,
          [cat.id]
        );

        return { ...cat, items };
      })
    );

    const { user_id, ...safeMenu } = menu;

    return NextResponse.json({
      menu: safeMenu,
      categories: categoriesWithItems,
    });
  } catch (err) {
    console.error('GET /api/menus/[id] error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Verify ownership
    const menu = await queryFirst<{ id: string; user_id: string }>(
      `SELECT id, user_id FROM menus WHERE id = ?`,
      [id]
    );

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    if (menu.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isForm = request.headers.get('content-type')?.includes('form-urlencoded') ||
                   request.headers.get('content-type')?.includes('multipart/form-data');

    // Read body text once to avoid consuming the stream
    const bodyText = await request.text();

    let name: string | undefined;
    let theme: string | undefined;
    let is_published: number | undefined;

    if (isForm) {
      const params = new URLSearchParams(bodyText);
      const n = params.get('name');
      if (n !== null) name = n;
      const t = params.get('theme');
      if (t !== null) theme = t;
      const p = params.get('is_published');
      if (p !== null) is_published = parseInt(p);
    } else {
      try {
        const body = JSON.parse(bodyText);
        name = body.name;
        theme = body.theme;
        is_published = body.is_published;
      } catch {
        // Fallback: try URLSearchParams
        const params = new URLSearchParams(bodyText);
        const n = params.get('name');
        if (n !== null) name = n;
        const t = params.get('theme');
        if (t !== null) theme = t;
        const p = params.get('is_published');
        if (p !== null) is_published = parseInt(p);
      }
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        const err = 'Menu name cannot be empty';
        if (isForm) {
          return new Response(`<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus/new?id=${id}&error=${encodeURIComponent(err)}"></body></html>`, {
            status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
        return NextResponse.json({ error: err }, { status: 400 });
      }
      updates.push('name = ?');
      values.push(name.trim());
    }

    if (theme !== undefined) {
      updates.push('theme = ?');
      values.push(theme);
    }

    if (is_published !== undefined) {
      updates.push('is_published = ?');
      values.push(toInt(!!is_published));
    }

    if (updates.length === 0) {
      const err = 'No fields to update';
      if (isForm) {
        return new Response(`<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus/new?id=${id}&error=${encodeURIComponent(err)}"></body></html>`, {
          status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      return NextResponse.json({ error: err }, { status: 400 });
    }

    updates.push('updated_at = ?');
    values.push(now());
    values.push(id);

    const result = await execute(
      `UPDATE menus SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (!result.success) {
      const err = 'Failed to update menu';
      if (isForm) {
        return new Response(`<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus/new?id=${id}&error=${encodeURIComponent(err)}"></body></html>`, {
          status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      return NextResponse.json({ error: err }, { status: 500 });
    }

    if (isForm) {
      return new Response(`<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus/new?id=${id}"></body></html>`, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const updated = await queryFirst(
      `SELECT id, name, slug, is_published, theme, created_at, updated_at FROM menus WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ menu: updated });
  } catch (err) {
    console.error('PUT /api/menus/[id] error:', err);
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

    // Verify ownership
    const menu = await queryFirst<{ id: string; user_id: string }>(
      `SELECT id, user_id FROM menus WHERE id = ?`,
      [id]
    );

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    if (menu.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete cascades to categories and items via FK constraints
    const result = await execute(`DELETE FROM menus WHERE id = ?`, [id]);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to delete menu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/menus/[id] error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler for form-based updates (menu builder uses method="POST")
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}
