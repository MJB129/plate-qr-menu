// POST /api/menus/[id]/categories/add — Add category via form POST
import { NextRequest, NextResponse } from 'next/server';
import { execute, generateId, queryFirst, now } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';
import { isTrue } from '@/lib/db';
import { checkCategoryLimit } from '@/lib/plan-limits';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDBFromEnv();
    const { id } = await params;

    const user = await getCurrentUser();
    if (!user) return new Response('<html><body><meta http-equiv="refresh" content="0;url=/auth"></body></html>', { status: 200, headers: { 'Content-Type': 'text/html' } });

    const isForm = request.headers.get('content-type')?.includes('form-urlencoded');
    const formData = isForm ? await request.formData() : await request.json();
    const name = (formData.get?.('name') || (formData as any).name || '').toString().trim();
    const description = (formData.get?.('description') || (formData as any).description || '').toString().trim();

    if (!name) {
      return new Response(`<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus/new?id=${id}&error=Category+name+required"></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html' } });
    }

    // Verify menu ownership
    const menu = await queryFirst<{ user_id: string }>('SELECT user_id FROM menus WHERE id = ?', [id]);
    if (!menu || menu.user_id !== user.id) {
      return new Response(`<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus/new?id=${id}&error=Not+found"></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html' } });
    }

    // Plan limit check
    const catCheck = await checkCategoryLimit(id, user.plan);
    if (!catCheck.allowed) {
      const msg = `Plan limit reached. Your ${user.plan} plan allows ${catCheck.limit} categories per menu.`;
      return new Response(
        `<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus/new?id=${id}&error=${encodeURIComponent(msg)}"></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Get max sort_order
    const maxSort = await queryFirst<{ m: number }>('SELECT COALESCE(MAX(sort_order), -1) + 1 as m FROM menu_categories WHERE menu_id = ?', [id]);

    const catId = generateId();
    await execute(
      'INSERT INTO menu_categories (id, menu_id, name, description, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [catId, id, name, description, maxSort?.m || 0, now()]
    );

    return new Response(`<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus/new?id=${id}"></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html' } });
  } catch (err) {
    console.error('Add category error:', err);
    return new Response(`<html><body><meta http-equiv="refresh" content="0;url=/dashboard/menus/new?id=${(await params).id}&error=Server+error"></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html' } });
  }
}
