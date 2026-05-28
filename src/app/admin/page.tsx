'use client';

// Super Admin Dashboard — /admin
// Shows all restaurants and allows plan changes + delete

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Restaurant {
  id: string;
  email: string;
  restaurant_name: string;
  plan: string;
  is_admin: boolean;
  menu_count: number;
  created_at: string;
}

const PLANS = ['free', 'starter', 'pro', 'enterprise'];

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
  const [actionMsg, setActionMsg] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => { load(); }, [load]);

  async function upgradePlan(userId: string, plan: string) {
    setBusyId(userId);
    setActionMsg('');
    try {
      const res = await fetch(`/api/admin/users/${userId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.error) {
        setActionMsg(`Error: ${data.error}`);
      } else {
        setActionMsg(`Upgraded to ${plan} ✓`);
        load(); // refresh
      }
    } catch {
      setActionMsg('Failed to upgrade');
    }
    setBusyId('');
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Delete "${name || 'Unnamed'}"? This cannot be undone.`)) return;
    setBusyId(userId);
    setActionMsg('');
    try {
      const res = await fetch(`/api/admin/users/${userId}/delete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.error) {
        setActionMsg(`Error: ${data.error}`);
      } else {
        setActionMsg(`Deleted ✓`);
        load(); // refresh
      }
    } catch {
      setActionMsg('Failed to delete');
    }
    setBusyId('');
  }

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
          <h1 className="text-2xl font-serif text-stone-700 mb-2">Access Denied</h1>
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
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
          >
            ← My Dashboard
          </Link>
        </div>

        {/* Flash message */}
        {actionMsg && (
          <div className="mb-6 p-3 rounded-lg bg-stone-100 border border-stone-200 text-stone-700 text-sm">
            {actionMsg}
          </div>
        )}

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
              All Accounts
            </h2>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e7e0d8] text-left">
                  <th className="px-6 py-3 text-xs font-medium text-stone-400 uppercase">Restaurant</th>
                  <th className="px-6 py-3 text-xs font-medium text-stone-400 uppercase">Email</th>
                  <th className="px-6 py-3 text-xs font-medium text-stone-400 uppercase">Plan</th>
                  <th className="px-6 py-3 text-xs font-medium text-stone-400 uppercase">Menus</th>
                  <th className="px-6 py-3 text-xs font-medium text-stone-400 uppercase">Joined</th>
                  <th className="px-6 py-3 text-xs font-medium text-stone-400 uppercase">Role</th>
                  <th className="px-6 py-3 text-xs font-medium text-stone-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r) => (
                  <tr key={r.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-stone-700">
                      {r.restaurant_name || 'Unnamed'}
                    </td>
                    <td className="px-6 py-3 text-sm text-stone-500">{r.email}</td>
                    <td className="px-6 py-3">
                      <PlanBadge plan={r.plan} />
                    </td>
                    <td className="px-6 py-3 text-sm text-stone-500">{r.menu_count}</td>
                    <td className="px-6 py-3 text-sm text-stone-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      {r.is_admin ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Admin</span>
                      ) : (
                        <span className="text-xs text-stone-400">User</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Plan selector */}
                        <select
                          defaultValue=""
                          disabled={busyId === r.id}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) upgradePlan(r.id, val);
                            e.target.value = '';
                          }}
                          className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50"
                        >
                          <option value="" disabled>Upgrade</option>
                          {PLANS.filter(p => p !== r.plan).map(p => (
                            <option key={p} value={p}>
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </option>
                          ))}
                        </select>

                        {/* Delete button */}
                        {!r.is_admin && (
                          <button
                            onClick={() => deleteUser(r.id, r.restaurant_name)}
                            disabled={busyId === r.id}
                            className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-stone-100">
            {restaurants.map((r) => (
              <div key={r.id} className="px-6 py-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-stone-700">{r.restaurant_name || 'Unnamed'}</p>
                    <p className="text-sm text-stone-500">{r.email}</p>
                  </div>
                  <PlanBadge plan={r.plan} />
                </div>
                <div className="flex gap-4 text-xs text-stone-400">
                  <span>{r.menu_count} menus</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  {r.is_admin && <span className="text-amber-600 font-medium">Admin</span>}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    defaultValue=""
                    disabled={busyId === r.id}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) upgradePlan(r.id, val);
                      e.target.value = '';
                    }}
                    className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-600 flex-1 disabled:opacity-50"
                  >
                    <option value="" disabled>Upgrade</option>
                    {PLANS.filter(p => p !== r.plan).map(p => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                  {!r.is_admin && (
                    <button
                      onClick={() => deleteUser(r.id, r.restaurant_name)}
                      disabled={busyId === r.id}
                      className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {restaurants.length === 0 && (
            <div className="px-6 py-12 text-center text-stone-400">No accounts yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    stone: 'border-stone-200 text-stone-700',
    amber: 'border-amber-200 text-amber-700',
    emerald: 'border-emerald-200 text-emerald-700',
    purple: 'border-purple-200 text-purple-700',
  };
  return (
    <div className={`bg-white rounded-xl border p-4 text-center ${colors[color] || colors.stone}`}>
      <p className="text-3xl font-serif font-bold">{value}</p>
      <p className="text-xs uppercase tracking-wide mt-1 opacity-70">{label}</p>
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
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[plan] || styles.free}`}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
}
