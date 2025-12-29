/**
 * Unit Conversion Utilities
 * Handles grams to ounces conversion and formatting
 *
 * @module calculator/units
 */

/**
 * Conversion constants
 */
const GRAMS_PER_OUNCE = 28.3495;

/**
 * Unit definitions
 */
export const UNITS = {
  grams: {
    id: 'grams',
    name: 'Grams',
    abbrev: 'g',
    convert: (grams) => grams
  },
  ounces: {
    id: 'ounces',
    name: 'Ounces',
    abbrev: 'oz',
    convert: (grams) => grams / GRAMS_PER_OUNCE
  }
};

/**
 * Convert weight from grams to specified unit
 * @param {number} grams - Weight in grams
 * @param {'grams'|'ounces'} unit - Target unit
 * @returns {number} Converted weight
 */
export function convertWeight(grams, unit = 'grams') {
  const unitDef = UNITS[unit];
  if (!unitDef) return grams;

  const converted = unitDef.convert(grams);

  // Round appropriately based on unit
  if (unit === 'ounces') {
    // Round to 1 decimal place for ounces
    return Math.round(converted * 10) / 10;
  }
  // Round to nearest whole number for grams
  return Math.round(converted);
}

/**
 * Format weight with unit abbreviation
 * @param {number} grams - Weight in grams
 * @param {'grams'|'ounces'} unit - Target unit
 * @returns {string} Formatted weight string
 */
export function formatWeight(grams, unit = 'grams') {
  const converted = convertWeight(grams, unit);
  const unitDef = UNITS[unit];
  return `${converted}${unitDef.abbrev}`;
}

/**
 * Format weight with proper decimal handling
 * Small amounts (< 10g) get 1 decimal place
 * @param {number} grams - Weight in grams
 * @param {'grams'|'ounces'} unit - Target unit
 * @returns {string} Formatted weight string
 */
export function formatWeightPrecise(grams, unit = 'grams') {
  const unitDef = UNITS[unit];
  let converted = unitDef.convert(grams);

  // For small amounts, show 1 decimal place
  if (grams < 10) {
    converted = Math.round(converted * 10) / 10;
  } else {
    converted = Math.round(converted);
  }

  return `${converted}${unitDef.abbrev}`;
}

/**
 * Get stored unit preference from localStorage
 * @returns {'grams'|'ounces'} Unit preference
 */
export function getStoredUnit() {
  if (typeof localStorage === 'undefined') return 'grams';
  return localStorage.getItem('preferredUnit') || 'grams';
}

/**
 * Store unit preference to localStorage
 * @param {'grams'|'ounces'} unit - Unit to store
 */
export function setStoredUnit(unit) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('preferredUnit', unit);
}

/**
 * Toggle between grams and ounces
 * @param {'grams'|'ounces'} currentUnit - Current unit
 * @returns {'grams'|'ounces'} New unit
 */
export function toggleUnit(currentUnit) {
  return currentUnit === 'grams' ? 'ounces' : 'grams';
}

export default {
  UNITS,
  convertWeight,
  formatWeight,
  formatWeightPrecise,
  getStoredUnit,
  setStoredUnit,
  toggleUnit
};
