/**
 * Pizza Dough Calculator Engine
 * Uses baker's percentages for all calculations.
 *
 * Every ingredient is a percentage of the flour weight, and flour is 100%:
 * flourWeight = totalDoughWeight / (1 + hydration + salt + yeast + oil + sugar)
 * where yeast is the percentage of the yeast actually used (instant, or active dry after conversion).
 *
 * calculate() validates the inputs first and returns { valid: false, issue } for a recipe that cannot
 * be made, instead of negative quantities. Quantities are returned unrounded; format them for display
 * with formatWeight() in units.js.
 *
 * @module calculator/engine
 */

export const INSTANT_YEAST = 'instant';
export const ACTIVE_DRY_YEAST = 'activeDry';
export const YEAST_TYPES = [INSTANT_YEAST, ACTIVE_DRY_YEAST];
export const PREFERMENT_TYPES = ['poolish', 'biga'];

/** Active dry yeast is used at 1.25 times the instant yeast amount. */
export const ACTIVE_DRY_FACTOR = 1.25;

/** Poolish is made with equal weights of flour and water. */
export const POOLISH_HYDRATION = 1;

/**
 * Biga hydration is a fixed assumption: water equal to 55% of the biga's flour. There is no control for
 * it. If it becomes configurable, add it to DEFAULT_RECIPE_STATE and the share URL together
 * (docs/adr/0001-calculator-reliability-and-organic-growth.md, step 2b).
 */
export const BIGA_HYDRATION = 0.55;

/**
 * Instant yeast in the pre-ferment, as a fraction of the pre-ferment's own flour. A pre-ferment has
 * all night to work, so it needs very little: the guidance for a 12 to 16 hour ferment at about
 * 68°F is 0.1% of the pre-ferment flour, and more than that peaks and collapses before morning.
 * The rest of the recipe's yeast goes into the final dough.
 * Sources: Pizzablab, Poolish preferment guide (https://www.pizzablab.com/the-encyclopizza/poolish-preferment/)
 * and Weekend Bakery, poolish and biga tips
 * (https://www.weekendbakery.com/posts/more-artisan-bread-baking-tips-poolish-biga/).
 */
export const PREFERMENT_YEAST_PERCENT = 0.001;

/** The humidity adjustment lowers hydration by 2.5 percentage points. */
export const HUMIDITY_REDUCTION = 0.025;

/** Tolerance for comparing fractions. */
const EPSILON = 1e-9;

/**
 * Every calculator input, with the value used when an input is missing. Percentages are fractions
 * (0.65 = 65%). The yeast percentage is entered as instant yeast; yeastType decides the conversion.
 */
export const DEFAULT_RECIPE_STATE = Object.freeze({
  style: 'neapolitan',
  unit: 'grams',
  numBalls: 4,
  ballWeight: 250,
  hydration: 0.65,
  salt: 0.02,
  yeast: 0.003,
  yeastType: INSTANT_YEAST,
  oil: 0,
  sugar: 0,
  usePreFerment: false,
  preFermentType: 'poolish',
  preFermentFlourPercent: 0.25,
  humidityAdjust: false,
});

/** A fraction as a percentage for messages, with at most one decimal: 0.275 -> "27.5%". */
function percentLabel(fraction) {
  return `${Math.round(fraction * 1000) / 10}%`;
}

/** Rounded down to one decimal, for "at most" advice. */
function floorPercentLabel(fraction) {
  return `${Math.floor(fraction * 1000 + EPSILON) / 10}%`;
}

/** Rounded up to one decimal, for "at least" advice. */
function ceilPercentLabel(fraction) {
  return `${Math.ceil(fraction * 1000 - EPSILON) / 10}%`;
}

function invalid(code, message, details = {}) {
  return { valid: false, issue: { code, message, details } };
}

/** Removes floating-point dust around zero, such as -1e-13 grams of water. */
function cleanZero(value) {
  return Math.abs(value) < 1e-6 ? 0 : value;
}

/**
 * Main calculator class for pizza dough recipes
 */
export class DoughCalculator {
  /**
   * @param {Partial<typeof DEFAULT_RECIPE_STATE>} options - Recipe state; missing values use the defaults
   */
  constructor(options = {}) {
    const defaults = DEFAULT_RECIPE_STATE;

    // Basic inputs
    this.numBalls = options.numBalls ?? defaults.numBalls;
    this.ballWeight = options.ballWeight ?? defaults.ballWeight;

    // Baker's percentages (as fractions, e.g., 0.65 = 65%)
    this.hydration = options.hydration ?? defaults.hydration;
    this.salt = options.salt ?? defaults.salt;
    this.yeast = options.yeast ?? defaults.yeast;
    this.yeastType = YEAST_TYPES.includes(options.yeastType) ? options.yeastType : defaults.yeastType;
    this.oil = options.oil ?? defaults.oil;
    this.sugar = options.sugar ?? defaults.sugar;

    // Adjustments
    this.humidityAdjust = options.humidityAdjust ?? defaults.humidityAdjust;

    // Pre-ferment settings
    this.usePreFerment = options.usePreFerment ?? defaults.usePreFerment;
    this.preFermentType = PREFERMENT_TYPES.includes(options.preFermentType) ? options.preFermentType : defaults.preFermentType;
    this.preFermentFlourPercent = options.preFermentFlourPercent ?? defaults.preFermentFlourPercent;
  }

  /** Total dough weight in grams */
  get totalDoughWeight() {
    return this.numBalls * this.ballWeight;
  }

  /** Hydration after the humidity adjustment, as a fraction */
  get effectiveHydration() {
    return this.humidityAdjust ? this.hydration - HUMIDITY_REDUCTION : this.hydration;
  }

  /** Multiplier from the entered (instant) yeast percentage to the yeast actually used */
  get yeastFactor() {
    return this.yeastType === ACTIVE_DRY_YEAST ? ACTIVE_DRY_FACTOR : 1;
  }

  /** Percentage of the yeast actually used, as a fraction */
  get effectiveYeast() {
    return this.yeast * this.yeastFactor;
  }

  /** Water in the pre-ferment as a fraction of the pre-ferment's flour */
  get preFermentHydration() {
    return this.preFermentType === 'biga' ? BIGA_HYDRATION : POOLISH_HYDRATION;
  }

  /** Flour weight from the baker's percentage formula, in grams */
  get flourWeight() {
    const totalPercentage = 1 + this.effectiveHydration + this.salt + this.effectiveYeast + this.oil + this.sugar;
    return this.totalDoughWeight / totalPercentage;
  }

  /** Water weight in grams */
  get waterWeight() {
    return this.flourWeight * this.effectiveHydration;
  }

  /**
   * Check that the inputs describe a recipe that can be made.
   * @returns {{ valid: true } | { valid: false, issue: { code: string, message: string, details: object } }}
   */
  validate() {
    if (!Number.isFinite(this.numBalls) || this.numBalls < 1) {
      return invalid('invalid_input', 'Enter at least 1 dough ball.');
    }
    if (!Number.isFinite(this.ballWeight) || this.ballWeight <= 0) {
      return invalid('invalid_input', 'Enter a dough ball weight above 0.');
    }
    const percentages = [
      ['Hydration', this.hydration],
      ['Salt', this.salt],
      ['Yeast', this.yeast],
      ['Oil', this.oil],
      ['Sugar', this.sugar],
    ];
    for (const [label, value] of percentages) {
      if (!Number.isFinite(value) || value < 0) {
        return invalid('invalid_input', `${label} must be 0% or more.`);
      }
    }
    if (this.effectiveHydration < -EPSILON) {
      return invalid('invalid_input', 'The humidity adjustment would take hydration below 0%. Raise the hydration or turn the adjustment off.');
    }
    if (!this.usePreFerment) return { valid: true };

    const flourShare = this.preFermentFlourPercent;
    const typeName = this.preFermentType;
    if (!Number.isFinite(flourShare) || flourShare <= 0) {
      return invalid('invalid_input', 'Enter a pre-ferment flour share above 0%.');
    }
    if (flourShare > 1 + EPSILON) {
      return invalid(
        'preferment_flour_exceeds_total',
        `The ${typeName} is set to use ${percentLabel(flourShare)} of the flour, but a pre-ferment can use at most all of the recipe's flour (100%).`,
        { preFermentFlourPercent: flourShare * 100 }
      );
    }

    // Water the pre-ferment needs and water the whole recipe has, both as fractions of the total flour
    const neededWater = flourShare * this.preFermentHydration;
    const availableWater = this.effectiveHydration;
    if (neededWater > availableWater + EPSILON) {
      const maxShare = Math.min(1, availableWater / this.preFermentHydration);
      const minHydration = neededWater + (this.humidityAdjust ? HUMIDITY_REDUCTION : 0);
      const adjustmentNote = this.humidityAdjust ? ' after the humidity adjustment' : '';
      return invalid(
        'preferment_water_exceeds_total',
        `A ${typeName} made with ${percentLabel(flourShare)} of the flour needs water equal to ${percentLabel(neededWater)} of the flour weight, ` +
          `but the whole recipe only has ${percentLabel(availableWater)}${adjustmentNote}. ` +
          `Lower the pre-ferment flour to ${floorPercentLabel(maxShare)} or less, or raise the hydration to at least ${ceilPercentLabel(minHydration)}.`,
        {
          neededWaterPercent: neededWater * 100,
          availableWaterPercent: availableWater * 100,
          maxPreFermentFlourPercent: maxShare * 100,
          minHydrationPercent: minHydration * 100,
        }
      );
    }

    return { valid: true };
  }

  /**
   * Calculate the complete recipe. Invalid inputs return { valid: false, issue } and no quantities.
   */
  calculate() {
    const base = {
      stage: this.usePreFerment ? 'two-stage' : 'single',
      yeastType: this.yeastType,
      totalWeight: this.totalDoughWeight,
    };
    const validation = this.validate();
    if (!validation.valid) return { ...base, valid: false, issue: validation.issue };

    const flour = this.flourWeight;
    const ingredients = {
      flour,
      water: flour * this.effectiveHydration,
      salt: flour * this.salt,
      yeast: flour * this.effectiveYeast,
      oil: flour * this.oil,
      sugar: flour * this.sugar,
    };
    const percentages = {
      flour: 100,
      hydration: this.effectiveHydration * 100,
      salt: this.salt * 100,
      yeast: this.effectiveYeast * 100,
      oil: this.oil * 100,
      sugar: this.sugar * 100,
    };

    if (!this.usePreFerment) {
      return { ...base, valid: true, ingredients, percentages };
    }

    // The pre-ferment gets PREFERMENT_YEAST_PERCENT of its own flour and the final dough gets the
    // rest of the recipe's yeast. A recipe with less total yeast than that puts all of it in the
    // pre-ferment rather than leaving the final dough a negative amount.
    const preFermentFlour = flour * this.preFermentFlourPercent;
    const preFermentWater = preFermentFlour * this.preFermentHydration;
    const preFermentYeast = Math.min(preFermentFlour * PREFERMENT_YEAST_PERCENT * this.yeastFactor, ingredients.yeast);

    return {
      ...base,
      valid: true,
      ingredients,
      percentages,
      preFerment: {
        type: this.preFermentType,
        hydration: this.preFermentHydration * 100,
        flourPercent: this.preFermentFlourPercent * 100,
        ingredients: {
          flour: preFermentFlour,
          water: preFermentWater,
          yeast: preFermentYeast,
        },
      },
      finalDough: {
        ingredients: {
          flour: cleanZero(flour - preFermentFlour),
          water: cleanZero(ingredients.water - preFermentWater),
          salt: ingredients.salt,
          yeast: cleanZero(ingredients.yeast - preFermentYeast),
          oil: ingredients.oil,
          sugar: ingredients.sugar,
        },
      },
    };
  }

  /**
   * Update calculator with new options and recalculate
   * @param {Object} options - New options to merge
   */
  update(options) {
    Object.assign(this, options);
    return this.calculate();
  }
}

export default DoughCalculator;
