import { queryFirst } from '@/lib/db';

export const PLAN_LIMITS = {
  free:       { menus: 1,        categoriesPerMenu: 3,        itemsTotal: 10 },
  starter:    { menus: 3,        categoriesPerMenu: Infinity, itemsTotal: Infinity },
  pro:        { menus: 10,       categoriesPerMenu: Infinity, itemsTotal: Infinity },
  enterprise: { menus: Infinity, categoriesPerMenu: Infinity, itemsTotal: Infinity },
} as const;

export interface LimitCheck {
  allowed: boolean;
  limit: number;
  current: number;
  resource: 'menus' | 'categories' | 'items';
}

function getLimits(plan: string) {
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
}

export async function checkMenuLimit(userId: string, plan: string): Promise<LimitCheck> {
  const { menus: limit } = getLimits(plan);
  if (limit === Infinity) return { allowed: true, limit: Infinity, current: 0, resource: 'menus' };
  const row = await queryFirst<{ n: number }>('SELECT COUNT(*) as n FROM menus WHERE user_id = ?', [userId]);
  const current = row?.n ?? 0;
  return { allowed: current < limit, limit, current, resource: 'menus' };
}

export async function checkCategoryLimit(menuId: string, plan: string): Promise<LimitCheck> {
  const { categoriesPerMenu: limit } = getLimits(plan);
  if (limit === Infinity) return { allowed: true, limit: Infinity, current: 0, resource: 'categories' };
  const row = await queryFirst<{ n: number }>('SELECT COUNT(*) as n FROM menu_categories WHERE menu_id = ?', [menuId]);
  const current = row?.n ?? 0;
  return { allowed: current < limit, limit, current, resource: 'categories' };
}

export async function checkItemLimit(userId: string, plan: string): Promise<LimitCheck> {
  const { itemsTotal: limit } = getLimits(plan);
  if (limit === Infinity) return { allowed: true, limit: Infinity, current: 0, resource: 'items' };
  const row = await queryFirst<{ n: number }>(
    `SELECT COUNT(*) as n FROM menu_items i
     JOIN menu_categories c ON i.category_id = c.id
     JOIN menus m ON c.menu_id = m.id
     WHERE m.user_id = ?`,
    [userId]
  );
  const current = row?.n ?? 0;
  return { allowed: current < limit, limit, current, resource: 'items' };
}
