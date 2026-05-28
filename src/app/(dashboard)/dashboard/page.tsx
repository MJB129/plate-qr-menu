'use client';

import Link from 'next/link';
import { useUser } from '../DashboardClient';

interface DashboardStats {
  menusCreated: number;
  liveMenus: number;
  totalItems: number;
}

export default function DashboardOverview() {
  const user = useUser();
  const stats: DashboardStats = {
    menusCreated: 0,
    liveMenus: 0,
    totalItems: 0,
  };

  const hasMenus = stats.menusCreated > 0;

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-10">
        <h1
          className="text-3xl font-bold text-text"
          style={{ fontFamily: 'var(--font-heading), serif' }}
        >
          {user ? `Welcome, ${user.restaurant_name || 'there'} 👋` : 'Welcome'}
        </h1>
        <p className="text-muted text-sm mt-1.5">
          Here&apos;s what&apos;s happening with your digital menus today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <div className="bg-surface border border-border rounded-2xl p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d45d3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-text">{stats.menusCreated}</p>
          <p className="text-sm text-muted mt-0.5">Menus Created</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d5a27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-text">{stats.liveMenus}</p>
          <p className="text-sm text-muted mt-0.5">Live Menus</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c4943c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-text">{stats.totalItems}</p>
          <p className="text-sm text-muted mt-0.5">Total Items</p>
        </div>
      </div>

      {/* Empty State or Quick Actions */}
      {!hasMenus ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-primary/5 flex items-center justify-center">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d45d3a"
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
            className="text-xl font-semibold text-text mb-2"
            style={{ fontFamily: 'var(--font-heading), serif' }}
          >
            No menus yet
          </h3>
          <p className="text-muted text-sm mb-8 max-w-md mx-auto leading-relaxed">
            Create your first digital menu and generate a QR code for your
            guests to scan at the table. It only takes a few minutes.
          </p>
          <Link
            href="/dashboard/menus/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm hover:shadow-md"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Your First Menu
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Menu
            </Link>
            <Link
              href="/dashboard/menus"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-text text-sm font-medium hover:bg-cream transition-colors"
            >
              View All Menus
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
