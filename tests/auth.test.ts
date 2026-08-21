import { describe, it, expect, afterEach, vi } from 'vitest';
import { hashPassword, verifyPassword, signAdminToken, verifyAdminToken } from '../src/lib/auth';

describe('Admin Authentication Unit Tests', () => {
  it('should correctly hash and verify passwords with bcrypt', async () => {
    const rawPassword = 'saloon_super_secret_123';
    const hash = await hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);

    const isValid = await verifyPassword(rawPassword, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('wrong_password', hash);
    expect(isInvalid).toBe(false);
  });

  it('should sign and verify valid admin JWT tokens with jose', async () => {
    const adminId = 'admin-id-123';
    const username = 'admin';

    const token = await signAdminToken(adminId, username);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const payload = await verifyAdminToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe(adminId);
    expect(payload?.username).toBe(username);
  });

  it('should reject tampered or invalid JWT tokens', async () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
    const payload = await verifyAdminToken(invalidToken);
    expect(payload).toBeNull();
  });
});

describe('JWT_SECRET production build safety', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwt = process.env.JWT_SECRET;

  function setNodeEnv(value: string | undefined) {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value,
      configurable: true,
      writable: true,
      enumerable: true,
    });
  }

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
    if (originalJwt === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwt;
    }
    vi.resetModules();
  });

  it('should allow importing auth module in production without JWT_SECRET (build-safe)', async () => {
    delete process.env.JWT_SECRET;
    setNodeEnv('production');
    vi.resetModules();

    // Must not throw at import / module evaluation time (next build collects routes).
    await expect(import('../src/lib/auth')).resolves.toBeTruthy();
  });

  it('should sign with a fallback secret when JWT_SECRET is unset in production', async () => {
    delete process.env.JWT_SECRET;
    setNodeEnv('production');
    vi.resetModules();

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const auth = await import('../src/lib/auth');
    const token = await auth.signAdminToken('id', 'admin');
    const payload = await auth.verifyAdminToken(token);

    expect(typeof token).toBe('string');
    expect(payload?.sub).toBe('id');
    expect(payload?.username).toBe('admin');
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/JWT_SECRET/));
    warn.mockRestore();
  });
});
