import { defineConfig, devices } from '@playwright/test';

/*
 * Visual snapshot configuration.
 *
 * Sub-pixel CSS effects (scanlines, halation, phosphor noise) produce
 * different bytes across OS/font-renderer combinations. Pin to a single
 * Linux chromium project. maxDiffPixelRatio: 0.02 tolerates font-rendering
 * jitter while still catching genuine regressions.
 *
 * Snapshots are checked into git under tests/__snapshots__/. Regenerate
 * with `pnpm test:update` from a Linux environment (Docker recommended for
 * CI parity; see README).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  webServer: {
    command: 'pnpm preview --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4321',
    deviceScaleFactor: 1,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  projects: [
    {
      name: 'chromium-linux',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
