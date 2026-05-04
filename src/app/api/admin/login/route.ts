import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword } from '@/lib/admin-settings';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (typeof password !== 'string' || password.length === 0) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const isValid = await verifyAdminPassword(password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin login failed:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
