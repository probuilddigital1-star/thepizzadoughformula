import { expect, test, type BrowserContext, type Page, type Request } from '@playwright/test';

/**
 * PostHog events, checked against what posthog-js actually sends.
 *
 * Runs under playwright.analytics.config.ts: a production build made with a throwaway key and
 * PUBLIC_POSTHOG_TEST_DISABLE_COMPRESSION=true, so event payloads are plain JSON. Every request to a
 * PostHog host is answered here, so nothing reaches PostHog.
 */

type SentEvent = { event: string; properties: Record<string, unknown> };
type Sent = { events: SentEvent[]; unreadable: string[] };

const POSTHOG_HOSTS = /^https:\/\/[a-z0-9.-]*posthog\.com\//;

// Remote config as PostHog would serve it. It offers gzip, so the test build's compression switch is
// what keeps payloads readable. Recordings and feature flags are off, so no further requests follow.
const REMOTE_CONFIG = { supportedCompression: ['gzip', 'gzip-js'], sessionRecording: false, hasFeatureFlags: false };

async function interceptPostHog(context: BrowserContext): Promise<Sent> {
  const sent: Sent = { events: [], unreadable: [] };

  // posthog-js drops events from browsers that look automated: a user agent or userAgentData brand
  // such as "HeadlessChrome", or navigator.webdriver. The config sets a desktop Chrome user agent;
  // this hides the other two signals in the test browser.
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { configurable: true, get: () => false });
    Object.defineProperty(Navigator.prototype, 'userAgentData', { configurable: true, get: () => undefined });
  });

  await context.route(POSTHOG_HOSTS, async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname.endsWith('/config')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(REMOTE_CONFIG) });
    }
    if (request.method() === 'POST' && url.pathname.startsWith('/flags')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    if (request.method() === 'POST') {
      const events = decodeEvents(request);
      if (events) sent.events.push(...events);
      else sent.unreadable.push(request.url());
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":1}' });
    }
    // Scripts such as config.js and exception-autocapture.js
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });

  return sent;
}

// Event batches are JSON, or base64 JSON in a `data` form field. Anything else (a gzip body, for
// example) returns null, so the test fails instead of silently missing events.
function decodeEvents(request: Request): SentEvent[] | null {
  const body = request.postData();
  if (!body) return null;

  let parsed: unknown;
  try {
    const formData = body.startsWith('data=') ? new URLSearchParams(body).get('data') : null;
    parsed = JSON.parse(formData ? Buffer.from(formData, 'base64').toString('utf8') : body);
  } catch {
    return null;
  }

  const batch = (parsed as { batch?: unknown }).batch;
  const list = Array.isArray(parsed) ? parsed : Array.isArray(batch) ? batch : [parsed];
  return list
    .filter((item): item is SentEvent => typeof (item as SentEvent)?.event === 'string')
    .map((item) => ({ event: item.event, properties: item.properties ?? {} }));
}

function named(sent: Sent, name: string): SentEvent[] {
  return sent.events.filter((entry) => entry.event === name);
}

// posthog-js sends batches every few seconds.
async function waitForEvent(sent: Sent, name: string, placement?: string) {
  await expect
    .poll(() => named(sent, name).some((entry) => placement === undefined || entry.properties.placement === placement), {
      message: `waiting for ${name}`,
      timeout: 15_000,
    })
    .toBe(true);
}

// Scroll the lower newsletter form into view and wait for its event. Batches go out in capture order,
// so once this arrives, every event captured before it has been sent too.
async function flushThroughMarker(page: Page, sent: Sent) {
  await page.locator('#email-form').scrollIntoViewIfNeeded();
  await waitForEvent(sent, 'newsletter_form_viewed', 'newsletter-section');
}

test.describe('PostHog events', () => {
  test('a guide link sends guide_to_calculator once and no calculator_used', async ({ page, context }) => {
    const sent = await interceptPostHog(context);

    await page.goto('/?s=newYork');
    await waitForEvent(sent, 'guide_to_calculator');
    await flushThroughMarker(page, sent);

    const guide = named(sent, 'guide_to_calculator');
    expect(guide).toHaveLength(1);
    expect(guide[0].properties).toMatchObject({
      page: '/',
      style: 'newYork',
      placement: 'none',
      referrer_path: 'none',
      saved_recipe: false,
      $host: '127.0.0.1:8082',
    });
    expect(named(sent, 'calculator_used')).toHaveLength(0);
    expect(sent.unreadable).toEqual([]);
  });

  test('changing an input sends calculator_used exactly once', async ({ page, context }) => {
    const sent = await interceptPostHog(context);

    await page.goto('/?s=newYork');
    await waitForEvent(sent, 'guide_to_calculator');
    expect(named(sent, 'calculator_used')).toHaveLength(0);

    await page.locator('#numBalls').fill('6');
    await waitForEvent(sent, 'calculator_used');

    // A second change on the same page view must not send another.
    await page.locator('#ballWeight').fill('320');
    await flushThroughMarker(page, sent);

    const used = named(sent, 'calculator_used');
    expect(used).toHaveLength(1);
    expect(used[0].properties).toMatchObject({ page: '/', style: 'newYork', placement: 'none' });
    expect(named(sent, 'guide_to_calculator')).toHaveLength(1);

    // Every event this site defines carries page, style, and placement; no payload contains an email.
    for (const entry of sent.events.filter((item) => !item.event.startsWith('$'))) {
      expect(entry.properties, entry.event).toEqual(
        expect.objectContaining({ page: expect.any(String), style: expect.any(String), placement: expect.any(String) })
      );
    }
    expect(JSON.stringify(sent.events)).not.toContain('@');
    expect(sent.unreadable).toEqual([]);
  });

  for (const path of ['/', '/?s=notastyle']) {
    test(`${path} sends neither guide_to_calculator nor calculator_used`, async ({ page, context }) => {
      const sent = await interceptPostHog(context);

      await page.goto(path);
      await waitForEvent(sent, '$pageview');
      await flushThroughMarker(page, sent);

      expect(named(sent, 'guide_to_calculator')).toHaveLength(0);
      expect(named(sent, 'calculator_used')).toHaveLength(0);
      expect(sent.unreadable).toEqual([]);
    });
  }

  test('sets no cookies and keeps exactly one PostHog key in localStorage', async ({ page, context }) => {
    const sent = await interceptPostHog(context);

    await page.goto('/');
    await waitForEvent(sent, '$pageview');

    expect(await context.cookies()).toEqual([]);
    expect(await page.evaluate(() => document.cookie)).toBe('');
    const posthogKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => key.startsWith('ph_') || key.toLowerCase().includes('posthog'))
    );
    expect(posthogKeys).toHaveLength(1);
  });

  test('an impossible pre-ferment sends recipe_invalid once with its reason', async ({ page, context }) => {
    const sent = await interceptPostHog(context);

    await page.goto('/');
    await waitForEvent(sent, '$pageview');
    await page.locator('#advanced-toggle').click();
    await page.locator('#hydration').fill('45');
    await page.locator('label:has(#usePreFerment)').click();
    await page.locator('#preFermentPercent').fill('50');
    await expect(page.locator('#recipe-issue')).toBeVisible();
    // Still impossible for the same reason: no second event
    await page.locator('#preFermentPercent').fill('49');
    await flushThroughMarker(page, sent);

    const invalid = named(sent, 'recipe_invalid');
    expect(invalid).toHaveLength(1);
    expect(invalid[0].properties).toMatchObject({
      page: '/',
      style: 'neapolitan',
      placement: 'none',
      reason: 'preferment_water_exceeds_total',
    });
    expect(sent.unreadable).toEqual([]);
  });
});
