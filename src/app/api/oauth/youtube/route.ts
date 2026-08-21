import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import {
  createOAuthState,
  googleClientConfig,
  youtubeAuthUrl,
  OAUTH_STATE_COOKIE,
} from '@/lib/oauth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  const { configured } = googleClientConfig();
  if (!configured) {
    return NextResponse.redirect(
      new URL('/admin?importError=youtube-not-configured', request.url)
    );
  }

  const state = createOAuthState('youtube');
  const response = NextResponse.redirect(youtubeAuthUrl(request, state));
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });
  return response;
}
