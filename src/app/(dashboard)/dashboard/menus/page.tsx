import { initDBFromEnv } from '@/lib/env';
import { queryAll, isTrue } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { checkMenuLimit } from '@/lib/plan-limits';
import MenuActions from './MenuActions';

interface MenuRow {
  id: string;
  name: string;
  slug: string;
  is_published: number;
  theme: string;
  created_at: string;
}

export default async function MenusPage() {
  await initDBFromEnv();
  const user = await getCurrentUser();
  if (!user) redirect('/auth');

  const menus = await queryAll<MenuRow>(
    `SELECT id, name, slug, is_published, theme, created_at
     FROM menus WHERE user_id = ? ORDER BY created_at DESC`,
    [user.id]
  );

  const menuLimitCheck = await checkMenuLimit(user.id, user.plan);
  const atMenuLimit = !menuLimitCheck.allowed;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-text"
            style={{ fontFamily: 'var(--font-heading), serif' }}
          >
            Menus
          </h1>
          <p className="text-muted text-sm mt-0.5 sm:mt-1">Manage your digital menus.</p>
        </div>
        {atMenuLimit ? (
          <div className="flex flex-col items-start sm:items-end gap-1">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-sm text-stone-500 cursor-not-allowed select-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Menu
            </div>
            <p className="text-xs text-muted">
              {user.plan === 'free'
                ? `Free plan: ${menuLimitCheck.current}/${menuLimitCheck.limit} menu used. Upgrade to add more.`
                : `Plan limit reached (${menuLimitCheck.current}/${menuLimitCheck.limit} menus).`}
            </p>
          </div>
        ) : (
          <a
            href="/dashboard/menus/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm self-start"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Menu
          </a>
        )}
      </div>

      {/* Empty state */}
      {menus.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 rounded-full bg-primary/5 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d45d3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-text mb-2" style={{ fontFamily: 'var(--font-heading), serif' }}>
            No menus yet
          </h3>
          <p className="text-muted text-sm mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed px-2">
            Create your first digital menu and generate a QR code for your guests.
          </p>
          <a
            href="/dashboard/menus/new"
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Your First Menu
          </a>
        </div>
      ) : (
        /* Menu Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {menus.map((menu) => (
            <div
              key={menu.id}
              className="bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-sm transition-shadow"
            >
              <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-base sm:text-lg font-semibold text-text truncate"
                      style={{ fontFamily: 'var(--font-heading), serif' }}
                    >
                      {menu.name}
                    </h3>
                    <p className="text-xs text-muted mt-0.5 font-mono truncate">/{menu.slug}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                    {isTrue(menu.is_published) ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">Live</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 font-medium">Draft</span>
                    )}
                    <ThemeBadge theme={menu.theme} />
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-5 pb-3 text-xs text-muted">
                Created {new Date(menu.created_at).toLocaleDateString()}
              </div>

              <MenuActions menu={menu} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ThemeBadge({ theme }: { theme: string }) {
  const colors: Record<string, string> = {
    warm: 'bg-amber-50 text-amber-700',
    dark: 'bg-stone-800 text-stone-200',
    light: 'bg-emerald-50 text-emerald-700',
    modern: 'bg-stone-100 text-stone-700',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors[theme] || colors.warm}`}>
      {theme.charAt(0).toUpperCase() + theme.slice(1)}
    </span>
  );
}
