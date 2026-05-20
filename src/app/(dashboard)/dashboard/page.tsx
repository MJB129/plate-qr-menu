'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardStats {
  menusCreated: number;
  liveMenus: number;
  totalItems: number;
}

interface SafeUser {
  restaurant_name: string;
}

export default function DashboardOverview() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    menusCreated: 0,
    liveMenus: 0,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }

        // Placeholder stats (API not yet built)
        // TODO: Replace with real GET /api/menus once available
        setStats({
          menusCreated: 0,
          liveMenus: 0,
          totalItems: 0,
        });
      } catch {
        // Silently fail — layout redirects if unauthenticated
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasMenus = stats.menusCreated > 0;

  return (
    <div className="max-w-4xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-text"
          style={{ fontFamily: 'var(--font-heading), serif' }}
        >
          Welcome{user ? `, ${user.restaurant_name}` : ''}
        </h1>
        <p className="text-muted text-sm mt-1">
          Manage your digital QR menus from one place.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Menus Created"
          value={stats.menusCreated}
          icon={MenuIcon}
        />
        <StatCard
          label="Live Menus"
          value={stats.liveMenus}
          icon={LiveIcon}
        />
        <StatCard
          label="Total Items"
          value={stats.totalItems}
          icon={ItemsIcon}
        />
      </div>

      {/* Empty state or quick actions */}
      {!hasMenus ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cream flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c4943c"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h3
            className="text-lg font-semibold text-text mb-2"
            style={{ fontFamily: 'var(--font-heading), serif' }}
          >
            No menus yet
          </h3>
          <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
            Create your first digital menu and generate a QR code for your
            guests to scan at the table.
          </p>
          <Link
            href="/dashboard/menus/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            <PlusIcon />
            Create Your First Menu
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-lg font-semibold text-text"
              style={{ fontFamily: 'var(--font-heading), serif' }}
            >
              Quick Actions
            </h3>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/menus/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              <PlusIcon />
              New Menu
            </Link>
            <Link
              href="/dashboard/menus"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-text text-sm font-medium hover:bg-cream transition-colors"
            >
              View All Menus
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat card component
function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon />
      </div>
      <div>
        <p className="text-2xl font-bold text-text">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}

// Icons
function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#d45d3a"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function LiveIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2d5a27"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ItemsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#c4943c"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
