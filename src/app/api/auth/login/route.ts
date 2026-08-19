import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { signAdminToken, setAdminSessionCookie, deriveCsrfToken, requireJsonContentType } from '@/lib/auth';

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

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const expectedAdmin = process.env.ADMIN_USERNAME || 'admin';
    const expectedPassword = process.env.ADMIN_INITIAL_PASSWORD || 'saloon123';

    if (username !== expectedAdmin || password !== expectedPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await signAdminToken('admin-user-id', expectedAdmin);
    await setAdminSessionCookie(token);
    const csrfToken = deriveCsrfToken(token);

    return NextResponse.json({
      success: true,
      user: { id: 'admin-user-id', username: expectedAdmin },
      csrfToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
