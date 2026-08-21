import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  attachTokenCookie,
  exchangeSpotifyCode,
  OAUTH_STATE_COOKIE,
  parseOAuthState,
  SPOTIFY_COOKIE,
  SPOTIFY_PKCE_COOKIE,
} from '@/lib/oauth';
import { getAppBaseUrl } from '@/lib/app-url';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');
  const base = getAppBaseUrl(request);
  const store = await cookies();
  const verifier = store.get(SPOTIFY_PKCE_COOKIE)?.value || '';

  const fail = (reason: string) => {
    const res = NextResponse.redirect(`${base}/admin?importError=${encodeURIComponent(reason)}`);
    res.cookies.set(OAUTH_STATE_COOKIE, '', { path: '/', maxAge: 0 });
    res.cookies.set(SPOTIFY_PKCE_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  };

  if (oauthError) return fail(oauthError);
  if (!code) return fail('missing-spotify-code');
  if (!verifier) return fail('missing-spotify-pkce');

  const parsed = parseOAuthState(state);
  if (!parsed || parsed.provider !== 'spotify') return fail('invalid-spotify-state');

  try {
    const tokens = await exchangeSpotifyCode(request, code, verifier);
    const res = NextResponse.redirect(`${base}/admin?import=spotify-connected`);
    attachTokenCookie(res, SPOTIFY_COOKIE, tokens);
    res.cookies.set(OAUTH_STATE_COOKIE, '', { path: '/', maxAge: 0 });
    res.cookies.set(SPOTIFY_PKCE_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'spotify-oauth-failed');
  }
}
