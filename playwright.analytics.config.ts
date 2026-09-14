import { defineConfig } from '@playwright/test';

/**
 * Analytics-enabled Playwright run: npm run test:analytics
 *
 * src/lib/analytics.ts does nothing without a build-time PUBLIC_POSTHOG_KEY, so these tests need their
 * own production build made with a throwaway key. It is built into dist-analytics/ and served on port
 * 8082, so it never replaces dist/ or collides with the default suite's preview server on 8080.
 *
 * PUBLIC_POSTHOG_TEST_DISABLE_COMPRESSION keeps event payloads readable, because posthog-js gzips them
 * by default. The specs answer every PostHog request locally, so nothing reaches PostHog.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /(analytics|third-party-scripts)\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8082',
    // posthog-js drops events from browsers it detects as bots, and headless Chromium's default user
    // agent contains "HeadlessChrome". interceptPostHog() in tests/analytics.spec.ts hides the other
    // automation signals it checks (userAgentData brands and navigator.webdriver).
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npx astro build --outDir dist-analytics && npx astro preview --outDir dist-analytics --port 8082 --host 127.0.0.1',
    url: 'http://127.0.0.1:8082',
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      PUBLIC_POSTHOG_KEY: 'phc_playwright_test_key',
      PUBLIC_POSTHOG_TEST_DISABLE_COMPRESSION: 'true',
    },
  },
});
