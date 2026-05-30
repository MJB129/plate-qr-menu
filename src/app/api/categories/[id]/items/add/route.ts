// POST /api/categories/[id]/items/add — Add item via form POST
import { NextRequest } from 'next/server';
import { execute, generateId, queryFirst, now } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';
import { checkItemLimit } from '@/lib/plan-limits';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDBFromEnv();
    const { id } = await params;

    const user = await getCurrentUser();
    if (!user) return new Response('<html><body><meta http-equiv="refresh" content="0;url=/auth"></body></html>', { status: 200, headers: { 'Content-Type': 'text/html' } });

    const formData = await request.formData();
    const name = (formData.get('name') as string || '').toString().trim();
    const description = (formData.get('description') as string || '').toString().trim();
    const price = parseFloat(formData.get('price') as string) || 0;
    const image_url = (formData.get('image_url') as string || '').toString().trim();
    const dietary_tags_raw = formData.get('dietary_tags') as string || '[]';

    // Get the menu_id from the category to build the redirect URL
    const cat = await queryFirst<{ menu_id: string }>('SELECT menu_id FROM menu_categories WHERE id = ?', [id]);
    const menuId = cat?.menu_id || '';
    const redirectBase = `/dashboard/menus/new?id=${menuId}`;

    if (!name) {
      return new Response(`<html><body><meta http-equiv="refresh" content="0;url=${redirectBase}&error=Item+name+required"></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html' } });
    }

    // Verify ownership
    const menu = await queryFirst<{ user_id: string }>('SELECT user_id FROM menus WHERE id = ?', [menuId]);
    if (!menu || menu.user_id !== user.id) {
      return new Response(`<html><body><meta http-equiv="refresh" content="0;url=${redirectBase}&error=Not+found"></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html' } });
    }

    // Plan limit check
    const itemCheck = await checkItemLimit(user.id, user.plan);
    if (!itemCheck.allowed) {
      const msg = `Plan limit reached. Your ${user.plan} plan allows ${itemCheck.limit} items total.`;
      return new Response(
        `<html><body><meta http-equiv="refresh" content="0;url=${redirectBase}&error=${encodeURIComponent(msg)}"></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Parse dietary tags from form (comma separated)
    let tags: string[];
    try { tags = JSON.parse(dietary_tags_raw); } catch { tags = dietary_tags_raw ? dietary_tags_raw.split(',').map((t: string) => t.trim()).filter(Boolean) : []; }

    // Get max sort_order
    const maxSort = await queryFirst<{ m: number }>('SELECT COALESCE(MAX(sort_order), -1) + 1 as m FROM menu_items WHERE category_id = ?', [id]);

    const itemId = generateId();
    await execute(
      'INSERT INTO menu_items (id, category_id, name, description, price, image_url, dietary_tags, sort_order, is_available, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
      [itemId, id, name, description, price, image_url, JSON.stringify(tags), maxSort?.m || 0, now(), now()]
    );

    return new Response(`<html><body><meta http-equiv="refresh" content="0;url=${redirectBase}"></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html' } });
  } catch (err) {
    console.error('Add item error:', err);
    return new Response(`<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus/new?id=${(await params).id}&error=Server+error"></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html' } });
  }
}
