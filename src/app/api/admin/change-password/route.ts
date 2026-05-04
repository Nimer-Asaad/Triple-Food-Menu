import { NextRequest, NextResponse } from 'next/server';
import { changeAdminPassword } from '@/lib/admin-settings';

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await changeAdminPassword(currentPassword, newPassword);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin change password failed:', error);

    if (error instanceof Error && error.message === 'Current password is incorrect') {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
