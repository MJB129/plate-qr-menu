// POST /api/menus/[id]/publish — Toggle publish status via form POST
import { NextRequest } from 'next/server';
import { queryFirst, execute, now, toInt } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';

export async function POST(
  request: NextRequest,
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
    const menu = await queryFirst<{ id: string; user_id: string }>(
      'SELECT id, user_id FROM menus WHERE id = ?', [id]
    );
    if (!menu || menu.user_id !== user.id) {
      return new Response(`<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus/new?id=${id}&error=Not+found"></body></html>`, {
        status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const formData = await request.formData();
    const isPublished = parseInt(formData.get('is_published') as string || '0');

    await execute(
      'UPDATE menus SET is_published = ?, updated_at = ? WHERE id = ?',
      [toInt(!!isPublished), now(), id]
    );

    return new Response(`<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus/new?id=${id}"></body></html>`, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('Publish error:', err);
    return new Response(`<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus/new?id=${(await params).id}&error=Server+error"></body></html>`, {
      status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
