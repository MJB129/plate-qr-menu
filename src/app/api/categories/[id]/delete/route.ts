// POST /api/categories/[id]/delete — Delete a category via form POST
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

    // Verify ownership
    const cat = await queryFirst<{ menu_id: string; user_id: string }>(
      `SELECT c.menu_id, m.user_id FROM menu_categories c JOIN menus m ON c.menu_id = m.id WHERE c.id = ?`,
      [id]
    );
    if (!cat) {
      return new Response('<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus?error=Category+not+found"></body></html>', {
        status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    if (cat.user_id !== user.id) {
      return new Response(`<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus/new?id=${cat.menu_id}&error=Forbidden"></body></html>`, {
        status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Delete cascades to items via FK
    await execute('DELETE FROM menu_categories WHERE id = ?', [id]);

    return new Response(`<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus/new?id=${cat.menu_id}"></body></html>`, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('Delete category error:', err);
    return new Response('<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus?error=Server+error"></body></html>', {
      status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
