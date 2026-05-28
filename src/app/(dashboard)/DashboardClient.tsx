'use client';

import { createContext, useContext } from 'react';
import Link from 'next/link';
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
  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/menus', label: 'Menus' },
    { href: '/dashboard/settings', label: 'Settings' },
  ];

  const planLabel = user.plan === 'enterprise' ? 'Enterprise' :
    user.plan === 'pro' ? 'Pro' : 'Free';

  return (
    <UserContext.Provider value={user}>
      <div className="min-h-screen flex bg-cream">
        {/* Sidebar */}
        <aside className="w-64 bg-surface border-r border-border flex flex-col shrink-0">
          {/* Logo Area */}
          <div className="px-5 py-5 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-3">
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
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-muted hover:text-text hover:bg-cream"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Footer */}
          <div className="px-5 py-4 border-t border-border">
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
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/auth';
              }}
              className="w-full mt-1 text-xs text-muted hover:text-primary transition-colors text-center py-1.5 rounded-lg hover:bg-cream"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </UserContext.Provider>
  );
}
