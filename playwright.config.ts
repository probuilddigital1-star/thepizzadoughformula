import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // tests/analytics.spec.ts needs a build made with PUBLIC_POSTHOG_KEY; it runs under
  // playwright.analytics.config.ts instead (npm run test:analytics).
  testIgnore: /analytics\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
