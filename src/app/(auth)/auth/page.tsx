import Link from 'next/link';

// Server-rendered login page — works without JavaScript hydration
// Uses native <form> POST to /api/auth/login
// The API validates credentials and returns HTML that sets cookie + redirects

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : null;

  return (
    <>
      <h2
        className="text-2xl font-bold text-text mb-2"
        style={{ fontFamily: 'var(--font-heading), serif' }}
      >
        Welcome back
      </h2>
      <p className="text-muted text-sm mb-6">
        Sign in to manage your digital menus.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form method="POST" action="/api/auth/login" className="space-y-4">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text mb-1"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@restaurant.com"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm"
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text mb-1"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Enter your password"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
        >
          Sign In
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="text-primary hover:text-primary-hover font-medium transition-colors"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
