import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decryptJson, encryptJson } from '@/lib/oauth-crypto';
import { getAppBaseUrl } from '@/lib/app-url';
import { getSpotifyProfile } from '@/lib/spotify-playlist';

export const YOUTUBE_COOKIE = 'saloon_yt_oauth';
export const SPOTIFY_COOKIE = 'saloon_sp_oauth';
export const OAUTH_STATE_COOKIE = 'saloon_oauth_state';
export const SPOTIFY_PKCE_COOKIE = 'saloon_spotify_pkce';

export interface OAuthTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  displayName?: string;
}

export interface OAuthStatePayload {
  provider: 'youtube' | 'spotify';
  nonce: string;
}

const YOUTUBE_SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'].join(' ');
const SPOTIFY_SCOPES = ['playlist-modify-public', 'user-read-private'].join(' ');

function cookieBase() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

export function googleClientConfig() {
  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || '').trim();
  const clientSecret = (
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.YOUTUBE_CLIENT_SECRET ||
    ''
  ).trim();
  return { clientId, clientSecret, configured: Boolean(clientId && clientSecret) };
}

export function spotifyClientConfig() {
  const clientId = (process.env.SPOTIFY_CLIENT_ID || '').trim();
  const clientSecret = (process.env.SPOTIFY_CLIENT_SECRET || '').trim();
  return { clientId, clientSecret, configured: Boolean(clientId && clientSecret) };
}

export function youtubeCallbackUrl(request: Request) {
  return `${getAppBaseUrl(request)}/api/oauth/youtube/callback`;
}

export function spotifyCallbackUrl(request: Request) {
  return `${getAppBaseUrl(request)}/api/oauth/spotify/callback`;
}

export async function readTokenCookie(name: string): Promise<OAuthTokenSet | null> {
  const store = await cookies();
  const raw = store.get(name)?.value;
  if (!raw) return null;
  const parsed = decryptJson<OAuthTokenSet>(raw);
  if (!parsed?.accessToken) return null;
  return parsed;
}

export function attachTokenCookie(
  response: NextResponse,
  name: string,
  tokens: OAuthTokenSet | null
) {
  if (!tokens) {
    response.cookies.set(name, '', { ...cookieBase(), maxAge: 0 });
    return;
  }
  response.cookies.set(name, encryptJson(tokens), {
    ...cookieBase(),
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function writeTokenCookie(name: string, tokens: OAuthTokenSet | null) {
  const store = await cookies();
  if (!tokens) {
    store.set(name, '', { ...cookieBase(), maxAge: 0 });
    return;
  }
  store.set(name, encryptJson(tokens), {
    ...cookieBase(),
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function createOAuthState(provider: 'youtube' | 'spotify') {
  const payload: OAuthStatePayload = {
    provider,
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  return encryptJson(payload);
}

export function parseOAuthState(state: string | null): OAuthStatePayload | null {
  if (!state) return null;
  const parsed = decryptJson<OAuthStatePayload>(state);
  if (!parsed?.provider || !parsed.nonce) return null;
  return parsed;
}

export function createPkcePair() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function youtubeAuthUrl(request: Request, state: string) {
  const { clientId } = googleClientConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: youtubeCallbackUrl(request),
    response_type: 'code',
    scope: YOUTUBE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function spotifyAuthUrl(
  request: Request,
  state: string,
  codeChallenge: string
) {
  const { clientId } = spotifyClientConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: spotifyCallbackUrl(request),
    scope: SPOTIFY_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeGoogleCode(request: Request, code: string): Promise<OAuthTokenSet> {
  const { clientId, clientSecret } = googleClientConfig();
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: youtubeCallbackUrl(request),
      grant_type: 'authorization_code',
    }),
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || 'Google token exchange failed');
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + (json.expires_in || 3600) * 1000,
  };
}

export async function refreshGoogleToken(tokens: OAuthTokenSet): Promise<OAuthTokenSet> {
  if (!tokens.refreshToken) return tokens;
  const { clientId, clientSecret } = googleClientConfig();
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: tokens.refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
  };
  if (!res.ok || !json.access_token) return tokens;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token || tokens.refreshToken,
    expiresAt: Date.now() + (json.expires_in || 3600) * 1000,
    displayName: tokens.displayName,
  };
}

export async function exchangeSpotifyCode(
  request: Request,
  code: string,
  codeVerifier: string
): Promise<OAuthTokenSet> {
  const { clientId, clientSecret } = spotifyClientConfig();
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: spotifyCallbackUrl(request),
      client_id: clientId,
      code_verifier: codeVerifier,
    }),
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || 'Spotify token exchange failed');
  }

  const tokens: OAuthTokenSet = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + (json.expires_in || 3600) * 1000,
  };

  try {
    const profile = await getSpotifyProfile(tokens.accessToken);
    tokens.displayName = profile.displayName;
  } catch {
    // Profile lookup is optional at connect time.
  }

  return tokens;
}

export async function refreshSpotifyToken(tokens: OAuthTokenSet): Promise<OAuthTokenSet> {
  if (!tokens.refreshToken) return tokens;
  const { clientId, clientSecret } = spotifyClientConfig();
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
      client_id: clientId,
    }),
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!res.ok || !json.access_token) return tokens;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token || tokens.refreshToken,
    expiresAt: Date.now() + (json.expires_in || 3600) * 1000,
    displayName: tokens.displayName,
  };
}

export async function getFreshYoutubeTokens(): Promise<OAuthTokenSet | null> {
  const current = await readTokenCookie(YOUTUBE_COOKIE);
  if (!current) return null;
  if (current.expiresAt > Date.now() + 60_000) return current;
  const refreshed = await refreshGoogleToken(current);
  await writeTokenCookie(YOUTUBE_COOKIE, refreshed);
  return refreshed;
}

export async function getFreshSpotifyTokens(): Promise<OAuthTokenSet | null> {
  const current = await readTokenCookie(SPOTIFY_COOKIE);
  if (!current) return null;
  if (current.expiresAt > Date.now() + 60_000) return current;
  const refreshed = await refreshSpotifyToken(current);
  await writeTokenCookie(SPOTIFY_COOKIE, refreshed);
  return refreshed;
}

export async function fetchGoogleDisplayName(accessToken: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      }
    );
    if (!res.ok) return undefined;
    const json = (await res.json()) as { items?: { snippet?: { title?: string } }[] };
    return json.items?.[0]?.snippet?.title;
  } catch {
    return undefined;
  }
}
