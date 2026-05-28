'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4 py-12">
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex flex-col items-center gap-2">
          <Image
            src="/plate-logo.jpg"
            alt="Plate by RomeDigital"
            width={64}
            height={64}
            className="rounded-xl"
            priority
          />
          <div>
            <h1
              className="text-2xl font-bold tracking-tight text-text"
              style={{ fontFamily: 'var(--font-heading), serif' }}
            >
              Plate
            </h1>
            <p className="text-muted text-xs mt-0.5">by RomeDigital</p>
          </div>
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-sm p-8">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-muted text-xs text-center">
        QR Menu Management for Restaurants
      </p>
    </div>
  );
}
