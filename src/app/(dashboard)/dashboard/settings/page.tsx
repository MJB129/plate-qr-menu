'use client';

import { useState } from 'react';
import { useUser } from '../../DashboardClient';

export default function SettingsPage() {
  const user = useUser();
  const [restaurantName, setRestaurantName] = useState(user?.restaurant_name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_name: restaurantName }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong.' });
    }
    setSaving(false);
  }

  const planLabel = user?.plan === 'enterprise' ? 'Enterprise' :
    user?.plan === 'pro' ? 'Pro' : user?.plan === 'starter' ? 'Starter' : 'Free';

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1
          className="text-2xl sm:text-3xl font-bold text-text"
          style={{ fontFamily: 'var(--font-heading), serif' }}
        >
          Settings
        </h1>
        <p className="text-muted text-sm mt-1">Manage your account and preferences.</p>
      </div>

      <div className="max-w-2xl space-y-6 sm:space-y-8">
        {/* Account Info */}
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6">
          <h2
            className="text-lg font-semibold text-text mb-4"
            style={{ fontFamily: 'var(--font-heading), serif' }}
          >
            Account Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Email</label>
              <p className="text-sm text-muted bg-cream px-4 py-2.5 rounded-xl border border-border">
                {user?.email || '—'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Plan</label>
              <p className="text-sm text-muted bg-cream px-4 py-2.5 rounded-xl border border-border flex items-center gap-2">
                {planLabel}
                <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  Active
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Member since</label>
              <p className="text-sm text-muted bg-cream px-4 py-2.5 rounded-xl border border-border">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                }) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6">
          <h2
            className="text-lg font-semibold text-text mb-4"
            style={{ fontFamily: 'var(--font-heading), serif' }}
          >
            Restaurant Details
          </h2>

          {message && (
            <div className={`mb-4 p-3 rounded-xl text-sm ${
              message.type === 'success'
                ? 'bg-secondary/10 text-secondary border border-secondary/20'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="restaurantName" className="block text-sm font-medium text-text mb-1">
                Restaurant Name
              </label>
              <input
                id="restaurantName"
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Your restaurant name"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-surface border border-red-200 rounded-2xl p-4 sm:p-6">
          <h2
            className="text-lg font-semibold text-text mb-2"
            style={{ fontFamily: 'var(--font-heading), serif' }}
          >
            Danger Zone
          </h2>
          <p className="text-sm text-muted mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            disabled
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-medium opacity-50 cursor-not-allowed"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
