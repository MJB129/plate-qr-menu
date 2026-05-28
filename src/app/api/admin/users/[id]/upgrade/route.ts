// POST /api/admin/users/[id]/upgrade — Change user's plan
import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';
import { isTrue } from '@/lib/db';

const VALID_PLANS = ['free', 'starter', 'pro', 'enterprise'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDBFromEnv();
    const { id } = await params;

    // Verify admin
    const admin = await getCurrentUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isTrue(admin.is_admin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse plan from body
    const body = await request.json();
    const plan = body.plan?.toLowerCase();

    if (!plan || !VALID_PLANS.includes(plan)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${VALID_PLANS.join(', ')}` },
        { status: 400 }
      );
    }

    // Update the user's plan
    const result = await execute(
      `UPDATE users SET plan = ?, updated_at = datetime('now') WHERE id = ? AND is_active = 1`,
      [plan, id]
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to update plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, plan });
  } catch (err) {
    console.error('Upgrade error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
