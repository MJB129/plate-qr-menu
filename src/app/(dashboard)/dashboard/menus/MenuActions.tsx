'use client';

// Minimal client component for menu actions (delete, publish/unpublish)
// Only the interactive buttons — not the whole page

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MenuItem {
  id: string;
  name: string;
  slug: string;
  is_published: number;
  theme: string;
  created_at: string;
}

export default function MenuActions({ menu }: { menu: MenuItem }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function togglePublish() {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/menus/${menu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: menu.is_published ? 0 : 1 }),
      });
      const data = await res.json();
      if (data.error) setMsg(data.error);
      else router.refresh();
    } catch {
      setMsg('Failed');
    }
    setBusy(false);
  }

  async function deleteMenu() {
    if (!confirm(`Delete "${menu.name}"? This removes all categories and items.`)) return;
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/menus/${menu.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) setMsg(data.error);
      else router.refresh();
    } catch {
      setMsg('Failed');
    }
    setBusy(false);
  }

  return (
    <div className="px-4 sm:px-5 pb-4 sm:pb-5">
      {msg && <p className="text-xs text-red-500 mb-2">{msg}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={`/dashboard/menus/new?id=${menu.id}`}
          className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
        >
          Edit
        </a>
        <button
          onClick={togglePublish}
          disabled={busy}
          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${
            menu.is_published
              ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          {menu.is_published ? 'Unpublish' : 'Publish'}
        </button>
        {!!menu.is_published && (
          <a
            href={`/menu/${menu.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted hover:text-text hover:bg-cream transition-colors"
          >
            View
          </a>
        )}
        <button
          onClick={deleteMenu}
          disabled={busy}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors sm:ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
