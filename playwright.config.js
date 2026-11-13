import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-chromium', use: {
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    } },
  ],
  webServer: {
    command: 'node tests/serve.mjs',
    url: 'http://127.0.0.1:4173',
    // Never accidentally test a stale server or a different checkout.
    reuseExistingServer: false,
  },
});
