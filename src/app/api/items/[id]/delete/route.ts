// POST /api/items/[id]/delete — Delete an item via form POST
import { NextRequest } from 'next/server';
import { queryFirst, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDBFromEnv();
    const { id } = await params;

    const user = await getCurrentUser();
    if (!user) {
      return new Response('<html><body><meta http-equiv="refresh" content="0;url=/auth"></body></html>', {
        status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Verify ownership and get redirect menu_id
    const item = await queryFirst<{ category_id: string; user_id: string }>(
      `SELECT i.category_id, m.user_id FROM menu_items i
       JOIN menu_categories c ON i.category_id = c.id
       JOIN menus m ON c.menu_id = m.id
       WHERE i.id = ?`,
      [id]
    );
    if (!item) {
      return new Response('<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus?error=Item+not+found"></body></html>', {
        status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    if (item.user_id !== user.id) {
      return new Response('<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus?error=Forbidden"></body></html>', {
        status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Get the menu_id from category
    const cat = await queryFirst<{ menu_id: string }>('SELECT menu_id FROM menu_categories WHERE id = ?', [item.category_id]);

    await execute('DELETE FROM menu_items WHERE id = ?', [id]);

    const redirectBase = cat?.menu_id ? `/dashboard/menus/new?id=${cat.menu_id}` : '/dashboard/menus';
    return new Response(`<html><body><meta http-equiv="refresh" content="0;url=${redirectBase}"></body></html>`, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('Delete item error:', err);
    return new Response('<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus?error=Server+error"></body></html>', {
      status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
