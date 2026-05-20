'use client';

import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4 py-12">
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block">
          <h1
            className="text-3xl font-bold tracking-tight text-text"
            style={{ fontFamily: 'var(--font-heading), serif' }}
          >
            Plate
          </h1>
          <p className="text-muted text-sm mt-1">by RomeDigital</p>
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-sm p-8">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-muted text-xs text-center">
        QR Menu Management for Restaurants
      </p>
    </div>
  );
}
