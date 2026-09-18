import { expect, test } from '@playwright/test';
import {
  ACTIVE_DRY_FACTOR,
  BIGA_HYDRATION,
  DEFAULT_RECIPE_STATE,
  DoughCalculator,
  PREFERMENT_YEAST_PERCENT,
} from '../src/scripts/calculator/engine.js';
import { PIZZA_STYLES, getWeightForSize } from '../src/scripts/calculator/presets.js';
import { formatWeight } from '../src/scripts/calculator/units.js';
import { buildRecipeView, decodeRecipe, encodeRecipe, generateRecipeText } from '../src/scripts/features/shareRecipe.js';

/**
 * Numerical checks for the calculator engine, weight formatting, recipe text and share URLs. They run
 * in Playwright's test runner without opening a page, and verify formula behavior, not baking outcomes.
 */

const neapolitan = { ...DEFAULT_RECIPE_STATE, numBalls: 4, ballWeight: 250, hydration: 0.62, salt: 0.025, yeast: 0.003 };
const total = (values: Record<string, number>) => Object.values(values).reduce((sum, value) => sum + value, 0);

test.describe('Engine: ingredient arithmetic', () => {
  test("single-stage quantities follow baker's percentages and add up to the dough weight", () => {
    const result = new DoughCalculator(neapolitan).calculate();
    const flour = 1000 / (1 + 0.62 + 0.025 + 0.003);

    expect(result.valid).toBe(true);
    expect(result.stage).toBe('single');
    expect(result.ingredients.flour).toBeCloseTo(flour, 9);
    expect(result.ingredients.water).toBeCloseTo(flour * 0.62, 9);
    expect(result.ingredients.salt).toBeCloseTo(flour * 0.025, 9);
    expect(result.ingredients.yeast).toBeCloseTo(flour * 0.003, 9);
    expect(total(result.ingredients)).toBeCloseTo(1000, 9);
  });

  test('active dry yeast is converted inside the calculation and the total still matches', () => {
    const instant = new DoughCalculator(neapolitan).calculate();
    const activeDry = new DoughCalculator({ ...neapolitan, yeastType: 'activeDry' }).calculate();
    const flour = 1000 / (1 + 0.62 + 0.025 + 0.003 * ACTIVE_DRY_FACTOR);

    expect(activeDry.yeastType).toBe('activeDry');
    expect(activeDry.ingredients.yeast).toBeCloseTo(flour * 0.003 * ACTIVE_DRY_FACTOR, 9);
    expect(activeDry.percentages.yeast).toBeCloseTo(0.375, 9);
    expect(activeDry.ingredients.yeast / instant.ingredients.yeast).toBeCloseTo(1.25, 2);
    expect(total(activeDry.ingredients)).toBeCloseTo(1000, 9);
  });

  test('the humidity adjustment lowers hydration by 2.5 points', () => {
    const result = new DoughCalculator({ ...neapolitan, humidityAdjust: true }).calculate();

    expect(result.percentages.hydration).toBeCloseTo(59.5, 9);
    expect(total(result.ingredients)).toBeCloseTo(1000, 9);
  });

  test('explicit zeros are kept', () => {
    const result = new DoughCalculator({ ...neapolitan, salt: 0, yeast: 0, oil: 0, sugar: 0 }).calculate();

    expect(result.valid).toBe(true);
    expect(result.ingredients).toMatchObject({ salt: 0, yeast: 0, oil: 0, sugar: 0 });
    expect(result.ingredients.flour).toBeCloseTo(1000 / 1.62, 9);
  });

  test('a poolish takes its share of the flour and an equal weight of water', () => {
    const state = { ...neapolitan, hydration: 0.65, usePreFerment: true, preFermentType: 'poolish', preFermentFlourPercent: 0.25 };
    const result = new DoughCalculator(state).calculate();
    const { flour, water } = result.ingredients;

    expect(result.stage).toBe('two-stage');
    expect(result.preFerment.ingredients.flour).toBeCloseTo(flour * 0.25, 9);
    expect(result.preFerment.ingredients.water).toBeCloseTo(flour * 0.25, 9);
    expect(result.finalDough.ingredients.flour + result.preFerment.ingredients.flour).toBeCloseTo(flour, 9);
    expect(result.finalDough.ingredients.water + result.preFerment.ingredients.water).toBeCloseTo(water, 9);
  });

  test('the pre-ferment gets 0.1% of its own flour in yeast and the final dough gets the rest', () => {
    const state = { ...neapolitan, hydration: 0.65, usePreFerment: true, preFermentType: 'poolish', preFermentFlourPercent: 0.25 };
    const result = new DoughCalculator(state).calculate();
    const { yeast } = result.ingredients;
    const preFermentFlour = result.preFerment.ingredients.flour;

    expect(PREFERMENT_YEAST_PERCENT).toBe(0.001);
    expect(result.preFerment.ingredients.yeast).toBeCloseTo(preFermentFlour * PREFERMENT_YEAST_PERCENT, 9);
    expect(result.finalDough.ingredients.yeast).toBeCloseTo(yeast - preFermentFlour * PREFERMENT_YEAST_PERCENT, 9);
    expect(result.finalDough.ingredients.yeast).toBeGreaterThan(0);
    // The two stages together still hold exactly the recipe's yeast
    expect(result.preFerment.ingredients.yeast + result.finalDough.ingredients.yeast).toBeCloseTo(yeast, 9);
  });

  test('the pre-ferment yeast is converted for active dry along with the rest', () => {
    const state = { ...neapolitan, yeastType: 'activeDry', usePreFerment: true, preFermentType: 'poolish', preFermentFlourPercent: 0.25 };
    const result = new DoughCalculator(state).calculate();
    const preFermentFlour = result.preFerment.ingredients.flour;

    expect(result.preFerment.ingredients.yeast).toBeCloseTo(preFermentFlour * PREFERMENT_YEAST_PERCENT * ACTIVE_DRY_FACTOR, 9);
    expect(result.preFerment.ingredients.yeast + result.finalDough.ingredients.yeast).toBeCloseTo(result.ingredients.yeast, 9);
  });

  test('a recipe with less yeast than the pre-ferment wants leaves the final dough none, never a negative', () => {
    const state = { ...neapolitan, yeast: 0.0001, usePreFerment: true, preFermentFlourPercent: 0.5 };
    const result = new DoughCalculator(state).calculate();

    expect(result.preFerment.ingredients.yeast).toBeCloseTo(result.ingredients.yeast, 9);
    expect(result.finalDough.ingredients.yeast).toBe(0);
  });

  test('a recipe with no yeast puts none in either stage', () => {
    const result = new DoughCalculator({ ...neapolitan, yeast: 0, usePreFerment: true }).calculate();

    expect(result.preFerment.ingredients.yeast).toBe(0);
    expect(result.finalDough.ingredients.yeast).toBe(0);
  });

  test('a biga uses the fixed 55% hydration', () => {
    const state = { ...neapolitan, usePreFerment: true, preFermentType: 'biga', preFermentFlourPercent: 0.4 };
    const result = new DoughCalculator(state).calculate();

    expect(BIGA_HYDRATION).toBe(0.55);
    expect(result.preFerment.hydration).toBeCloseTo(55, 9);
    expect(result.preFerment.ingredients.water).toBeCloseTo(result.preFerment.ingredients.flour * 0.55, 9);
  });
});

test.describe('Engine: recipes that cannot be made', () => {
  const poolish = { ...neapolitan, usePreFerment: true, preFermentType: 'poolish' };

  test('45% hydration with half the flour in a poolish is rejected with an explanation', () => {
    const result = new DoughCalculator({ ...poolish, hydration: 0.45, preFermentFlourPercent: 0.5 }).calculate();

    expect(result.valid).toBe(false);
    expect(result.issue.code).toBe('preferment_water_exceeds_total');
    expect(result.issue.message).toContain('50%');
    expect(result.issue.message).toContain('45%');
    expect(result.issue.details.maxPreFermentFlourPercent).toBeCloseTo(45, 6);
    expect(result.issue.details.minHydrationPercent).toBeCloseTo(50, 6);
    expect(result).not.toHaveProperty('ingredients');
    expect(result).not.toHaveProperty('finalDough');
  });

  test('the limit itself is allowed and leaves no water for the final dough', () => {
    const result = new DoughCalculator({ ...poolish, hydration: 0.5, preFermentFlourPercent: 0.5 }).calculate();

    expect(result.valid).toBe(true);
    expect(result.finalDough.ingredients.water).toBe(0);
  });

  test('the humidity adjustment counts toward the limit', () => {
    const result = new DoughCalculator({ ...poolish, hydration: 0.5, preFermentFlourPercent: 0.5, humidityAdjust: true }).calculate();

    expect(result.valid).toBe(false);
    expect(result.issue.code).toBe('preferment_water_exceeds_total');
    expect(result.issue.message).toContain('after the humidity adjustment');
    expect(result.issue.details.minHydrationPercent).toBeCloseTo(52.5, 6);
  });

  test('a biga needs less water, so the same shares are allowed', () => {
    const result = new DoughCalculator({ ...poolish, preFermentType: 'biga', hydration: 0.45, preFermentFlourPercent: 0.5 }).calculate();

    expect(result.valid).toBe(true);
    expect(result.finalDough.ingredients.water).toBeGreaterThan(0);
  });

  test('a pre-ferment cannot use more than all of the flour', () => {
    const result = new DoughCalculator({ ...poolish, preFermentType: 'biga', hydration: 0.8, preFermentFlourPercent: 1.2 }).calculate();

    expect(result.valid).toBe(false);
    expect(result.issue.code).toBe('preferment_flour_exceeds_total');
    expect(result.issue.message).toContain('120%');
  });

  const invalidInputs: Array<[string, Record<string, unknown>]> = [
    ['zero dough balls', { numBalls: 0 }],
    ['a negative ball weight', { ballWeight: -250 }],
    ['negative salt', { salt: -0.01 }],
    ['hydration pushed below zero by the humidity adjustment', { hydration: 0.01, humidityAdjust: true }],
    ['a zero pre-ferment share', { usePreFerment: true, preFermentFlourPercent: 0 }],
  ];
  for (const [label, change] of invalidInputs) {
    test(`rejects ${label}`, () => {
      const result = new DoughCalculator({ ...neapolitan, ...change }).calculate();

      expect(result.valid).toBe(false);
      expect(result.issue.code).toBe('invalid_input');
    });
  }
});

test.describe('Units: weight formatting', () => {
  const cases: Array<[number, string, string]> = [
    [0.3, 'grams', '0.3g'],
    [1.82, 'grams', '1.8g'],
    [2, 'grams', '2.0g'],
    [9.96, 'grams', '10g'],
    [15.17, 'grams', '15g'],
    [606.796, 'grams', '607g'],
    [1000, 'grams', '1000g'],
    [0.04, 'grams', '<0.1g'],
    [0, 'grams', '0g'],
    [0.3, 'ounces', '0.01oz'],
    [1.82, 'ounces', '0.06oz'],
    [14.2, 'ounces', '0.50oz'],
    [28.3495, 'ounces', '1oz'],
    [606.796, 'ounces', '21.4oz'],
    [1000, 'ounces', '35.3oz'],
    [0.1, 'ounces', '<0.01oz'],
    [0, 'ounces', '0oz'],
  ];
  for (const [grams, unit, expected] of cases) {
    test(`${grams} g in ${unit} shows as ${expected}`, () => {
      expect(formatWeight(grams, unit)).toBe(expected);
    });
  }
});

test.describe('Recipe text uses the same rows as the screen', () => {
  const expectedYeast: Record<string, string> = {
    'instant grams': '1.8g',
    'activeDry grams': '2.3g',
    'instant ounces': '0.06oz',
    'activeDry ounces': '0.08oz',
  };
  for (const yeastType of ['instant', 'activeDry']) {
    for (const unit of ['grams', 'ounces']) {
      test(`yeast line for ${yeastType} in ${unit}`, () => {
        const state = { ...neapolitan, yeastType, unit };
        const result = new DoughCalculator(state).calculate();
        const view = buildRecipeView(result, state);
        const yeastRow = view.rows.find((row: { key: string }) => row.key === 'yeast');

        expect(yeastRow.label).toBe(yeastType === 'activeDry' ? 'Active Dry Yeast' : 'Instant Yeast');
        expect(yeastRow.amount).toBe(expectedYeast[`${yeastType} ${unit}`]);
        expect(generateRecipeText(result, state, 'Neapolitan')).toContain(`${yeastRow.label}: ${yeastRow.amount} (${yeastRow.percent})`);
      });
    }
  }

  test('a two-stage recipe names the pre-ferment and puts the converted yeast in it', () => {
    const state = { ...neapolitan, yeastType: 'activeDry', usePreFerment: true, preFermentType: 'biga', preFermentFlourPercent: 0.3 };
    const result = new DoughCalculator(state).calculate();
    const text = generateRecipeText(result, state, 'Neapolitan');

    expect(text).toContain('STAGE 1: BIGA (NIGHT BEFORE)');
    expect(text).toContain(`Active Dry Yeast: ${formatWeight(result.preFerment.ingredients.yeast, 'grams')}`);
    expect(text).toContain('Biga (from above): All of it');
    expect(text).not.toContain('(remaining): 0');
  });

  test('an invalid recipe produces no text', () => {
    const state = { ...neapolitan, hydration: 0.45, usePreFerment: true, preFermentFlourPercent: 0.5 };
    expect(generateRecipeText(new DoughCalculator(state).calculate(), state, 'Neapolitan')).toBe('');
  });
});

test.describe('Share URLs', () => {
  const origin = 'https://thepizzadoughformula.com'; // encodeRecipe's origin outside a browser
  const saved = {
    ...DEFAULT_RECIPE_STATE,
    style: 'poolishBiga',
    numBalls: 3,
    ballWeight: 275,
    hydration: 0.625,
    salt: 0.0275,
    yeast: 0.0015,
    yeastType: 'activeDry',
    oil: 0,
    sugar: 0,
    usePreFerment: true,
    preFermentType: 'biga',
    preFermentFlourPercent: 0.4,
    humidityAdjust: false,
  };

  function expectSameRecipe(decoded: Record<string, unknown>, state: Record<string, unknown>) {
    for (const key of ['style', 'numBalls', 'ballWeight', 'yeastType', 'usePreFerment', 'humidityAdjust']) {
      expect(decoded[key], key).toBe(state[key]);
    }
    for (const key of ['hydration', 'salt', 'yeast', 'oil', 'sugar']) {
      expect(decoded[key] as number, key).toBeCloseTo(state[key] as number, 12);
    }
    if (state.usePreFerment) {
      expect(decoded.preFermentType).toBe(state.preFermentType);
      expect(decoded.preFermentFlourPercent as number).toBeCloseTo(state.preFermentFlourPercent as number, 12);
    }
  }

  test('the current format writes every value, including zeros and switched-off options', () => {
    expect(encodeRecipe({ ...saved, usePreFerment: false })).toBe(
      `${origin}/?v=2&s=poolishBiga&n=3&w=275&h=62.5&sa=2.75&y=0.15&yt=activeDry&o=0&su=0&pf=0&ha=0`
    );
    expect(encodeRecipe(saved)).toContain('&pf=1&pft=biga&pfp=40&ha=0');
  });

  test('a saved recipe survives a round trip, including fractional percentages and yeast type', () => {
    const decoded = decodeRecipe(encodeRecipe(saved));

    expect(decoded.savedRecipe).toBe(true);
    expect(decoded.hydration).toBe(0.625);
    expectSameRecipe(decoded, saved);
  });

  test('zeros and a switched-off pre-ferment survive a round trip for a pre-ferment style', () => {
    const state = { ...saved, usePreFerment: false, oil: 0, sugar: 0, humidityAdjust: false };
    const decoded = decodeRecipe(encodeRecipe(state));

    expect(decoded).toMatchObject({ usePreFerment: false, humidityAdjust: false, oil: 0, sugar: 0 });
    expectSameRecipe(decoded, state);
  });

  test('a style link carries only the style', () => {
    expect(decodeRecipe(`${origin}/?s=newYork`)).toEqual({ style: 'newYork', savedRecipe: false });
  });

  test('values that cannot be read are left out', () => {
    const decoded = decodeRecipe(`${origin}/?v=2&s=newYork&n=2&w=300&h=abc&sa=&y=0.4&yt=fresh&o=0&su=0&pf=1&pft=sourdough&pfp=30&ha=maybe`);

    expect(decoded).not.toHaveProperty('hydration');
    expect(decoded).not.toHaveProperty('salt');
    expect(decoded).not.toHaveProperty('yeastType');
    expect(decoded).not.toHaveProperty('preFermentType');
    expect(decoded).not.toHaveProperty('humidityAdjust');
    expect(decoded).toMatchObject({ numBalls: 2, usePreFerment: true, preFermentFlourPercent: 0.3 });
  });

  test.describe('links made before format 2', () => {
    test('scaled values are read as before', () => {
      const decoded = decodeRecipe(`${origin}/?s=newYork&n=3&w=275&h=70&sa=28&y=4&o=3&su=2`);

      expect(decoded).toMatchObject({ style: 'newYork', savedRecipe: true, numBalls: 3, ballWeight: 275, usePreFerment: false, humidityAdjust: false });
      expect(decoded.hydration).toBeCloseTo(0.7, 12);
      expect(decoded.salt).toBeCloseTo(0.028, 12);
      expect(decoded.yeast).toBeCloseTo(0.004, 12);
      expect(decoded.oil).toBeCloseTo(0.03, 12);
      expect(decoded.sugar).toBeCloseTo(0.02, 12);
      expect(decoded).not.toHaveProperty('yeastType');
    });

    test('missing oil, sugar and switches mean zero and off', () => {
      const decoded = decodeRecipe(`${origin}/?s=poolishBiga&n=4&w=260&h=65&sa=25&y=2`);

      expect(decoded).toMatchObject({ oil: 0, sugar: 0, usePreFerment: false, humidityAdjust: false });
    });

    test('pre-ferment and humidity switches are read', () => {
      const decoded = decodeRecipe(`${origin}/?s=neapolitan&n=4&w=250&h=65&sa=20&y=3&pf=1&pft=biga&pfp=40&ha=1`);

      expect(decoded).toMatchObject({ usePreFerment: true, preFermentType: 'biga', humidityAdjust: true });
      expect(decoded.preFermentFlourPercent).toBeCloseTo(0.4, 12);
    });

    test('a pre-ferment without a type is a poolish', () => {
      expect(decodeRecipe(`${origin}/?s=neapolitan&n=4&w=250&h=65&sa=20&y=3&pf=1&pfp=25`)).toMatchObject({ preFermentType: 'poolish' });
    });

    test('the retired flour type parameter is ignored', () => {
      const decoded = decodeRecipe(`${origin}/?s=newYork&n=2&w=300&h=65&sa=20&y=4&ft=bread`);

      expect(decoded).not.toHaveProperty('flourType');
      expect(decoded).toMatchObject({ numBalls: 2, ballWeight: 300 });
    });

    test('an earlier link re-encodes to the current format with the same recipe', () => {
      const decoded = decodeRecipe(`${origin}/?s=newYork&n=3&w=275&h=70&sa=28&y=4&o=3&su=2`);
      const state = { ...DEFAULT_RECIPE_STATE, ...decoded };

      expect(encodeRecipe(state)).toBe(`${origin}/?v=2&s=newYork&n=3&w=275&h=70&sa=2.8&y=0.4&yt=instant&o=3&su=2&pf=0&ha=0`);
    });
  });
});

test.describe('Presets', () => {
  /**
   * The calculator opens at the default size's weight (step 2a), so a preset whose defaults.ballWeight
   * disagrees with that weight shows one number on screen and another in the page's recipe markup.
   */
  for (const [id, preset] of Object.entries(PIZZA_STYLES)) {
    test(`${id}: the default ball weight matches the default size`, () => {
      const defaultSize = preset.sizes.options.find((size: { id: string }) => size.id === preset.sizes.defaultSize);

      expect(defaultSize, `${id} has no option matching defaultSize "${preset.sizes.defaultSize}"`).toBeDefined();
      expect(defaultSize!.weight).toBe(preset.defaults.ballWeight);
      expect(getWeightForSize(id, preset.sizes.defaultSize)).toBe(preset.defaults.ballWeight);
    });
  }
});

test.describe('Worked example on the Poolish/Biga page', () => {
  /**
   * The figures printed in the page's worked example (docs/content/poolish-biga-page-draft.md) are the
   * calculator's own output for this style's defaults at 4 balls. If either moves, they disagree.
   */
  const defaults = { ...DEFAULT_RECIPE_STATE, ...PIZZA_STYLES.poolishBiga.defaults, numBalls: 4, usePreFerment: true, preFermentFlourPercent: 0.25 };
  const shown = (grams: number) => formatWeight(grams, 'grams');

  test('the preset still has the defaults the worked example was written for', () => {
    expect(defaults).toMatchObject({ ballWeight: 260, hydration: 0.65, salt: 0.025, yeast: 0.002 });
  });

  test('the totals match the figures on the page', () => {
    const result = new DoughCalculator(defaults).calculate();

    expect([
      shown(result.ingredients.flour),
      shown(result.ingredients.water),
      shown(result.ingredients.salt),
      shown(result.ingredients.yeast),
    ]).toEqual(['620g', '403g', '16g', '1.2g']);
  });

  test('the poolish stages match the figures on the page', () => {
    const result = new DoughCalculator({ ...defaults, preFermentType: 'poolish' }).calculate();
    const pre = result.preFerment.ingredients;
    const final = result.finalDough.ingredients;

    expect([shown(pre.flour), shown(pre.water), shown(pre.yeast)]).toEqual(['155g', '155g', '0.2g']);
    expect([shown(final.flour), shown(final.water), shown(final.salt), shown(final.yeast)]).toEqual(['465g', '248g', '16g', '1.1g']);
  });

  test('the biga stages match the figures on the page', () => {
    const result = new DoughCalculator({ ...defaults, preFermentType: 'biga' }).calculate();
    const pre = result.preFerment.ingredients;
    const final = result.finalDough.ingredients;

    expect([shown(pre.flour), shown(pre.water), shown(pre.yeast)]).toEqual(['155g', '85g', '0.2g']);
    expect([shown(final.flour), shown(final.water), shown(final.salt), shown(final.yeast)]).toEqual(['465g', '318g', '16g', '1.1g']);
  });
});
