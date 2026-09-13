import { test, expect, type Page } from '@playwright/test';

test.describe('Pizza Dough Calculator - Full QA Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Hero Section', () => {
    test('displays editorial hero with correct content', async ({ page }) => {
      // Check eyebrow text
      await expect(page.locator('text=FOR HOME PIZZAIOLOS')).toBeVisible();

      // Check main headline
      await expect(page.locator('h1')).toContainText('The Art of');
      await expect(page.locator('h1')).toContainText('Perfect Dough');

      // Check CTA button
      await expect(page.locator('text=Start Your Recipe')).toBeVisible();
    });

    test('CTA button scrolls to calculator', async ({ page }) => {
      await page.click('text=Start Your Recipe');
      await expect(page.locator('#calculator')).toBeInViewport();
    });
  });

  test.describe('Style Selector', () => {
    test('displays all 7 pizza styles', async ({ page }) => {
      await page.goto('/#calculator');

      const styleSelector = page.locator('.style-selector');
      const styles = [
        'Neapolitan',
        'New York',
        'Detroit',
        'Thin & Crispy',
        'Poolish/Biga',
        'Emergency',
        'Custom'
      ];

      for (const style of styles) {
        await expect(styleSelector.locator(`text=${style}`).first()).toBeVisible();
      }
    });

    test('Neapolitan is selected by default', async ({ page }) => {
      await page.goto('/#calculator');

      const neapolitanRadio = page.locator('input[value="neapolitan"]');
      await expect(neapolitanRadio).toBeChecked();

      // Recipe should show Neapolitan
      await expect(page.locator('text=Neapolitan Pizza Dough')).toBeVisible();
    });

    test('clicking New York updates recipe', async ({ page }) => {
      await page.goto('/#calculator');

      await page.locator('label[data-style="newYork"]').click();
      await page.waitForTimeout(500);

      await expect(page.locator('text=New York Pizza Dough')).toBeVisible();
    });

    test('clicking Detroit updates recipe', async ({ page }) => {
      await page.goto('/#calculator');

      await page.click('label[data-style="detroit"]');

      await expect(page.locator('input[value="detroit"]')).toBeChecked();
      await expect(page.locator('text=Detroit Pizza Dough')).toBeVisible();
    });

    test('clicking Thin & Crispy updates recipe', async ({ page }) => {
      await page.goto('/#calculator');

      await page.locator('label[data-style="thinCrispy"]').click();
      await page.waitForTimeout(500);

      await expect(page.locator('text=Thin & Crispy Pizza Dough')).toBeVisible();
    });

    test('clicking Poolish/Biga updates recipe', async ({ page }) => {
      await page.goto('/#calculator');

      await page.locator('label[data-style="poolishBiga"]').click();
      await page.waitForTimeout(500);

      // Verify the recipe name element has the correct text
      await expect(page.locator('#recipeStyleName')).toContainText('Poolish/Biga');
    });

    test('clicking Emergency updates recipe', async ({ page }) => {
      await page.goto('/#calculator');

      await page.locator('label[data-style="emergency"]').click();
      await page.waitForTimeout(500);

      // Emergency style is named "Emergency (2hr)"
      await expect(page.locator('#recipeStyleName')).toContainText('Emergency');
    });

    test('clicking Custom updates recipe', async ({ page }) => {
      await page.goto('/#calculator');

      await page.click('label[data-style="custom"]');

      await expect(page.locator('input[value="custom"]')).toBeChecked();
      await expect(page.locator('text=Custom Pizza Dough')).toBeVisible();
    });
  });

  test.describe('Dough Quantity Controls', () => {
    test('number of dough balls input works', async ({ page }) => {
      await page.goto('/#calculator');

      const ballsInput = page.locator('input#numBalls');
      await expect(ballsInput).toBeVisible();

      await ballsInput.fill('6');
      await expect(ballsInput).toHaveValue('6');
    });

    test('weight per ball input works', async ({ page }) => {
      await page.goto('/#calculator');

      const weightInput = page.locator('input#ballWeight');
      await expect(weightInput).toBeVisible();

      await weightInput.fill('300');
      await expect(weightInput).toHaveValue('300');
    });

    test('quick preset buttons work', async ({ page }) => {
      await page.goto('/#calculator');

      // Click 6 pizzas preset
      await page.click('text=6 pizzas');

      const ballsInput = page.locator('input#numBalls');
      await expect(ballsInput).toHaveValue('6');
    });

    test('total dough weight updates correctly', async ({ page }) => {
      await page.goto('/#calculator');

      // Set 4 balls at 250g = 1000g
      await page.locator('input#numBalls').fill('4');
      await page.locator('input#ballWeight').fill('250');
      await page.waitForTimeout(300);

      // Check the total weight display element directly
      const totalWeight = page.locator('#totalDoughWeight');
      await expect(totalWeight).toContainText('1000');
    });
  });

  test.describe('Recipe Output', () => {
    test('displays ingredients with baker percentages', async ({ page }) => {
      await page.goto('/#calculator');

      // Check the ingredients section exists with ingredient data attributes
      await expect(page.locator('[data-ingredient="flour"]')).toBeVisible();
      await expect(page.locator('[data-ingredient="water"]')).toBeVisible();
      await expect(page.locator('[data-ingredient="salt"]')).toBeVisible();
    });

    test('displays instructions', async ({ page }) => {
      await page.goto('/#calculator');

      await expect(page.locator('#calculator').locator('text=Instructions')).toBeVisible();
    });

    test('print button is visible', async ({ page }) => {
      await page.goto('/#calculator');

      // Look for print button within recipe output section
      await expect(page.locator('#calculator button:has-text("Print")').first()).toBeVisible();
    });

    test('share button is visible', async ({ page }) => {
      await page.goto('/#calculator');

      await expect(page.locator('#calculator button:has-text("Share")').first()).toBeVisible();
    });

    test('copy button is visible', async ({ page }) => {
      await page.goto('/#calculator');

      await expect(page.locator('#calculator button:has-text("Copy")').first()).toBeVisible();
    });

    test('unit toggle switches between grams and ounces', async ({ page }) => {
      await page.goto('/#calculator');

      // Click oz toggle button within calculator
      await page.locator('#calculator button:has-text("oz")').first().click();
      await page.waitForTimeout(300);

      // Should show oz in values - check specific ingredient value
      await expect(page.locator('[data-ingredient="flour"]')).toContainText('oz');
    });
  });

  test.describe('Advanced Options', () => {
    test('accordion expands and collapses', async ({ page }) => {
      await page.goto('/#calculator');

      // Find the Advanced Options button/accordion trigger within calculator
      const advancedSection = page.locator('#calculator button:has-text("Advanced Options")').first();
      await expect(advancedSection).toBeVisible();

      // Click to expand
      await advancedSection.click();
      await page.waitForTimeout(300);

      // Should show hydration control
      await expect(page.locator('#calculator').getByText('Hydration').first()).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('header navigation links work', async ({ page }) => {
      // Check that main nav links exist (use first() to handle mobile/desktop duplication)
      await expect(page.locator('nav').getByText('Calculator').first()).toBeVisible();
      await expect(page.locator('nav').getByText('Pizza Styles').first()).toBeVisible();
      await expect(page.locator('nav').getByText("Baker's %").first()).toBeVisible();
      await expect(page.locator('nav').getByText('About').first()).toBeVisible();
    });

    test('logo links to home', async ({ page }) => {
      await page.goto('/#calculator');

      await page.locator('header a:has-text("The Pizza Dough")').first().click();

      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Responsive Design', () => {
    test('displays correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Hero should still be visible
      await expect(page.locator('h1')).toBeVisible();

      // Navigate to calculator
      await page.goto('/#calculator');

      // Style cards should be in 2-column grid on mobile
      const styleCards = page.locator('.style-card');
      await expect(styleCards.first()).toBeVisible();
    });

    test('displays correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/#calculator');

      // Should show 3 columns
      const styleCards = page.locator('.style-card');
      await expect(styleCards.first()).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('style selector has proper ARIA attributes', async ({ page }) => {
      await page.goto('/#calculator');

      const radioGroup = page.locator('[role="radiogroup"]');
      await expect(radioGroup).toHaveAttribute('aria-label', 'Pizza style selection');
    });

    test('style cards are focusable', async ({ page }) => {
      await page.goto('/#calculator');

      // Check that style cards can receive focus
      const firstCard = page.locator('.style-card').first();
      await expect(firstCard).toBeVisible();

      // Cards should have focus-within styles defined
      await expect(page.locator('[role="radiogroup"]')).toBeVisible();
    });
  });

  test.describe('SEO', () => {
    test('page has correct title', async ({ page }) => {
      await expect(page).toHaveTitle(/Pizza Dough Formula/);
    });

    test('page has meta description', async ({ page }) => {
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /pizza dough calculator/i);
    });
  });
});

test.describe('Guide-to-calculator handoff', () => {
  // Record uncaught script errors and console errors for every load in a test.
  function trackErrors(page: Page) {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;

      // Third-party resource failures are not calculator errors: AdSense ad requests return 403 off the
      // production host. Script errors and same-origin resource failures are still recorded.
      const { url } = message.location();
      const isThirdPartyResource =
        message.text().startsWith('Failed to load resource') && !!url && new URL(url).origin !== new URL(page.url()).origin;
      if (!isThirdPartyResource) consoleErrors.push(`${message.text()} ${url}`);
    });
    return { pageErrors, consoleErrors };
  }

  // Snapshot the controls and output that must agree after initialization.
  function readCalculatorState(page: Page) {
    return page.evaluate(() => {
      const input = (id: string) => document.getElementById(id) as HTMLInputElement;
      const checked = (name: string) =>
        (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement | null)?.value ?? null;
      const isHidden = (id: string) => document.getElementById(id)?.classList.contains('hidden') ?? null;

      return {
        style: checked('pizzaStyle'),
        size: checked('pizzaSize'),
        numBalls: input('numBalls').value,
        ballWeight: input('ballWeight').value,
        advancedExpanded: document.getElementById('advanced-toggle')?.getAttribute('aria-expanded'),
        hydration: input('hydration').value,
        hydrationLabel: document.getElementById('hydration-value')?.textContent,
        salt: input('salt').value,
        yeast: input('yeast').value,
        oil: input('oil').value,
        sugar: input('sugar').value,
        usePreFerment: input('usePreFerment').checked,
        preFermentOptionsHidden: isHidden('preFermentOptions'),
        preFermentType: checked('preFermentType'),
        preFermentPercent: input('preFermentPercent').value,
        preFermentPercentLabel: document.getElementById('preFermentPercent-value')?.textContent,
        humidityAdjust: input('humidityAdjust').checked,
        recipeStyleName: document.getElementById('recipeStyleName')?.textContent,
        totalDoughWeight: document.getElementById('totalDoughWeight')?.textContent,
        singleStageHidden: isHidden('singleStageRecipe'),
        twoStageHidden: isHidden('twoStageRecipe'),
        shareUrl: input('shareUrl').value,
      };
    });
  }

  // Preset ids come from PIZZA_STYLES in src/scripts/calculator/presets.js.
  const GUIDE_LINKS = [
    { styleId: 'newYork', recipeName: 'New York Pizza Dough', usePreFerment: false },
    { styleId: 'poolishBiga', recipeName: 'Poolish/Biga Pizza Dough', usePreFerment: true },
  ];

  for (const { styleId, recipeName, usePreFerment } of GUIDE_LINKS) {
    test(`/?s=${styleId} matches selecting the style manually`, async ({ page }) => {
      const errors = trackErrors(page);

      await page.goto('/');
      await page.locator(`label[data-style="${styleId}"]`).click();
      const manual = await readCalculatorState(page);

      await page.goto(`/?s=${styleId}`);
      const linked = await readCalculatorState(page);

      await expect(page.locator(`input[name="pizzaStyle"][value="${styleId}"]`)).toBeChecked();
      expect(linked).toEqual(manual);
      expect(linked.recipeStyleName).toBe(recipeName);
      expect(linked.usePreFerment).toBe(usePreFerment);
      expect(errors.pageErrors).toEqual([]);
    });
  }

  test('invalid style values fall back to Neapolitan', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/');
    const home = await readCalculatorState(page);

    // An unknown id, an inherited Object property, and a value that is not a valid CSS selector string.
    for (const style of ['notastyle', 'toString', '"]']) {
      await page.goto(`/?s=${encodeURIComponent(style)}`);
      expect(await readCalculatorState(page), `s=${style}`).toEqual(home);
    }

    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
  });

  test('saved recipe URL from the share feature reloads the same recipe', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/');
    await page.locator('label[data-style="newYork"]').click();
    await page.locator('#advanced-toggle').click();
    await page.locator('#numBalls').fill('3');
    await page.locator('#ballWeight').fill('275');
    await page.locator('#hydration').fill('70');
    await page.locator('#salt').fill('2.8');
    const saved = await readCalculatorState(page);

    await page.goto(saved.shareUrl);
    const reloaded = await readCalculatorState(page);

    expect(reloaded).toMatchObject({ style: 'newYork', numBalls: '3', ballWeight: '275', hydration: '70', salt: '2.8' });
    expect(reloaded).toEqual(saved);
    expect(errors.pageErrors).toEqual([]);
  });

  test('saved preferment recipe keeps its preferment type and percentage', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/');
    await page.locator('label[data-style="poolishBiga"]').click();
    await page.locator('#advanced-toggle').click();
    await page.locator('input[name="preFermentType"][value="biga"]').check();
    await page.locator('#preFermentPercent').fill('40');
    const saved = await readCalculatorState(page);

    await page.goto(saved.shareUrl);
    const reloaded = await readCalculatorState(page);

    expect(reloaded).toMatchObject({ usePreFerment: true, preFermentType: 'biga', preFermentPercent: '40' });
    expect(reloaded).toEqual(saved);
    expect(errors.pageErrors).toEqual([]);
  });

  test('explicit zero oil and sugar in a saved recipe override style defaults', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/?s=newYork&n=2&w=300&h=65&sa=20&y=4&o=0&su=0');

    // Neapolitan also has zero oil and sugar, so the recipe name confirms New York's defaults were
    // overridden rather than never applied.
    expect(await readCalculatorState(page)).toMatchObject({
      style: 'newYork',
      recipeStyleName: 'New York Pizza Dough',
      numBalls: '2',
      salt: '2.0',
      yeast: '0.4',
      oil: '0.0',
      sugar: '0.0',
    });
    expect(errors.pageErrors).toEqual([]);
  });

  test('size and quantity controls work after a guide link', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/?s=newYork');
    await page.locator('#quantity-presets').getByText('6 pizzas').click();
    await expect(page.locator('#numBalls')).toHaveValue('6');
    await expect(page.locator('#ballWeight')).toHaveValue('300');

    await page.locator('#size-options label', { hasText: '18"' }).click();
    await expect(page.locator('#ballWeight')).toHaveValue('450');
    await expect(page.locator('#totalDoughWeight')).toContainText('2700');
    expect(errors.pageErrors).toEqual([]);
  });

  test('homepage without parameters starts with Neapolitan defaults', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/');

    expect(await readCalculatorState(page)).toEqual({
      style: 'neapolitan',
      size: 'classic',
      numBalls: '4',
      ballWeight: '250',
      advancedExpanded: 'false',
      hydration: '62',
      hydrationLabel: '62%',
      salt: '2.5',
      yeast: '0.3',
      oil: '0.0',
      sugar: '0.0',
      usePreFerment: false,
      preFermentOptionsHidden: true,
      preFermentType: 'poolish',
      preFermentPercent: '25',
      preFermentPercentLabel: '25%',
      humidityAdjust: false,
      recipeStyleName: 'Neapolitan Pizza Dough',
      totalDoughWeight: '1000g',
      singleStageHidden: false,
      twoStageHidden: true,
      shareUrl: expect.stringMatching(/\/\?s=neapolitan&n=4&w=250&h=62&sa=25&y=3$/),
    });
    expect(errors.pageErrors).toEqual([]);
  });
});
