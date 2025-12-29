/**
 * Pizza Dough Calculator Engine
 * Uses Baker's Percentages for all calculations
 *
 * Baker's Percentage: All ingredients are expressed as a percentage of the flour weight.
 * Flour is always 100%, other ingredients are relative to flour.
 *
 * Formula:
 * flourWeight = totalDoughWeight / (1 + hydration + salt + yeast + oil + sugar)
 *
 * @module calculator/engine
 */

/**
 * @typedef {Object} RecipeIngredients
 * @property {number} flour - Flour weight in grams
 * @property {number} water - Water weight in grams
 * @property {number} salt - Salt weight in grams
 * @property {number} yeast - Yeast weight in grams
 * @property {number} oil - Oil weight in grams
 * @property {number} sugar - Sugar weight in grams
 */

/**
 * @typedef {Object} PreFermentResult
 * @property {'poolish'|'biga'} type - Type of pre-ferment
 * @property {RecipeIngredients} ingredients - Pre-ferment ingredients
 * @property {number} hydration - Pre-ferment hydration percentage
 */

/**
 * @typedef {Object} SingleStageResult
 * @property {'single'} stage - Recipe stage type
 * @property {RecipeIngredients} ingredients - All ingredients
 * @property {number} totalWeight - Total dough weight in grams
 * @property {Object} percentages - Baker's percentages used
 */

/**
 * @typedef {Object} TwoStageResult
 * @property {'two-stage'} stage - Recipe stage type
 * @property {PreFermentResult} preFerment - Pre-ferment recipe
 * @property {Object} finalDough - Final dough ingredients
 * @property {number} totalWeight - Total dough weight in grams
 * @property {Object} percentages - Baker's percentages used
 */

/**
 * Main calculator class for pizza dough recipes
 */
export class DoughCalculator {
  /**
   * Create a new DoughCalculator instance
   * @param {Object} options - Calculator options
   */
  constructor(options = {}) {
    // Basic inputs
    this.numBalls = options.numBalls ?? 4;
    this.ballWeight = options.ballWeight ?? 250;

    // Baker's percentages (as decimals, e.g., 0.65 = 65%)
    this.hydration = options.hydration ?? 0.65;
    this.salt = options.salt ?? 0.02;
    this.yeast = options.yeast ?? 0.003;
    this.oil = options.oil ?? 0;
    this.sugar = options.sugar ?? 0;

    // Adjustments
    this.humidityAdjust = options.humidityAdjust ?? false;

    // Pre-ferment settings
    this.usePreFerment = options.usePreFerment ?? false;
    this.preFermentType = options.preFermentType ?? 'poolish';
    this.preFermentFlourPercent = options.preFermentFlourPercent ?? 0.25;
    this.bigaHydration = options.bigaHydration ?? 0.55;
  }

  /**
   * Get total dough weight needed
   * @returns {number} Total dough weight in grams
   */
  get totalDoughWeight() {
    return this.numBalls * this.ballWeight;
  }

  /**
   * Get effective hydration after humidity adjustment
   * Reduces hydration by 2.5% in humid conditions
   * @returns {number} Effective hydration as decimal
   */
  get effectiveHydration() {
    return this.humidityAdjust ? this.hydration - 0.025 : this.hydration;
  }

  /**
   * Calculate flour weight using baker's percentage formula
   * flourWeight = totalDoughWeight / (1 + sum of all percentages)
   * @returns {number} Flour weight in grams
   */
  get flourWeight() {
    const totalPercentage = 1 +
      this.effectiveHydration +
      this.salt +
      this.yeast +
      this.oil +
      this.sugar;
    return this.totalDoughWeight / totalPercentage;
  }

  /**
   * Calculate water weight
   * @returns {number} Water weight in grams
   */
  get waterWeight() {
    return this.flourWeight * this.effectiveHydration;
  }

  /**
   * Calculate the complete recipe
   * @returns {SingleStageResult|TwoStageResult} Calculated recipe
   */
  calculate() {
    const flour = this.flourWeight;
    const water = this.waterWeight;
    const salt = flour * this.salt;
    const yeast = flour * this.yeast;
    const oil = flour * this.oil;
    const sugar = flour * this.sugar;

    const percentages = {
      hydration: this.effectiveHydration * 100,
      salt: this.salt * 100,
      yeast: this.yeast * 100,
      oil: this.oil * 100,
      sugar: this.sugar * 100
    };

    if (!this.usePreFerment) {
      return {
        stage: 'single',
        ingredients: {
          flour: this.round(flour),
          water: this.round(water),
          salt: this.round(salt, 1),
          yeast: this.round(yeast, 1),
          oil: this.round(oil),
          sugar: this.round(sugar)
        },
        totalWeight: this.round(this.totalDoughWeight),
        percentages
      };
    }

    return this.calculateWithPreFerment(flour, water, salt, yeast, oil, sugar, percentages);
  }

  /**
   * Calculate two-stage recipe with pre-ferment
   * Traditional method: ALL yeast goes in the pre-ferment, none in final dough.
   * The long fermentation (12-16 hours) allows yeast to multiply and develop flavor.
   * @private
   */
  calculateWithPreFerment(totalFlour, totalWater, salt, yeast, oil, sugar, percentages) {
    // Calculate pre-ferment flour amount
    const preFermentFlour = totalFlour * this.preFermentFlourPercent;

    // Poolish is 100% hydration, Biga is typically 50-60%
    const preFermentHydration = this.preFermentType === 'poolish' ? 1.0 : this.bigaHydration;
    const preFermentWater = preFermentFlour * preFermentHydration;

    // Traditional method: ALL yeast goes in the pre-ferment
    // The long fermentation allows yeast to multiply - no additional yeast needed in final dough
    const preFermentYeast = yeast;

    // Final dough = total - pre-ferment (no additional yeast)
    const finalFlour = totalFlour - preFermentFlour;
    const finalWater = totalWater - preFermentWater;

    return {
      stage: 'two-stage',
      preFerment: {
        type: this.preFermentType,
        ingredients: {
          flour: this.round(preFermentFlour),
          water: this.round(preFermentWater),
          yeast: this.round(preFermentYeast, 1)
        },
        hydration: preFermentHydration * 100,
        flourPercent: this.preFermentFlourPercent * 100
      },
      finalDough: {
        ingredients: {
          preFerment: 'all',
          flour: this.round(finalFlour),
          water: this.round(finalWater),
          salt: this.round(salt, 1),
          yeast: 0, // Traditional: no additional yeast in final dough
          oil: this.round(oil),
          sugar: this.round(sugar)
        }
      },
      totalWeight: this.round(this.totalDoughWeight),
      percentages
    };
  }

  /**
   * Round a number to specified decimal places
   * @param {number} value - Value to round
   * @param {number} [decimals=0] - Decimal places
   * @returns {number} Rounded value
   */
  round(value, decimals = 0) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Update calculator with new options and recalculate
   * @param {Object} options - New options to merge
   * @returns {SingleStageResult|TwoStageResult} New calculation result
   */
  update(options) {
    Object.assign(this, options);
    return this.calculate();
  }

  /**
   * Create a calculator instance from URL parameters
   * @param {URLSearchParams} params - URL search params
   * @returns {DoughCalculator} New calculator instance
   */
  static fromURLParams(params) {
    return new DoughCalculator({
      numBalls: parseInt(params.get('n')) || undefined,
      ballWeight: parseInt(params.get('w')) || undefined,
      hydration: params.has('h') ? parseInt(params.get('h')) / 100 : undefined,
      salt: params.has('sa') ? parseInt(params.get('sa')) / 1000 : undefined,
      yeast: params.has('y') ? parseInt(params.get('y')) / 1000 : undefined,
      oil: params.has('o') ? parseInt(params.get('o')) / 100 : undefined,
      sugar: params.has('su') ? parseInt(params.get('su')) / 100 : undefined,
      usePreFerment: params.get('pf') === '1',
      preFermentType: params.get('pft') || undefined,
      preFermentFlourPercent: params.has('pfp') ? parseInt(params.get('pfp')) / 100 : undefined,
      humidityAdjust: params.get('ha') === '1'
    });
  }

  /**
   * Export current settings to URL parameters
   * @returns {URLSearchParams} URL search params
   */
  toURLParams() {
    const params = new URLSearchParams();

    params.set('n', this.numBalls.toString());
    params.set('w', this.ballWeight.toString());
    params.set('h', Math.round(this.hydration * 100).toString());
    params.set('sa', Math.round(this.salt * 1000).toString());
    params.set('y', Math.round(this.yeast * 1000).toString());

    if (this.oil > 0) params.set('o', Math.round(this.oil * 100).toString());
    if (this.sugar > 0) params.set('su', Math.round(this.sugar * 100).toString());

    if (this.usePreFerment) {
      params.set('pf', '1');
      params.set('pft', this.preFermentType);
      params.set('pfp', Math.round(this.preFermentFlourPercent * 100).toString());
    }

    if (this.humidityAdjust) params.set('ha', '1');

    return params;
  }
}

export default DoughCalculator;
