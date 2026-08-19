import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error(
    'JWT_SECRET environment variable is not set. ' +
    'Set a strong random secret before deploying to production.'
  );
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tamil-deluxe-saloon-super-secret-jwt-key-90s-hits-DO-NOT-USE-IN-PROD'
);

const COOKIE_NAME = 'saloon_admin_session';

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
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
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
    .createHmac('sha256', JWT_SECRET)
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
