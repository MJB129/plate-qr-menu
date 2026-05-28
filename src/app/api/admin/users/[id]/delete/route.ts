// POST /api/admin/users/[id]/delete — Soft-delete a user
import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { initDBFromEnv } from '@/lib/env';
import { isTrue } from '@/lib/db';

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

    // Don't allow deleting yourself
    if (admin.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Soft delete — set is_active = 0
    const result = await execute(
      `UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = ? AND is_active = 1`,
      [id]
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
