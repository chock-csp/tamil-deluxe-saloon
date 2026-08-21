import crypto from 'crypto';

const DEV_FALLBACK =
  'tamil-deluxe-saloon-super-secret-jwt-key-90s-hits-DO-NOT-USE-IN-PROD';

function getCryptoKey(): Buffer {
  const secret = (process.env.JWT_SECRET || DEV_FALLBACK).trim() || DEV_FALLBACK;
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptJson(value: unknown): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getCryptoKey(), iv);
  const encoded = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encoded]).toString('base64url');
}

export function decryptJson<T>(token: string): T | null {
  try {
    const buf = Buffer.from(token, 'base64url');
    if (buf.length < 29) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encoded = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', getCryptoKey(), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(encoded), decipher.final()]).toString(
      'utf8'
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
