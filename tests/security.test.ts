import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deriveCsrfToken, signAdminToken, verifyAdminToken } from '../src/lib/auth';

// ---------------------------------------------------------------------------
// CSRF token derivation
// ---------------------------------------------------------------------------
describe('CSRF token derivation', () => {
  it('derives a non-empty hex string from a JWT', async () => {
    const jwt = await signAdminToken('admin-user-id', 'admin');
    const csrf = deriveCsrfToken(jwt);
    expect(csrf).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces the same token for the same JWT (deterministic)', async () => {
    const jwt = await signAdminToken('admin-user-id', 'admin');
    expect(deriveCsrfToken(jwt)).toBe(deriveCsrfToken(jwt));
  });

  it('produces a different token for different JWTs', async () => {
    const jwt1 = await signAdminToken('user-a', 'admin');
    const jwt2 = await signAdminToken('user-b', 'admin');
    expect(deriveCsrfToken(jwt1)).not.toBe(deriveCsrfToken(jwt2));
  });
});

// ---------------------------------------------------------------------------
// URL sanitisation in storage layer
// ---------------------------------------------------------------------------
import { sanitizePlaylistUrlForTest } from '../src/lib/storage';

describe('URL sanitisation', () => {
  it.each([
    ['javascript:alert(1)', 'https://open.spotify.com'],
    ['data:text/html,<h1>xss</h1>', 'https://open.spotify.com'],
    ['http://evil.com/hack', 'https://open.spotify.com'],
    ['', 'https://open.spotify.com'],
  ])('rejects "%s" and falls back to default', (input, fallback) => {
    expect(sanitizePlaylistUrlForTest(input, fallback)).toBe(fallback);
  });

  it.each([
    ['https://open.spotify.com/playlist/123', 'https://open.spotify.com/playlist/123'],
    ['https://music.youtube.com/playlist?list=PL123', 'https://music.youtube.com/playlist?list=PL123'],
  ])('accepts valid HTTPS playlist URL "%s"', (input, expected) => {
    expect(sanitizePlaylistUrlForTest(input, 'https://open.spotify.com')).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// YouTube ID sanitisation
// ---------------------------------------------------------------------------
import { sanitizeYoutubeIdForTest } from '../src/lib/storage';

describe('YouTube ID sanitisation', () => {
  it('strips characters outside the YouTube playlist ID alphabet', () => {
    expect(sanitizeYoutubeIdForTest('../../../etc/passwd')).toBe('etcpasswd');
    expect(sanitizeYoutubeIdForTest('<script>alert(1)</script>')).toBe('scriptalert1script');
    expect(sanitizeYoutubeIdForTest('PL_123-abc')).toBe('PL_123-abc');
  });

  it('extracts the ID portion from a full playlist URL', () => {
    const result = sanitizeYoutubeIdForTest(
      'https://www.youtube.com/playlist?list=PLaZZ&foo=bar'
    );
    expect(result).toBe('PLaZZ');
  });
});

// ---------------------------------------------------------------------------
// Rate limiter (login endpoint) — tested via the in-module counter
// ---------------------------------------------------------------------------
import { checkRateLimitForTest } from '../src/app/api/auth/login/route';

describe('Login rate limiter', () => {
  beforeEach(() => {
    // Reset the map for each test
    checkRateLimitForTest.resetAll();
  });

  it('allows the first 10 attempts', () => {
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimitForTest.check('1.2.3.4');
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks the 11th attempt from the same IP', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimitForTest.check('5.6.7.8');
    }
    const result = checkRateLimitForTest.check('5.6.7.8');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('does not block a different IP', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimitForTest.check('9.10.11.12');
    }
    const result = checkRateLimitForTest.check('0.0.0.0');
    expect(result.allowed).toBe(true);
  });
});
