import { NextResponse } from 'next/server';
import {
  attachTokenCookie,
  exchangeGoogleCode,
  fetchGoogleDisplayName,
  OAUTH_STATE_COOKIE,
  parseOAuthState,
  YOUTUBE_COOKIE,
} from '@/lib/oauth';
import { getAppBaseUrl } from '@/lib/app-url';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');
  const base = getAppBaseUrl(request);

  const fail = (reason: string) => {
    const res = NextResponse.redirect(`${base}/admin?importError=${encodeURIComponent(reason)}`);
    res.cookies.set(OAUTH_STATE_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  };

  if (oauthError) return fail(oauthError);
  if (!code) return fail('missing-youtube-code');

  const parsed = parseOAuthState(state);
  if (!parsed || parsed.provider !== 'youtube') return fail('invalid-youtube-state');

  try {
    const tokens = await exchangeGoogleCode(request, code);
    tokens.displayName = await fetchGoogleDisplayName(tokens.accessToken);
    const res = NextResponse.redirect(`${base}/admin?import=youtube-connected`);
    attachTokenCookie(res, YOUTUBE_COOKIE, tokens);
    res.cookies.set(OAUTH_STATE_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'youtube-oauth-failed');
  }
}
