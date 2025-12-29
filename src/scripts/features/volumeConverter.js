/**
 * Volume to Weight Converter
 * Converts US volume measurements (cups) to weight (grams)
 *
 * @module features/volumeConverter
 */

/**
 * Volume conversion data for common pizza dough ingredients
 * Values are grams per US cup
 */
export const VOLUME_CONVERSIONS = {
  allPurposeFlour: {
    id: 'allPurposeFlour',
    name: 'All-Purpose Flour',
    gramsPerCup: 125,
    commonMeasures: {
      '1/4': 31,
      '1/3': 42,
      '1/2': 63,
      '2/3': 83,
      '3/4': 94,
      '1': 125
    }
  },
  breadFlour: {
    id: 'breadFlour',
    name: 'Bread Flour',
    gramsPerCup: 127,
    commonMeasures: {
      '1/4': 32,
      '1/3': 42,
      '1/2': 64,
      '2/3': 85,
      '3/4': 95,
      '1': 127
    }
  },
  '00Flour': {
    id: '00Flour',
    name: '00 Flour',
    gramsPerCup: 115,
    commonMeasures: {
      '1/4': 29,
      '1/3': 38,
      '1/2': 58,
      '2/3': 77,
      '3/4': 86,
      '1': 115
    }
  },
  wholeWheatFlour: {
    id: 'wholeWheatFlour',
    name: 'Whole Wheat Flour',
    gramsPerCup: 120,
    commonMeasures: {
      '1/4': 30,
      '1/3': 40,
      '1/2': 60,
      '2/3': 80,
      '3/4': 90,
      '1': 120
    }
  },
  semolinaFlour: {
    id: 'semolinaFlour',
    name: 'Semolina Flour',
    gramsPerCup: 167,
    commonMeasures: {
      '1/4': 42,
      '1/3': 56,
      '1/2': 84,
      '2/3': 111,
      '3/4': 125,
      '1': 167
    }
  },
  water: {
    id: 'water',
    name: 'Water',
    gramsPerCup: 237,
    commonMeasures: {
      '1/4': 59,
      '1/3': 79,
      '1/2': 119,
      '2/3': 158,
      '3/4': 178,
      '1': 237
    }
  },
  sugar: {
    id: 'sugar',
    name: 'Granulated Sugar',
    gramsPerCup: 200,
    commonMeasures: {
      '1/4': 50,
      '1/3': 67,
      '1/2': 100,
      '2/3': 133,
      '3/4': 150,
      '1': 200
    }
  },
  tableSalt: {
    id: 'tableSalt',
    name: 'Table Salt',
    gramsPerCup: 273,
    gramsPerTsp: 6,
    gramsPerTbsp: 18,
    commonMeasures: {
      '1 tsp': 6,
      '2 tsp': 12,
      '1 tbsp': 18,
      '2 tbsp': 36
    }
  },
  kosherSalt: {
    id: 'kosherSalt',
    name: 'Kosher Salt (Diamond Crystal)',
    gramsPerCup: 160,
    gramsPerTsp: 3,
    gramsPerTbsp: 9,
    commonMeasures: {
      '1 tsp': 3,
      '2 tsp': 6,
      '1 tbsp': 9,
      '2 tbsp': 18
    }
  },
  oliveOil: {
    id: 'oliveOil',
    name: 'Olive Oil',
    gramsPerCup: 216,
    gramsPerTbsp: 14,
    commonMeasures: {
      '1 tbsp': 14,
      '2 tbsp': 28,
      '1/4': 54,
      '1/2': 108
    }
  },
  instantYeast: {
    id: 'instantYeast',
    name: 'Instant Yeast',
    gramsPerTsp: 3,
    commonMeasures: {
      '1/4 tsp': 0.75,
      '1/2 tsp': 1.5,
      '1 tsp': 3,
      '2 tsp': 6
    }
  },
  activeYeast: {
    id: 'activeYeast',
    name: 'Active Dry Yeast',
    gramsPerTsp: 4,
    commonMeasures: {
      '1/4 tsp': 1,
      '1/2 tsp': 2,
      '1 tsp': 4,
      '2 tsp': 8
    }
  }
};

/**
 * Common fraction values for conversion
 */
export const FRACTIONS = {
  '1/4': 0.25,
  '1/3': 0.333,
  '1/2': 0.5,
  '2/3': 0.667,
  '3/4': 0.75,
  '1': 1,
  '1 1/4': 1.25,
  '1 1/2': 1.5,
  '2': 2,
  '3': 3
};

/**
 * Convert cups to grams
 * @param {number} cups - Amount in cups (can be decimal)
 * @param {string} ingredientId - Ingredient ID from VOLUME_CONVERSIONS
 * @returns {number|null} Weight in grams or null if ingredient not found
 */
export function cupsToGrams(cups, ingredientId) {
  const ingredient = VOLUME_CONVERSIONS[ingredientId];
  if (!ingredient || !ingredient.gramsPerCup) return null;
  return Math.round(cups * ingredient.gramsPerCup);
}

/**
 * Convert tablespoons to grams
 * @param {number} tbsp - Amount in tablespoons
 * @param {string} ingredientId - Ingredient ID
 * @returns {number|null} Weight in grams or null if not applicable
 */
export function tbspToGrams(tbsp, ingredientId) {
  const ingredient = VOLUME_CONVERSIONS[ingredientId];
  if (!ingredient) return null;

  if (ingredient.gramsPerTbsp) {
    return Math.round(tbsp * ingredient.gramsPerTbsp * 10) / 10;
  }

  // Fall back to cup conversion (16 tbsp = 1 cup)
  if (ingredient.gramsPerCup) {
    return Math.round(((tbsp / 16) * ingredient.gramsPerCup) * 10) / 10;
  }

  return null;
}

/**
 * Convert teaspoons to grams
 * @param {number} tsp - Amount in teaspoons
 * @param {string} ingredientId - Ingredient ID
 * @returns {number|null} Weight in grams or null if not applicable
 */
export function tspToGrams(tsp, ingredientId) {
  const ingredient = VOLUME_CONVERSIONS[ingredientId];
  if (!ingredient) return null;

  if (ingredient.gramsPerTsp) {
    return Math.round(tsp * ingredient.gramsPerTsp * 10) / 10;
  }

  // Fall back to cup conversion (48 tsp = 1 cup)
  if (ingredient.gramsPerCup) {
    return Math.round(((tsp / 48) * ingredient.gramsPerCup) * 10) / 10;
  }

  return null;
}

/**
 * Get all ingredients as an array
 * @returns {Object[]} Array of ingredient objects
 */
export function getAllIngredients() {
  return Object.values(VOLUME_CONVERSIONS);
}

/**
 * Get ingredient by ID
 * @param {string} id - Ingredient ID
 * @returns {Object|undefined} Ingredient object or undefined
 */
export function getIngredientById(id) {
  return VOLUME_CONVERSIONS[id];
}

export default {
  VOLUME_CONVERSIONS,
  FRACTIONS,
  cupsToGrams,
  tbspToGrams,
  tspToGrams,
  getAllIngredients,
  getIngredientById
};
