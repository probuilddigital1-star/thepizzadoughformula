import { expect, test, type Page } from '@playwright/test';

/**
 * Newsletter forms send one webhook request per submission, even when the visitor clicks again or
 * presses Enter while the first request is still waiting.
 *
 * Every cross-origin request is answered or blocked here, so nothing reaches the real n8n webhook.
 */

const TEST_EMAIL = 'double-submit@example.com';
const WEBHOOK_DELAY_MS = 1500;

const FORMS = [
  {
    name: 'newsletter section',
    form: '#email-form',
    email: '#newsletter-email',
    consent: 'input[name="newsletter-consent"]',
    success: '#email-success',
    error: '#email-error',
  },
  {
    name: 'below the calculator',
    form: '#recipe-email-form',
    email: '#recipe-email',
    consent: 'input[name="recipe-consent"]',
    success: '#recipe-email-success',
    error: '#recipe-email-error',
  },
];

// Answers the webhook after a delay and records each POST body. Other cross-origin requests are blocked.
async function stubWebhook(page: Page, status: number): Promise<string[]> {
  const posts: string[] = [];
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };

  await page.route(
    (url) => !['localhost', '127.0.0.1'].includes(url.hostname),
    async (route) => {
      const request = route.request();
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      if (request.method() !== 'POST') return route.abort();
      posts.push(request.postData() ?? '');
      await new Promise((resolve) => setTimeout(resolve, WEBHOOK_DELAY_MS));
      return route.fulfill({ status, headers: cors, contentType: 'application/json', body: '{"ok":true}' });
    }
  );

  return posts;
}

test.describe('Newsletter forms ignore repeat submits', () => {
  for (const form of FORMS) {
    for (const status of [200, 500]) {
      test(`${form.name} form sends one request (webhook answers ${status})`, async ({ page }) => {
        // Keep the analytics notice from covering the buttons.
        await page.addInitScript(() => localStorage.setItem('analyticsNoticeDismissed', '1'));
        const posts = await stubWebhook(page, status);
        await page.goto('/');

        const formLocator = page.locator(form.form);
        const button = formLocator.locator('button[type="submit"]');
        const idleText = ((await button.textContent()) ?? '').trim();

        await formLocator.locator(form.email).fill(TEST_EMAIL);
        await formLocator.locator(form.consent).check();
        await button.click();

        await expect(button).toBeDisabled();
        await expect(button).toHaveText('Sending...');

        // Repeat attempts while the webhook is still waiting.
        await button.click({ force: true });
        await button.click({ force: true });
        await formLocator.locator(form.email).press('Enter');
        await formLocator.evaluate((element) => (element as HTMLFormElement).requestSubmit());

        await expect(page.locator(status === 200 ? form.success : form.error)).toBeVisible({ timeout: 5000 });
        await expect(button).toBeEnabled();
        await expect(button).toHaveText(idleText);

        // Leave time for any late duplicate to show up.
        await page.waitForTimeout(500);
        expect(posts).toHaveLength(1);
        expect(JSON.parse(posts[0])).toMatchObject({ email: TEST_EMAIL });
      });
    }
  }
});
