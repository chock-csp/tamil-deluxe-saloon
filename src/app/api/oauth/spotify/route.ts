import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import {
  createOAuthState,
  createPkcePair,
  OAUTH_STATE_COOKIE,
  SPOTIFY_PKCE_COOKIE,
  spotifyAuthUrl,
  spotifyClientConfig,
} from '@/lib/oauth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  const { configured } = spotifyClientConfig();
  if (!configured) {
    return NextResponse.redirect(
      new URL('/admin?importError=spotify-not-configured', request.url)
    );
  }

  const state = createOAuthState('spotify');
  const pkce = createPkcePair();
  const response = NextResponse.redirect(spotifyAuthUrl(request, state, pkce.challenge));
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 10,
  };
  response.cookies.set(OAUTH_STATE_COOKIE, state, cookieOpts);
  response.cookies.set(SPOTIFY_PKCE_COOKIE, pkce.verifier, cookieOpts);
  return response;
}
