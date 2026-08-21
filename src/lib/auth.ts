import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const DEV_JWT_FALLBACK =
  'tamil-deluxe-saloon-super-secret-jwt-key-90s-hits-DO-NOT-USE-IN-PROD';

const COOKIE_NAME = 'saloon_admin_session';

let warnedMissingJwtSecret = false;

/**
 * Resolve the JWT signing key lazily.
 * Must NOT throw at module import time: `next build` sets NODE_ENV=production
 * while collecting route config, and env vars may only exist at runtime (Vercel).
 *
 * When JWT_SECRET is unset we use a stable in-repo fallback so /admin login
 * still works on hosts that have not configured env vars yet (same zero-config
 * pattern as ADMIN_INITIAL_PASSWORD). Set JWT_SECRET in production.
 */
function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV === 'production' && !warnedMissingJwtSecret) {
    warnedMissingJwtSecret = true;
    console.warn(
      'JWT_SECRET is not set. Admin sessions are signed with an insecure fallback. ' +
        'Set a strong random JWT_SECRET in your hosting environment before treating this as production.'
    );
  }

  return new TextEncoder().encode(DEV_JWT_FALLBACK);
}

export interface AdminJwtPayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signAdminToken(adminId: string, username: string): Promise<string> {
  return new SignJWT({ sub: adminId, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecretKey());
}

export async function verifyAdminToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const verified = await jwtVerify(token, getJwtSecretKey());
    return verified.payload as unknown as AdminJwtPayload;
  } catch (error) {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminJwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Derives a stateless CSRF token from the raw session JWT using HMAC-SHA256.
 * The same token can be re-derived server-side for verification — no storage needed.
 */
export function deriveCsrfToken(sessionToken: string): string {
  return crypto
    .createHmac('sha256', getJwtSecretKey())
    .update(sessionToken)
    .digest('hex');
}

/**
 * Returns the raw session cookie value (for CSRF derivation).
 */
export async function getRawSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

/**
 * Verifies the X-Admin-CSRF-Token header against the session cookie.
 * Returns true only when the header matches the HMAC of the current cookie.
 */
export async function verifyCsrfToken(request: Request): Promise<boolean> {
  const headerStore = await headers();
  const clientToken = headerStore.get('x-admin-csrf-token');
  if (!clientToken) return false;

  const rawSession = await getRawSessionToken();
  if (!rawSession) return false;

  const expected = deriveCsrfToken(rawSession);
  return crypto.timingSafeEqual(
    Buffer.from(clientToken, 'hex'),
    Buffer.from(expected, 'hex')
  );
}

/**
 * Require both a valid admin session AND a valid CSRF token.
 * Returns the session payload on success, or null if either check fails.
 */
export async function requireAdminWithCsrf(
  request: Request
): Promise<AdminJwtPayload | null> {
  const session = await getAdminSession();
  if (!session) return null;

  const csrfOk = await verifyCsrfToken(request);
  if (!csrfOk) return null;

  return session;
}

/**
 * Returns a 415 response when the request Content-Type is not application/json.
 * Use at the top of every POST/PUT route handler.
 */
export function requireJsonContentType(request: Request): Response | null {
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return new Response(
      JSON.stringify({ error: 'Content-Type must be application/json' }),
      { status: 415, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
}
