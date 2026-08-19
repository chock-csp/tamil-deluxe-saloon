import { NextResponse } from 'next/server';
import { getAdminSession, getRawSessionToken, deriveCsrfToken } from '@/lib/auth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const rawToken = await getRawSessionToken();
  const csrfToken = rawToken ? deriveCsrfToken(rawToken) : null;

  return NextResponse.json({
    authenticated: true,
    user: { id: session.sub, username: session.username },
    csrfToken,
  });
}
