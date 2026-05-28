// Public QR Menu Page — /menu/[slug]
// Renders a restaurant's published menu for customers scanning a QR code
// No auth required — this is the customer-facing page

import { initDBFromEnv } from '@/lib/env';
import { queryFirst, queryAll, isTrue } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface MenuData {
  id: string;
  name: string;
  theme: string;
  user_id: string;
}

interface CategoryData {
  id: string;
  name: string;
  description: string;
}

interface ItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  dietary_tags: string;
  is_available: number;
}

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await initDBFromEnv();

  // Find the published menu by slug
  const menu = await queryFirst<MenuData>(
    `SELECT id, name, theme, user_id FROM menus WHERE slug = ? AND is_published = 1`,
    [slug]
  );

  if (!menu) {
    return (
      <MenuShell>
        <div className="text-center py-20">
          <h1 className="text-2xl sm:text-3xl font-serif text-stone-400 mb-4">
            Menu Not Found
          </h1>
          <p className="text-stone-400">
            This menu doesn&apos;t exist or hasn&apos;t been published yet.
          </p>
        </div>
      </MenuShell>
    );
  }

  // Get categories with items
  const categories = await queryAll<CategoryData>(
    `SELECT id, name, description FROM menu_categories WHERE menu_id = ? ORDER BY sort_order ASC`,
    [menu.id]
  );

  const categoriesWithItems = await Promise.all(
    categories.map(async (cat) => {
      const items = await queryAll<ItemData>(
        `SELECT id, name, description, price, image_url, dietary_tags, is_available
         FROM menu_items
         WHERE category_id = ? AND is_available = 1
         ORDER BY sort_order ASC`,
        [cat.id]
      );
      return { ...cat, items };
    })
  );

  // Theme styles
  const themeStyles = getThemeStyles(menu.theme);

  return (
    <MenuShell>
      {/* Restaurant header */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className={`text-3xl sm:text-4xl font-serif font-bold ${themeStyles.heading}`}>
          {menu.name}
        </h1>
        <div className={`w-12 sm:w-16 h-0.5 mx-auto mt-3 sm:mt-4 ${themeStyles.accentBg}`} />
      </div>

      {/* Categories & Items */}
      <div className="space-y-8 sm:space-y-10">
        {categoriesWithItems.map((cat) => (
          <div key={cat.id}>
            <h2
              className={`text-lg sm:text-xl font-serif font-semibold mb-2 ${themeStyles.categoryHeading}`}
            >
              {cat.name}
            </h2>
            {cat.description && (
              <p className="text-sm text-stone-400 italic mb-3 sm:mb-4">
                {cat.description}
              </p>
            )}
            <div className="space-y-4">
              {cat.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start gap-3 py-3 border-b border-stone-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-stone-800 text-sm sm:text-base">
                      {item.name}
                      {item.dietary_tags && item.dietary_tags !== '[]' && (
                        <span className="ml-1.5 text-[10px] sm:text-xs text-stone-400">
                          {formatTags(item.dietary_tags)}
                        </span>
                      )}
                    </h3>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {item.price > 0 && (
                    <span
                      className={`font-serif text-base sm:text-lg font-semibold whitespace-nowrap ${themeStyles.price}`}
                    >
                      ${item.price.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-stone-200">
        <p className="text-xs text-stone-300">Powered by Plate — RomeDigital</p>
      </div>
    </MenuShell>
  );
}

// Theme styles by menu theme
function getThemeStyles(theme: string) {
  const themes: Record<
    string,
    {
      heading: string;
      categoryHeading: string;
      accentBg: string;
      price: string;
    }
  > = {
    warm: {
      heading: 'text-stone-800',
      categoryHeading: 'text-stone-700',
      accentBg: 'bg-amber-600',
      price: 'text-amber-700',
    },
    dark: {
      heading: 'text-stone-200',
      categoryHeading: 'text-stone-300',
      accentBg: 'bg-amber-500',
      price: 'text-amber-400',
    },
    light: {
      heading: 'text-stone-700',
      categoryHeading: 'text-stone-600',
      accentBg: 'bg-emerald-600',
      price: 'text-emerald-700',
    },
    modern: {
      heading: 'text-stone-900',
      categoryHeading: 'text-stone-800',
      accentBg: 'bg-stone-900',
      price: 'text-stone-900',
    },
  };
  return themes[theme] || themes.warm;
}

// Lightweight wrapper for the public menu page
function MenuShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        body { font-family: 'Inter', sans-serif; background: #fefdfb; color: #1c1917; line-height: 1.6; }
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>
      <div className="min-h-screen bg-[#fefdfb]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">{children}</div>
      </div>
    </>
  );
}

function formatTags(tagsJson: string): string {
  try {
    const tags = JSON.parse(tagsJson);
    if (Array.isArray(tags)) {
      return tags.map((t: string) => t.replace(/^\"(.*)\"$/, '$1')).join(' · ');
    }
  } catch {
    // ignore
  }
  return '';
}
