import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    target: 'es2022',
    tsconfigRaw: {
      compilerOptions: {
        target: 'es2022',
        experimentalDecorators: true,
        useDefineForClassFields: false,
      },
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
      headless: true,
    },
  },
});
