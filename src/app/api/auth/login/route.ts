import { NextResponse } from 'next/server';
import { signAdminToken, setAdminSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const expectedAdmin = process.env.ADMIN_USERNAME || 'admin';
    const expectedPassword = process.env.ADMIN_INITIAL_PASSWORD || 'saloon123';

    if (username !== expectedAdmin || password !== expectedPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await signAdminToken('admin-user-id', expectedAdmin);
    await setAdminSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: 'admin-user-id', username: expectedAdmin },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
