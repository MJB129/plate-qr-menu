'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SafeUser {
  id: string;
  email: string;
  restaurant_name: string;
  plan: string;
  is_admin: boolean;
  created_at: string;
}

// Context so child pages don't re-fetch auth
const UserContext = createContext<SafeUser | null>(null);
export const useUser = () => useContext(UserContext);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          window.location.href = '/auth';
          return;
        }
        const data = await res.json();
        if (!cancelled) setUser(data.user);
      } catch {
        window.location.href = '/auth';
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    checkAuth();
    return () => { cancelled = true; };
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { href: '/dashboard/menus', label: 'Menus', icon: MenuIcon },
    { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <UserContext.Provider value={user}>
      <div className="min-h-screen flex bg-cream">
        {/* Sidebar */}
        <aside className="w-64 bg-surface border-r border-border flex flex-col shrink-0">
          {/* Brand */}
          <div className="px-6 py-5 border-b border-border">
            <Link href="/dashboard" className="inline-block">
              <h2
                className="text-xl font-bold text-text tracking-tight"
                style={{ fontFamily: 'var(--font-heading), serif' }}
              >
                Plate
              </h2>
            </Link>
            <p className="text-xs text-muted mt-0.5 truncate">
              {user.restaurant_name}
            </p>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-text hover:bg-cream'
                  }`}
                >
                  <item.icon active={isActive} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="px-6 py-4 border-t border-border">
            <p className="text-xs text-muted truncate">{user.email}</p>
            <button
              onClick={handleLogout}
              className="mt-2 text-xs text-muted hover:text-primary transition-colors"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </UserContext.Provider>
  );
}

// Simple SVG icon components
function HomeIcon({ active }: { active: boolean }) {
  const color = active ? '#d45d3a' : '#78716c';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function MenuIcon({ active }: { active: boolean }) {
  const color = active ? '#d45d3a' : '#78716c';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  const color = active ? '#d45d3a' : '#78716c';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
