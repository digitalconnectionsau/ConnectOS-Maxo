import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/users';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from session cookie
    const sessionCookie = request.cookies.get('crm-session');
    if (!sessionCookie?.value?.startsWith('user-')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(sessionCookie.value.replace('user-', ''));
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        last_login: user.last_login
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Failed to get user info' }, { status: 500 });
  }
}