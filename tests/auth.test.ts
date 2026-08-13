import { describe, it, expect } from 'vitest';
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
