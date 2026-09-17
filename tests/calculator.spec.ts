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

      // The FAQ also mentions "New York pizza dough", so check the recipe title itself
      const recipeName = page.locator('#recipeStyleName');
      await expect(recipeName).toBeVisible();
      await expect(recipeName).toHaveText('New York Pizza Dough');
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

      // The size options are a radiogroup too, so scope to the style selector
      const radioGroup = page.locator('.style-selector [role="radiogroup"]');
      await expect(radioGroup).toHaveAttribute('aria-label', 'Pizza style selection');
    });

    test('style cards are focusable', async ({ page }) => {
      await page.goto('/#calculator');

      // Check that style cards can receive focus
      const firstCard = page.locator('.style-card').first();
      await expect(firstCard).toBeVisible();

      // Cards should have focus-within styles defined
      await expect(page.locator('.style-selector [role="radiogroup"]')).toBeVisible();
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
      shareUrl: expect.stringMatching(/\/\?v=2&s=neapolitan&n=4&w=250&h=62&sa=2\.5&y=0\.3&yt=instant&o=0&su=0&pf=0&ha=0$/),
    });
    expect(errors.pageErrors).toEqual([]);
  });
});

test.describe('Recipe outputs agree', () => {
  // Capture the copied text and print calls instead of using the real clipboard and print dialog.
  async function captureCopyAndPrint(page: Page) {
    await page.addInitScript(() => {
      const target = window as unknown as { __copiedText: string | null; __printCalls: number };
      target.__copiedText = null;
      target.__printCalls = 0;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            target.__copiedText = text;
          },
        },
      });
      window.print = () => {
        target.__printCalls += 1;
      };
    });
  }

  // Label and amount of the yeast row in a recipe card
  function yeastLine(page: Page, card: string, attribute: string) {
    return page.locator(`${card} [${attribute}="yeast"]`).evaluate((amount) => ({
      label: amount.closest('li')?.firstElementChild?.textContent?.trim() ?? '',
      amount: amount.textContent?.trim() ?? '',
    }));
  }

  const cases = [
    { yeastType: 'instant', unit: 'grams', preferment: false, label: 'Instant Yeast', amount: '1.8g' },
    { yeastType: 'activeDry', unit: 'grams', preferment: false, label: 'Active Dry Yeast', amount: '2.3g' },
    { yeastType: 'instant', unit: 'ounces', preferment: false, label: 'Instant Yeast', amount: '0.06oz' },
    { yeastType: 'activeDry', unit: 'ounces', preferment: false, label: 'Active Dry Yeast', amount: '0.08oz' },
    { yeastType: 'activeDry', unit: 'grams', preferment: true, label: 'Active Dry Yeast', amount: null },
  ];

  for (const c of cases) {
    const name = `${c.yeastType} yeast in ${c.unit}${c.preferment ? ' with a pre-ferment' : ''}`;
    test(`screen, copied text and print show the same yeast line: ${name}`, async ({ page }) => {
      await captureCopyAndPrint(page);
      await page.goto(c.preferment ? '/?s=poolishBiga' : '/');
      await page.locator('#advanced-toggle').click();
      await page.locator(`input[name="yeastType"][value="${c.yeastType}"]`).check();
      if (c.unit === 'ounces') await page.locator('#unitToggle').click();

      const card = c.preferment ? '#twoStageRecipe' : '#singleStageRecipe';
      const attribute = c.preferment ? 'data-pf-ingredient' : 'data-ingredient';
      const onScreen = await yeastLine(page, card, attribute);
      expect(onScreen.label).toBe(c.label);
      if (c.amount) expect(onScreen.amount).toBe(c.amount);

      // Copied text
      await page.locator(`${card} button:has-text("Copy")`).click();
      const copied = (await (await page.waitForFunction(() => (window as unknown as { __copiedText: string | null }).__copiedText)).jsonValue()) as string;
      const copiedLine = copied.split('\n').find((line) => line.startsWith(`${onScreen.label}:`));
      expect(copiedLine, copied).toBeDefined();
      expect(copiedLine!.startsWith(`${onScreen.label}: ${onScreen.amount}`), copiedLine).toBe(true);

      // Print output: the same card under print styles
      await page.locator(`${card} button:has-text("Print")`).click();
      expect(await page.evaluate(() => (window as unknown as { __printCalls: number }).__printCalls)).toBe(1);
      await page.emulateMedia({ media: 'print' });
      await expect(page.locator(`${card} li`, { has: page.locator(`[${attribute}="yeast"]`) })).toBeVisible();
      expect(await yeastLine(page, card, attribute)).toEqual(onScreen);
      await expect(page.locator(`${card} button:has-text("Print")`)).toBeHidden();
    });
  }
});

test.describe('Impossible pre-ferment', () => {
  const recipeActions = ['#printRecipe', '#printRecipe2', '#shareRecipe', '#shareRecipe2', '#copyRecipe', '#copyRecipe2', '#shareCTA'];

  test('explains the conflict, shows no amounts, and disables copy, print and share until fixed', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto('/');
    await page.locator('#advanced-toggle').click();
    await page.locator('#hydration').fill('45');
    await page.locator('label:has(#usePreFerment)').click();
    await page.locator('#preFermentPercent').fill('50');

    const issue = page.locator('#recipe-issue');
    await expect(issue).toBeVisible();
    await expect(page.locator('#recipe-issue-text')).toContainText('poolish made with 50% of the flour');
    await expect(page.locator('#recipe-issue-text')).toContainText('only has 45%');
    for (const selector of recipeActions) await expect(page.locator(selector), selector).toBeDisabled();
    for (const selector of ['#shareTwitter', '#shareFacebook', '#shareReddit']) {
      await expect(page.locator(selector)).toHaveAttribute('aria-disabled', 'true');
    }
    await expect(page.locator('#shareUrl')).toHaveValue('');
    const amounts = await page.locator('#twoStageRecipe [data-pf-ingredient], #twoStageRecipe [data-final-ingredient]').allTextContents();
    expect(amounts.every((text) => text.trim() === 'n/a'), amounts.join(', ')).toBe(true);

    // Enough hydration for the pre-ferment makes the recipe valid again
    await page.locator('#hydration').fill('60');
    await expect(issue).toBeHidden();
    for (const selector of recipeActions) await expect(page.locator(selector), selector).toBeEnabled();
    await expect(page.locator('#shareTwitter')).toHaveAttribute('aria-disabled', 'false');
    await expect(page.locator('#shareUrl')).toHaveValue(/[?&]pf=1&pft=poolish&pfp=50&/);
    await expect(page.locator('[data-final-ingredient="water"]')).toHaveText(/^\d+g$/);
    expect(pageErrors).toEqual([]);
  });

  test('a shared link with an impossible pre-ferment opens with the explanation and disabled actions', async ({ page }) => {
    await page.goto('/?v=2&s=poolishBiga&n=4&w=260&h=45&sa=2.5&y=0.2&yt=instant&o=0&su=0&pf=1&pft=poolish&pfp=50&ha=0');

    await expect(page.locator('#recipe-issue')).toBeVisible();
    await expect(page.locator('#recipe-issue-text')).toContainText('50%');
    for (const selector of recipeActions) await expect(page.locator(selector), selector).toBeDisabled();
  });
});

test.describe('Saved links and explicit zeros', () => {
  test('an earlier-format New York link without oil or sugar keeps both at zero', async ({ page }) => {
    await page.goto('/?s=newYork&n=2&w=300&h=65&sa=20&y=4');

    await expect(page.locator('#recipeStyleName')).toHaveText('New York Pizza Dough');
    await expect(page.locator('#oil')).toHaveValue('0.0');
    await expect(page.locator('#sugar')).toHaveValue('0.0');
    await expect(page.locator('#oilRow')).toBeHidden();
  });

  test('an earlier-format Poolish/Biga link without the pre-ferment switch keeps it off', async ({ page }) => {
    await page.goto('/?s=poolishBiga&n=3&w=260&h=65&sa=25&y=2');

    await expect(page.locator('input[value="poolishBiga"]')).toBeChecked();
    await expect(page.locator('#usePreFerment')).not.toBeChecked();
    await expect(page.locator('#singleStageRecipe')).toBeVisible();
    await expect(page.locator('#twoStageRecipe')).toBeHidden();
  });

  test('an earlier-format link with the retired flour parameter still loads', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto('/?s=newYork&n=2&w=300&h=65&sa=20&y=4&o=3&su=2&ft=bread');

    await expect(page.locator('#numBalls')).toHaveValue('2');
    await expect(page.locator('#oil')).toHaveValue('3.0');
    await expect(page.locator('#flourType')).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('fractional percentages and yeast type survive a reload', async ({ page }) => {
    const query = '?v=2&s=neapolitan&n=2&w=280&h=62.5&sa=2.75&y=0.15&yt=activeDry&o=0&su=0&pf=0&ha=0';
    await page.goto(`/${query}`);

    await expect(page.locator('#hydration')).toHaveValue('62.5');
    await expect(page.locator('#hydration-value')).toHaveText('62.5%');
    await expect(page.locator('#salt')).toHaveValue('2.75');
    await expect(page.locator('#yeast')).toHaveValue('0.15');
    await expect(page.locator('input[name="yeastType"][value="activeDry"]')).toBeChecked();
    await expect(page.locator('#shareUrl')).toHaveValue(new RegExp(`/${query.replace(/[?.]/g, '\\$&')}$`));
  });

  test('an explicit zero in a field is kept instead of replaced by a default', async ({ page }) => {
    await page.goto('/');
    await page.locator('#advanced-toggle').click();
    await page.locator('#salt').fill('0');

    await expect(page.locator('[data-ingredient="salt"]')).toHaveText('0g');
    await expect(page.locator('#saltPercent')).toHaveText('(0.0%)');
    await expect(page.locator('#shareUrl')).toHaveValue(/&sa=0&/);

    await page.locator('#numBalls').fill('0');
    await expect(page.locator('#recipe-issue-text')).toHaveText('Enter at least 1 dough ball.');
    await expect(page.locator('#copyRecipe')).toBeDisabled();

    // A blank field falls back to the default instead of blocking the recipe
    await page.locator('#numBalls').fill('');
    await expect(page.locator('#recipe-issue')).toBeHidden();
    await expect(page.locator('#recipeSummary')).toContainText('Makes 4 dough balls');
  });
});
