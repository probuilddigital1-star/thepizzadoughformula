import { expect, test } from '@playwright/test';

/**
 * AdSense and Google Analytics were removed in ADR step 4, so no page may request a Google ads or tag
 * host. Pages come from the built sitemap, so new pages are covered without editing this file.
 * Runs in both Playwright configs: the default build and the analytics-enabled build.
 */
const GOOGLE_AD_AND_TAG_HOSTS = /googleads|googlesyndication|googletagmanager|google-analytics/i;

test('no page requests Google ads or tag hosts', async ({ page, request }) => {
  test.setTimeout(180_000);

  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
  expect(paths.length).toBeGreaterThan(0);

  const googleRequests: string[] = [];
  page.on('request', (req) => {
    if (GOOGLE_AD_AND_TAG_HOSTS.test(new URL(req.url()).hostname)) googleRequests.push(req.url());
  });
  // PostHog is not under test here; aborting its requests keeps the analytics-enabled run offline.
  await page.route(/posthog\.com/, (route) => route.abort());

  for (const path of [...paths, '/?s=newYork']) {
    await page.goto(path, { waitUntil: 'networkidle' });
  }

  expect(googleRequests).toEqual([]);
});
