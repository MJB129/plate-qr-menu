import { initDBFromEnv } from '@/lib/env';
import { queryAll, queryFirst, execute, generateId, now, isTrue, toInt } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const THEMES = ['warm', 'dark', 'light', 'modern'] as const;

interface MenuData {
  id: string;
  name: string;
  slug: string;
  theme: string;
  is_published: number;
}

interface CategoryData {
  id: string;
  name: string;
  description: string;
  sort_order: number;
}

interface ItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  dietary_tags: string;
  is_available: number;
  sort_order: number;
  category_id: string;
}

export default async function MenuBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  await initDBFromEnv();
  const user = await getCurrentUser();
  if (!user) redirect('/auth');

  // ── Handle Actions ──────────────────────────────────────

  const action = params.action as string | undefined;

  // Create menu
  if (action === 'create') {
    const name = (params.name as string || '').trim();
    const theme = (params.theme as string) || 'warm';
    if (!name) redirect('/dashboard/menus/new?error=Menu+name+required');

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) redirect('/dashboard/menus/new?error=Invalid+name');

    const existing = await queryFirst<{ id: string }>('SELECT id FROM menus WHERE user_id = ? AND slug = ?', [user.id, slug]);
    if (existing) redirect(`/dashboard/menus/new?error=${encodeURIComponent('A menu with this slug already exists.')}`);

    const id = generateId();
    const ts = now();
    await execute(
      'INSERT INTO menus (id, user_id, name, slug, is_published, theme, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)',
      [id, user.id, name, slug, theme, ts, ts]
    );

    redirect(`/dashboard/menus/new?id=${id}`);
  }

  // Update menu name
  if (action === 'update') {
    const id = params.id as string;
    const name = (params.name as string || '').trim();
    if (!id || !name) redirect('/dashboard/menus');

    const menu = await queryFirst<{ id: string; user_id: string }>('SELECT id, user_id FROM menus WHERE id = ?', [id]);
    if (!menu || menu.user_id !== user.id) redirect('/dashboard/menus');

    await execute('UPDATE menus SET name = ?, updated_at = ? WHERE id = ?', [name, now(), id]);
    redirect(`/dashboard/menus/new?id=${id}`);
  }

  // Publish / Unpublish
  if (action === 'publish') {
    const id = params.id as string;
    const value = params.value as string;
    if (!id) redirect('/dashboard/menus');

    const menu = await queryFirst<{ id: string; user_id: string }>('SELECT id, user_id FROM menus WHERE id = ?', [id]);
    if (!menu || menu.user_id !== user.id) redirect('/dashboard/menus');

    await execute('UPDATE menus SET is_published = ?, updated_at = ? WHERE id = ?', [toInt(value === '1'), now(), id]);
    redirect(`/dashboard/menus/new?id=${id}`);
  }

  // Add category
  if (action === 'addcat') {
    const id = params.id as string;
    const name = (params.name as string || '').trim();
    if (!id || !name) redirect(`/dashboard/menus/new?id=${id}&error=Category+name+required`);

    const menu = await queryFirst<{ id: string; user_id: string }>('SELECT id, user_id FROM menus WHERE id = ?', [id]);
    if (!menu || menu.user_id !== user.id) redirect('/dashboard/menus');

    const description = (params.description as string || '').trim();
    const maxSort = await queryFirst<{ m: number }>('SELECT COALESCE(MAX(sort_order), -1) + 1 as m FROM menu_categories WHERE menu_id = ?', [id]);

    const catId = generateId();
    await execute(
      'INSERT INTO menu_categories (id, menu_id, name, description, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [catId, id, name, description, maxSort?.m || 0, now()]
    );

    redirect(`/dashboard/menus/new?id=${id}`);
  }

  // Add item (with dietary tags as comma-separated in query param)
  if (action === 'additem') {
    const id = params.id as string;
    const catId = params.catId as string;
    const name = (params.name as string || '').trim();
    if (!id || !catId || !name) redirect(`/dashboard/menus/new?id=${id}&error=Item+name+required`);

    const menu = await queryFirst<{ id: string; user_id: string }>('SELECT id, user_id FROM menus WHERE id = ?', [id]);
    if (!menu || menu.user_id !== user.id) redirect('/dashboard/menus');

    const description = (params.description as string || '').trim();
    const price = parseFloat(params.price as string) || 0;
    const image_url = (params.image_url as string || '').trim();
    const tagsRaw = params.tags;
    const tags = Array.isArray(tagsRaw) ? tagsRaw : (tagsRaw ? [tagsRaw] : []);

    const maxSort = await queryFirst<{ m: number }>('SELECT COALESCE(MAX(sort_order), -1) + 1 as m FROM menu_items WHERE category_id = ?', [catId]);

    const itemId = generateId();
    await execute(
      'INSERT INTO menu_items (id, category_id, name, description, price, image_url, dietary_tags, sort_order, is_available, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
      [itemId, catId, name, description, price, image_url, JSON.stringify(tags), maxSort?.m || 0, now(), now()]
    );

    redirect(`/dashboard/menus/new?id=${id}`);
  }

  // Delete category
  if (action === 'delcat') {
    const id = params.id as string;
    const catId = params.catId as string;
    if (!id || !catId) redirect('/dashboard/menus');

    const cat = await queryFirst<{ menu_id: string; user_id?: string }>(
      `SELECT c.menu_id, m.user_id FROM menu_categories c JOIN menus m ON c.menu_id = m.id WHERE c.id = ?`, [catId]
    );
    if (!cat || cat.user_id !== user.id) redirect(`/dashboard/menus/new?id=${id}`);

    await execute('DELETE FROM menu_categories WHERE id = ?', [catId]);
    redirect(`/dashboard/menus/new?id=${id}`);
  }

  // Delete item
  if (action === 'delitem') {
    const id = params.id as string;
    const itemId = params.itemId as string;
    if (!id || !itemId) redirect('/dashboard/menus');

    const item = await queryFirst<{ user_id?: string }>(
      `SELECT m.user_id FROM menu_items i
       JOIN menu_categories c ON i.category_id = c.id
       JOIN menus m ON c.menu_id = m.id WHERE i.id = ?`, [itemId]
    );
    if (!item || item.user_id !== user.id) redirect(`/dashboard/menus/new?id=${id}`);

    await execute('DELETE FROM menu_items WHERE id = ?', [itemId]);
    redirect(`/dashboard/menus/new?id=${id}`);
  }

  // ── Render Page ─────────────────────────────────────────

  const editId = params.id as string | undefined;
  const error = params.error ? decodeURIComponent(params.error as string) : null;

  let menu: MenuData | null = null;
  let categories: (CategoryData & { items: ItemData[] })[] = [];

  if (editId) {
    menu = await queryFirst<MenuData>('SELECT id, name, slug, theme, is_published FROM menus WHERE id = ? AND user_id = ?', [editId, user.id]);
    if (!menu) redirect('/dashboard/menus');

    const catRows = await queryAll<CategoryData>(
      'SELECT id, name, description, sort_order FROM menu_categories WHERE menu_id = ? ORDER BY sort_order ASC',
      [editId]
    );
    categories = await Promise.all(
      catRows.map(async (cat) => {
        const items = await queryAll<ItemData>(
          'SELECT id, name, description, price, image_url, dietary_tags, is_available, sort_order, category_id FROM menu_items WHERE category_id = ? ORDER BY sort_order ASC',
          [cat.id]
        );
        return { ...cat, items };
      })
    );
  }

  const title = editId ? `Edit: ${menu?.name || 'Menu'}` : 'New Menu';

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text" style={{ fontFamily: 'var(--font-heading), serif' }}>{title}</h1>
        <a href="/dashboard/menus" className="inline-flex self-start items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted hover:text-text hover:bg-cream transition-colors">← Back to Menus</a>
      </div>

      {error && <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {/* Menu Details Form */}
      <form method="GET" action="/dashboard/menus/new" className="bg-surface border border-border rounded-2xl p-4 sm:p-6 mb-6">
        <input type="hidden" name="action" value={editId ? 'update' : 'create'} />
        {editId && <input type="hidden" name="id" value={editId} />}
        <h2 className="text-lg font-semibold text-text mb-4" style={{ fontFamily: 'var(--font-heading), serif' }}>Menu Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text mb-1">Menu Name</label>
            <input id="name" name="name" type="text" defaultValue={menu?.name || ''} required placeholder="e.g. Dinner Menu"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm" />
          </div>
          {!editId && (
            <div>
              <label className="block text-sm font-medium text-text mb-1">Theme</label>
              <div className="flex flex-wrap gap-2">
                {THEMES.map(t => (
                  <label key={t} className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors capitalize cursor-pointer ${t === 'warm' ? 'bg-primary text-white border-primary' : 'bg-cream text-muted border-border hover:text-text hover:bg-white'}`}>
                    <input type="radio" name="theme" value={t} defaultChecked={t === 'warm'} className="hidden" />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        {!editId && (
          <button type="submit" className="mt-4 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm">
            Create Menu
          </button>
        )}
        {editId && (
          <button type="submit" className="mt-4 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm">
            Update Name
          </button>
        )}
      </form>

      {/* If editing, show categories & items */}
      {editId && menu && (
        <>
          {/* Publish toggle */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <form method="GET" action="/dashboard/menus/new" className="inline">
              <input type="hidden" name="id" value={editId} />
              <input type="hidden" name="action" value="publish" />
              <input type="hidden" name="value" value={menu.is_published ? '0' : '1'} />
              <button type="submit" className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors w-full sm:w-auto ${menu.is_published ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'}`}>
                {menu.is_published ? 'Unpublish Menu' : 'Publish Menu'}
              </button>
            </form>
            {isTrue(menu.is_published) && (
              <a href={`/menu/${menu.slug}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl border border-border text-sm text-muted hover:text-text hover:bg-cream transition-colors inline-block text-center sm:text-left">
                View Live Menu ↗
              </a>
            )}
          </div>

          {/* Categories Section */}
          <div className="space-y-4 mb-6">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-surface border border-border rounded-xl overflow-hidden">
                {/* Category header */}
                <div className="px-4 py-3 bg-cream border-b border-border flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-text truncate">{cat.name}</h3>
                    {cat.description && <p className="text-xs text-muted truncate">{cat.description}</p>}
                  </div>
                  <form method="GET" action="/dashboard/menus/new" className="shrink-0">
                    <input type="hidden" name="id" value={editId} />
                    <input type="hidden" name="action" value="delcat" />
                    <input type="hidden" name="catId" value={cat.id} />
                    <button type="submit" className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">Delete Category</button>
                  </form>
                </div>

                {/* Items list */}
                <div className="divide-y divide-border">
                  {cat.items.length === 0 && (
                    <div className="px-4 py-6 text-center text-muted text-xs">No items in this category.</div>
                  )}
                  {cat.items.map((item) => (
                    <div key={item.id} className="px-3 sm:px-4 py-3 flex items-start sm:items-center gap-2 sm:gap-4">
                      {item.image_url && (
                        <img src={item.image_url} alt="" className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-lg border border-border shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="font-medium text-text text-sm truncate">{item.name}</span>
                          {item.dietary_tags && item.dietary_tags !== '[]' && (
                            <span className="text-[10px] text-muted truncate">
                              {parseTags(item.dietary_tags).join(' · ')}
                            </span>
                          )}
                        </div>
                        {item.description && <p className="text-xs text-muted truncate">{item.description}</p>}
                      </div>
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-3 shrink-0">
                        {item.price > 0 && <span className="font-semibold text-text text-sm">${item.price.toFixed(2)}</span>}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isTrue(item.is_available) ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                          {item.is_available ? 'Avail' : 'Out'}
                        </span>
                        <form method="GET" action="/dashboard/menus/new">
                          <input type="hidden" name="id" value={editId} />
                          <input type="hidden" name="action" value="delitem" />
                          <input type="hidden" name="itemId" value={item.id} />
                          <button type="submit" className="text-[10px] px-2 py-0.5 rounded border border-red-200 text-red-500 hover:bg-red-50">✕</button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add item form */}
                <div className="px-3 sm:px-4 py-3 border-t border-dashed border-border bg-cream/50">
                  <form method="GET" action="/dashboard/menus/new" className="flex flex-col sm:flex-row gap-2">
                    <input type="hidden" name="id" value={editId} />
                    <input type="hidden" name="action" value="additem" />
                    <input type="hidden" name="catId" value={cat.id} />
                    <div className="flex flex-wrap gap-2 w-full">
                      <input type="text" name="name" placeholder="Item name" required
                        className="px-3 py-1.5 rounded-lg border border-border bg-white text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-[100px]" />
                      <input type="text" name="description" placeholder="Description"
                        className="px-3 py-1.5 rounded-lg border border-border bg-white text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-[100px]" />
                      <input type="number" step="0.01" min="0" name="price" placeholder="$0.00"
                        className="px-3 py-1.5 rounded-lg border border-border bg-white text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-20" />
                    </div>
                    <div className="flex flex-wrap gap-2 items-center w-full">
                      <input type="text" name="image_url" placeholder="Image URL"
                        className="px-3 py-1.5 rounded-lg border border-border bg-white text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-[80px]" />
                      <div className="flex flex-wrap gap-1">
                        {['Vegan', 'Vegetarian', 'Gluten-Free', 'Spicy'].map(tag => (
                          <label key={tag} className="text-[10px] cursor-pointer">
                            <input type="checkbox" name="tags" value={tag} className="hidden peer" />
                            <span className="px-2 py-0.5 rounded-full border border-border text-muted hover:text-text transition-colors peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary">{tag}</span>
                          </label>
                        ))}
                      </div>
                      <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors shrink-0 sm:ml-auto">+ Add</button>
                    </div>
                  </form>
                </div>
              </div>
            ))}
          </div>

          {/* Add Category Form */}
          <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-text mb-4" style={{ fontFamily: 'var(--font-heading), serif' }}>Add Category</h3>
            <form method="GET" action="/dashboard/menus/new" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input type="hidden" name="id" value={editId} />
              <input type="hidden" name="action" value="addcat" />
              <input type="text" name="name" placeholder="Category name (e.g. Appetizers)" required
                className="w-full sm:flex-1 px-4 py-2.5 rounded-xl border border-border bg-cream text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm" />
              <input type="text" name="description" placeholder="Description (optional)"
                className="w-full sm:flex-1 px-4 py-2.5 rounded-xl border border-border bg-cream text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm" />
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm shrink-0">
                Add Category
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function parseTags(tags: string): string[] {
  try { const p = JSON.parse(tags); return Array.isArray(p) ? p : []; } catch { return tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []; }
}
