import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  signAdminToken,
  setAdminSessionCookie,
  deriveCsrfToken,
  requireJsonContentType,
  isAdminAuthConfigured,
  verifyAdminCredentials,
  getAdminCredentialConfig,
  AuthConfigurationError,
} from '@/lib/auth';

// In-process sliding-window rate limiter: max 10 attempts per IP per 15 minutes.
// Works in long-lived Node.js processes (dev, self-hosted). On stateless serverless
// (Vercel) the map resets per cold start — acceptable; a real KV-backed limiter can
// replace this later without changing the rest of the code.
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptRecord {
  count: number;
  resetAt: number;
}

const attemptMap = new Map<string, AttemptRecord>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const record = attemptMap.get(ip);

  if (!record || now >= record.resetAt) {
    attemptMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: record.resetAt - now };
  }

  record.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

// Exported for unit-testing only
export const checkRateLimitForTest = {
  check: checkRateLimit,
  resetAll: () => attemptMap.clear(),
};

function getClientIp(request: Request, headerStore: Headers): string {
  return (
    headerStore.get('x-forwarded-for')?.split(',')[0].trim() ||
    headerStore.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: Request) {
  const ctError = requireJsonContentType(request);
  if (ctError) return ctError;

  try {
    const headerStore = await headers();
    const ip = getClientIp(request, headerStore);
    const { allowed, retryAfterMs } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }

    if (!isAdminAuthConfigured()) {
      return NextResponse.json(
        { error: 'Admin authentication is not configured on the server' },
        { status: 503 }
      );
    }

    const { username, password } = await request.json();

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const matched = await verifyAdminCredentials(username, password);
    if (!matched) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const config = getAdminCredentialConfig();
    const adminUsername = config?.username || username;
    const token = await signAdminToken('admin-user-id', adminUsername);
    await setAdminSessionCookie(token);
    const csrfToken = deriveCsrfToken(token);

    return NextResponse.json({
      success: true,
      user: { id: 'admin-user-id', username: adminUsername },
      csrfToken,
    });
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      return NextResponse.json(
        { error: 'Admin authentication is not configured on the server' },
        { status: 503 }
      );
    }
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
