'use client';

import { createContext, useContext, useState } from 'react';
import Image from 'next/image';

interface SafeUser {
  id: string;
  email: string;
  restaurant_name: string;
  plan: string;
  is_admin: boolean;
  created_at: string;
}

const UserContext = createContext<SafeUser | null>(null);
export const useUser = () => useContext(UserContext);

export default function DashboardClient({
  user,
  children,
}: {
  user: SafeUser;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/menus', label: 'Menus' },
    { href: '/dashboard/settings', label: 'Settings' },
  ];

  if (user.is_admin) {
    navItems.push({ href: '/admin', label: 'Admin' });
  }

  const planLabel = user.plan === 'enterprise' ? 'Enterprise' :
    user.plan === 'pro' ? 'Pro' : 'Free';

  function closeSidebar() {
    setSidebarOpen(false);
  }

  const sidebarContent = (
    <>
      {/* Logo Area */}
      <div className="px-4 sm:px-5 py-4 sm:py-5 border-b border-border">
        <a href="/dashboard" className="flex items-center gap-3" onClick={closeSidebar}>
          <Image
            src="/plate-logo.jpg"
            alt="Plate"
            width={36}
            height={36}
            className="rounded-lg shrink-0"
          />
          <div className="min-w-0">
            <h2
              className="text-lg font-bold text-text leading-tight tracking-tight truncate"
              style={{ fontFamily: 'var(--font-heading), serif' }}
            >
              Plate
            </h2>
            <p className="text-[11px] text-muted truncate">{user.restaurant_name || 'by RomeDigital'}</p>
          </div>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={closeSidebar}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-muted hover:text-text hover:bg-cream"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* User Footer */}
      <div className="px-4 sm:px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-text truncate">
              {user.email}
            </p>
            <span className="inline-block text-[10px] uppercase tracking-wider text-muted bg-cream px-1.5 py-0.5 rounded">
              {planLabel}
            </span>
          </div>
        </div>
        <form method="POST" action="/api/auth/logout">
          <button
            type="submit"
            className="w-full mt-1 text-xs text-muted hover:text-primary transition-colors text-center py-1.5 rounded-lg hover:bg-cream"
          >
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <UserContext.Provider value={user}>
      <div className="min-h-screen flex bg-cream">
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar — desktop: always visible, mobile: sliding drawer */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-40
            w-64 bg-surface border-r border-border flex flex-col shrink-0
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {sidebarContent}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto min-w-0">
          {/* Mobile top bar */}
          <div className="sticky top-0 z-20 lg:hidden flex items-center gap-3 px-4 py-3 bg-surface/95 backdrop-blur border-b border-border">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-1 rounded-xl hover:bg-cream transition-colors text-muted"
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <Image
                src="/plate-logo.jpg"
                alt="Plate"
                width={28}
                height={28}
                className="rounded-md"
              />
              <span className="text-sm font-semibold text-text">Plate</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </UserContext.Provider>
  );
}
