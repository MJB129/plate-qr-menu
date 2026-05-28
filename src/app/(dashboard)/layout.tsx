import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { initDBFromEnv } from '@/lib/env';
import { getSessionUser, safeUser, type SafeUser } from '@/lib/auth';
import DashboardClient from './DashboardClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check — read cookie, query D1
  let user: SafeUser | null = null;

  try {
    await initDBFromEnv();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('plate_session')?.value;

    if (sessionToken) {
      const u = await getSessionUser(sessionToken);
      if (u) user = safeUser(u);
    }
  } catch (err) {
    console.error('DashboardLayout auth error:', err);
  }

  // No authenticated user → redirect to login
  if (!user) {
    redirect('/auth');
  }

  // Authenticated — render full dashboard shell
  return (
    <DashboardClient user={user}>{children}</DashboardClient>
  );
}
