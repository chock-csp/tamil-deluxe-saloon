import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  hashPassword,
  verifyPassword,
  signAdminToken,
  verifyAdminToken,
  getAdminCredentialConfig,
  verifyAdminCredentials,
  isAdminAuthConfigured,
  isJwtConfigured,
  timingSafeStringEqual,
} from '../src/lib/auth';

const TEST_JWT = 'vitest-jwt-secret-key-not-for-production';
const TEST_PASSWORD = 'vitest-only-admin-password-32ch';

function setNodeEnv(value: string | undefined) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value,
    configurable: true,
    writable: true,
    enumerable: true,
  });
}

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
    process.env.JWT_SECRET = TEST_JWT;
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

describe('JWT_SECRET configuration', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwt = process.env.JWT_SECRET;

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

  it('should refuse to sign tokens when JWT_SECRET is unset', async () => {
    delete process.env.JWT_SECRET;
    setNodeEnv('production');
    vi.resetModules();

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const auth = await import('../src/lib/auth');

    await expect(auth.signAdminToken('id', 'admin')).rejects.toBeInstanceOf(
      auth.AuthConfigurationError
    );
    expect(auth.isJwtConfigured()).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/JWT_SECRET/));
    warn.mockRestore();
  });

  it('should refuse previously leaked in-repo JWT secrets', async () => {
    process.env.JWT_SECRET = 'tamil-deluxe-saloon-super-secret-jwt-key-90s-hits';
    vi.resetModules();

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const auth = await import('../src/lib/auth');
    expect(auth.isJwtConfigured()).toBe(false);
    await expect(auth.signAdminToken('id', 'admin')).rejects.toBeInstanceOf(
      auth.AuthConfigurationError
    );
    warn.mockRestore();
  });
});

describe('Admin credentials from environment', () => {
  const originalPassword = process.env.ADMIN_PASSWORD;
  const originalLegacy = process.env.ADMIN_INITIAL_PASSWORD;
  const originalHash = process.env.ADMIN_PASSWORD_HASH;
  const originalUser = process.env.ADMIN_USERNAME;
  const originalJwt = process.env.JWT_SECRET;

  afterEach(() => {
    restore('ADMIN_PASSWORD', originalPassword);
    restore('ADMIN_INITIAL_PASSWORD', originalLegacy);
    restore('ADMIN_PASSWORD_HASH', originalHash);
    restore('ADMIN_USERNAME', originalUser);
    restore('JWT_SECRET', originalJwt);
  });

  function restore(key: string, value: string | undefined) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  it('returns null when no admin password is configured', () => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_INITIAL_PASSWORD;
    delete process.env.ADMIN_PASSWORD_HASH;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getAdminCredentialConfig()).toBeNull();
    warn.mockRestore();
  });

  it('rejects the previously published default password even if set in env', () => {
    process.env.ADMIN_PASSWORD = 'saloon123';
    delete process.env.ADMIN_PASSWORD_HASH;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getAdminCredentialConfig()).toBeNull();
    warn.mockRestore();
  });

  it('reads ADMIN_PASSWORD and optional ADMIN_USERNAME from the environment', () => {
    process.env.ADMIN_USERNAME = 'saloon-owner';
    process.env.ADMIN_PASSWORD = 'a-unique-env-password-9f3';
    delete process.env.ADMIN_PASSWORD_HASH;
    const config = getAdminCredentialConfig();
    expect(config?.username).toBe('saloon-owner');
    expect(config?.password).toBe('a-unique-env-password-9f3');
  });

  it('falls back to the legacy ADMIN_INITIAL_PASSWORD alias', () => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD_HASH;
    process.env.ADMIN_INITIAL_PASSWORD = 'legacy-env-password-value';
    const config = getAdminCredentialConfig();
    expect(config?.password).toBe('legacy-env-password-value');
  });

  it('accepts matching env credentials and rejects mismatches', async () => {
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD = TEST_PASSWORD;
    delete process.env.ADMIN_PASSWORD_HASH;

    expect(await verifyAdminCredentials('admin', TEST_PASSWORD)).toBe(true);
    expect(await verifyAdminCredentials('admin', 'wrong-password')).toBe(false);
    expect(await verifyAdminCredentials('other', TEST_PASSWORD)).toBe(false);
  });

  it('verifies a bcrypt ADMIN_PASSWORD_HASH', async () => {
    const hash = await hashPassword('hashed-env-password');
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_INITIAL_PASSWORD;
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD_HASH = hash;

    expect(await verifyAdminCredentials('admin', 'hashed-env-password')).toBe(true);
    expect(await verifyAdminCredentials('admin', 'nope')).toBe(false);
  });

  it('requires both JWT_SECRET and an admin password to be configured', () => {
    process.env.JWT_SECRET = TEST_JWT;
    process.env.ADMIN_PASSWORD = TEST_PASSWORD;
    delete process.env.ADMIN_PASSWORD_HASH;
    expect(isJwtConfigured()).toBe(true);
    expect(isAdminAuthConfigured()).toBe(true);

    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_INITIAL_PASSWORD;
    delete process.env.ADMIN_PASSWORD_HASH;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(isAdminAuthConfigured()).toBe(false);
    warn.mockRestore();
  });
});

describe('timing-safe string compare', () => {
  it('returns true for equal strings and false otherwise', () => {
    expect(timingSafeStringEqual('abc', 'abc')).toBe(true);
    expect(timingSafeStringEqual('abc', 'abd')).toBe(false);
    expect(timingSafeStringEqual('short', 'much-longer')).toBe(false);
  });
});

describe('source must not ship seed admin credentials', () => {
  it('does not render default passwords on the admin login page', () => {
    const adminPage = fs.readFileSync(
      path.join(process.cwd(), 'src/app/admin/page.tsx'),
      'utf8'
    );
    expect(adminPage).not.toMatch(/saloon123/);
    expect(adminPage).not.toMatch(/Seed Credentials/i);
  });

  it('does not hardcode a fallback admin password in the login API', () => {
    const loginRoute = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/auth/login/route.ts'),
      'utf8'
    );
    expect(loginRoute).not.toMatch(/saloon123/);
    expect(loginRoute).not.toMatch(/\|\|\s*['"]admin['"]/);
  });

  it('does not embed an in-repo JWT fallback secret', () => {
    const authLib = fs.readFileSync(path.join(process.cwd(), 'src/lib/auth.ts'), 'utf8');
    expect(authLib).not.toMatch(/DEV_JWT_FALLBACK/);
    expect(authLib).toMatch(/REJECTED_JWT_SECRETS/);
    expect(authLib).toMatch(/AuthConfigurationError/);
  });
});
