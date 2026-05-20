'use client';

// Super Admin Dashboard — /admin
// Only accessible to is_admin = true users
// Shows all restaurants, stats, and allows impersonation

import { useEffect, useState } from 'react';

interface Restaurant {
  id: string;
  email: string;
  restaurant_name: string;
  plan: string;
  is_admin: boolean;
  menu_count: number;
  created_at: string;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    starter: 0,
    pro: 0,
    enterprise: 0,
    free: 0,
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.status === 403 || res.status === 401) {
          setError('Access denied — admin only');
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setRestaurants(data.restaurants || []);
          setStats(data.stats || {});
          setIsAdmin(true);
        }
      } catch {
        setError('Failed to load admin data');
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-stone-700 mb-2">
            Access Denied
          </h1>
          <p className="text-stone-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-serif font-bold text-stone-800">
              Super Admin
            </h1>
            <p className="text-stone-500 mt-1">Plate by RomeDigital</p>
          </div>
          <a
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
          >
            ← My Dashboard
          </a>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <StatCard label="Total" value={stats.total} color="stone" />
          <StatCard label="Free" value={stats.free} color="stone" />
          <StatCard label="Starter" value={stats.starter} color="amber" />
          <StatCard label="Pro" value={stats.pro} color="emerald" />
          <StatCard label="Enterprise" value={stats.enterprise} color="purple" />
        </div>

        {/* Restaurants Table */}
        <div className="bg-white rounded-2xl border border-[#e7e0d8] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e7e0d8]">
            <h2 className="text-lg font-serif font-semibold text-stone-700">
              All Restaurants
            </h2>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e7e0d8] text-left">
                  <th className="px-6 py-3 text-xs font-medium text-stone-400 uppercase">
                    Restaurant
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-stone-400 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-stone-400 uppercase">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-stone-400 uppercase">
                    Menus
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-stone-400 uppercase">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-stone-400 uppercase">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-stone-700">
                      {r.restaurant_name || 'Unnamed'}
                    </td>
                    <td className="px-6 py-3 text-sm text-stone-500">
                      {r.email}
                    </td>
                    <td className="px-6 py-3">
                      <PlanBadge plan={r.plan} />
                    </td>
                    <td className="px-6 py-3 text-sm text-stone-500">
                      {r.menu_count}
                    </td>
                    <td className="px-6 py-3 text-sm text-stone-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      {r.is_admin ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                          Admin
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">User</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-stone-100">
            {restaurants.map((r) => (
              <div key={r.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-stone-700">
                      {r.restaurant_name || 'Unnamed'}
                    </p>
                    <p className="text-sm text-stone-500">{r.email}</p>
                  </div>
                  <PlanBadge plan={r.plan} />
                </div>
                <div className="flex gap-4 mt-2 text-xs text-stone-400">
                  <span>{r.menu_count} menus</span>
                  <span>
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                  {r.is_admin && (
                    <span className="text-amber-600 font-medium">Admin</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {restaurants.length === 0 && (
            <div className="px-6 py-12 text-center text-stone-400">
              No restaurants yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    stone: 'border-stone-200 text-stone-700',
    amber: 'border-amber-200 text-amber-700',
    emerald: 'border-emerald-200 text-emerald-700',
    purple: 'border-purple-200 text-purple-700',
  };

  return (
    <div
      className={`bg-white rounded-xl border p-4 text-center ${colors[color] || colors.stone}`}
    >
      <p className="text-3xl font-serif font-bold">{value}</p>
      <p className="text-xs uppercase tracking-wide mt-1 opacity-70">
        {label}
      </p>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    free: 'bg-stone-100 text-stone-600',
    starter: 'bg-amber-50 text-amber-700',
    pro: 'bg-emerald-50 text-emerald-700',
    enterprise: 'bg-purple-50 text-purple-700',
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[plan] || styles.free}`}
    >
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
}
