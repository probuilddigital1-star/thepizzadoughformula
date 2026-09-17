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
 * Display precision per unit: quantities below `smallBelow` get `smallDecimals`, larger ones
 * `largeDecimals` (large quantities keep the display they have always had).
 */
const PRECISION = {
  grams: { smallBelow: 10, smallDecimals: 1, largeDecimals: 0 },
  ounces: { smallBelow: 1, smallDecimals: 2, largeDecimals: 1 }
};

const roundTo = (value, decimals) => Math.round(value * 10 ** decimals) / 10 ** decimals;

/**
 * Convert weight from grams to specified unit (unrounded)
 * @param {number} grams - Weight in grams
 * @param {'grams'|'ounces'} unit - Target unit
 * @returns {number} Converted weight
 */
export function convertWeight(grams, unit = 'grams') {
  const unitDef = UNITS[unit];
  return unitDef ? unitDef.convert(grams) : grams;
}

/**
 * Format a weight for display. The screen, the copied recipe text and the print output all use this.
 * Grams: one decimal below 10 g (0.3g, 2.0g), whole grams from 10 g up (250g).
 * Ounces: two decimals below 1 oz (0.01oz), one decimal from 1 oz up (21.4oz).
 * A positive amount too small for the smallest step shows as "<0.1g" or "<0.01oz".
 * @param {number} grams - Weight in grams
 * @param {'grams'|'ounces'} unit - Target unit
 * @returns {string} Formatted weight string
 */
export function formatWeight(grams, unit = 'grams') {
  const unitId = UNITS[unit] ? unit : 'grams';
  const { abbrev, convert } = UNITS[unitId];
  const { smallBelow, smallDecimals, largeDecimals } = PRECISION[unitId];
  const value = convert(grams);

  if (value === 0) return `0${abbrev}`;

  const small = roundTo(value, smallDecimals);
  if (Math.abs(small) < smallBelow) {
    if (small === 0) return `<${(10 ** -smallDecimals).toFixed(smallDecimals)}${abbrev}`;
    return `${small.toFixed(smallDecimals)}${abbrev}`;
  }
  return `${roundTo(value, largeDecimals)}${abbrev}`;
}

/**
 * Get stored unit preference from localStorage
 * @returns {'grams'|'ounces'} Unit preference
 */
export function getStoredUnit() {
  if (typeof localStorage === 'undefined') return 'grams';
  const stored = localStorage.getItem('preferredUnit');
  return stored === 'ounces' ? 'ounces' : 'grams';
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
  getStoredUnit,
  setStoredUnit,
  toggleUnit
};
