import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      JWT_SECRET: 'vitest-jwt-secret-key-not-for-production',
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'vitest-only-admin-password-32ch',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
