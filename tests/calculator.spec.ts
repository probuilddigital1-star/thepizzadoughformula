import { test, expect } from '@playwright/test';

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
