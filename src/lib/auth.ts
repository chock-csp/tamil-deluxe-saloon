import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const COOKIE_NAME = 'saloon_admin_session';
const MIN_JWT_SECRET_LENGTH = 16;

/**
 * Secrets that were previously hardcoded in this repository. Anyone with GitHub
 * access already knows them, so they must never be accepted as production values.
 */
const REJECTED_PASSWORDS = new Set([
  'saloon123',
  'admin',
  'admin123',
  'password',
]);

const REJECTED_JWT_SECRETS = new Set([
  'tamil-deluxe-saloon-super-secret-jwt-key-90s-hits-DO-NOT-USE-IN-PROD',
  'tamil-deluxe-saloon-super-secret-jwt-key-90s-hits',
  'replace-with-a-secure-random-secret-key',
]);

let warnedMissingJwtSecret = false;
let warnedInsecureJwtSecret = false;
let warnedMissingAdminPassword = false;
let warnedRejectedAdminPassword = false;

export class AuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthConfigurationError';
  }
}

/**
 * Timing-safe string compare via SHA-256 so unequal lengths cannot leak.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(a, 'utf8').digest();
  const digestB = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? '';
}

/**
 * Resolve the JWT signing key lazily.
 * Must NOT throw at module import time: `next build` sets NODE_ENV=production
 * while collecting route config, and env vars may only exist at runtime (Vercel).
 *
 * There is no in-repo fallback. JWT_SECRET must be set in the environment
 * (local `.env` or Vercel Project Settings → Environment Variables).
 */
function getJwtSecretKey(): Uint8Array {
  const secret = readEnv('JWT_SECRET');

  if (!secret) {
    if (!warnedMissingJwtSecret) {
      warnedMissingJwtSecret = true;
      console.warn(
        'JWT_SECRET is not set. Admin login is disabled until you configure a strong random secret.'
      );
    }
    throw new AuthConfigurationError('JWT_SECRET is not configured');
  }

  if (secret.length < MIN_JWT_SECRET_LENGTH || REJECTED_JWT_SECRETS.has(secret)) {
    if (!warnedInsecureJwtSecret) {
      warnedInsecureJwtSecret = true;
      console.warn(
        'JWT_SECRET is too short or matches a previously leaked in-repo value. ' +
          'Generate a new secret (e.g. openssl rand -base64 32) and set it in the environment.'
      );
    }
    throw new AuthConfigurationError('JWT_SECRET is not a usable production secret');
  }

  return new TextEncoder().encode(secret);
}

export function isJwtConfigured(): boolean {
  try {
    getJwtSecretKey();
    return true;
  } catch {
    return false;
  }
}

export interface AdminCredentialConfig {
  username: string;
  password: string | null;
  passwordHash: string | null;
}

/**
 * Admin username + password come only from environment variables / Vercel secrets.
 * No hardcoded defaults. ADMIN_INITIAL_PASSWORD is accepted as a legacy alias for
 * ADMIN_PASSWORD so existing Vercel projects keep working.
 */
export function getAdminCredentialConfig(): AdminCredentialConfig | null {
  const username = readEnv('ADMIN_USERNAME') || 'admin';
  const passwordHash = readEnv('ADMIN_PASSWORD_HASH') || null;
  let password: string | null =
    readEnv('ADMIN_PASSWORD') || readEnv('ADMIN_INITIAL_PASSWORD') || null;

  if (!password && !passwordHash) {
    if (!warnedMissingAdminPassword) {
      warnedMissingAdminPassword = true;
      console.warn(
        'ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH) is not set. Admin login is disabled.'
      );
    }
    return null;
  }

  if (password && REJECTED_PASSWORDS.has(password)) {
    if (!passwordHash) {
      if (!warnedRejectedAdminPassword) {
        warnedRejectedAdminPassword = true;
        console.warn(
          'ADMIN_PASSWORD matches a previously published default. Choose a new password and set it in the environment.'
        );
      }
      return null;
    }
    password = null;
  }

  return { username, password, passwordHash };
}

export function isAdminAuthConfigured(): boolean {
  return isJwtConfigured() && getAdminCredentialConfig() !== null;
}

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const config = getAdminCredentialConfig();
  if (!config) return false;

  const userOk = timingSafeStringEqual(username, config.username);

  let passOk = false;
  if (config.passwordHash) {
    try {
      passOk = await verifyPassword(password, config.passwordHash);
    } catch {
      passOk = false;
    }
  } else if (config.password) {
    passOk = timingSafeStringEqual(password, config.password);
  }

  return userOk && passOk;
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
  } catch {
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
    .createHmac('sha256', Buffer.from(getJwtSecretKey()))
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

  try {
    const expected = deriveCsrfToken(rawSession);
    const clientBuf = Buffer.from(clientToken, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (clientBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(clientBuf, expectedBuf);
  } catch {
    return false;
  }
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
