/**
 * Share Recipe URL
 * Generates and parses shareable recipe URLs
 *
 * @module features/shareRecipe
 */

/**
 * Parameter mappings for URL encoding
 * Uses short keys to keep URLs compact
 */
const PARAM_MAP = {
  style: 's',
  numBalls: 'n',
  ballWeight: 'w',
  hydration: 'h',
  salt: 'sa',
  yeast: 'y',
  oil: 'o',
  sugar: 'su',
  usePreFerment: 'pf',
  preFermentType: 'pft',
  preFermentFlourPercent: 'pfp',
  humidityAdjust: 'ha',
  flourType: 'ft'
};

/**
 * Encode recipe settings into URL parameters
 * @param {Object} recipe - Recipe settings object
 * @returns {string} URL with encoded parameters
 */
export function encodeRecipe(recipe) {
  const params = new URLSearchParams();

  // Style
  if (recipe.style) {
    params.set(PARAM_MAP.style, recipe.style);
  }

  // Basic inputs
  params.set(PARAM_MAP.numBalls, recipe.numBalls.toString());
  params.set(PARAM_MAP.ballWeight, recipe.ballWeight.toString());

  // Percentages (stored as integers for compactness)
  // Hydration: 65% -> 65
  params.set(PARAM_MAP.hydration, Math.round(recipe.hydration * 100).toString());

  // Salt, yeast: 2% -> 20 (stored as 0.1% units)
  params.set(PARAM_MAP.salt, Math.round(recipe.salt * 1000).toString());
  params.set(PARAM_MAP.yeast, Math.round(recipe.yeast * 1000).toString());

  // Oil and sugar: only include if non-zero
  if (recipe.oil > 0) {
    params.set(PARAM_MAP.oil, Math.round(recipe.oil * 100).toString());
  }
  if (recipe.sugar > 0) {
    params.set(PARAM_MAP.sugar, Math.round(recipe.sugar * 100).toString());
  }

  // Pre-ferment settings
  if (recipe.usePreFerment) {
    params.set(PARAM_MAP.usePreFerment, '1');
    params.set(PARAM_MAP.preFermentType, recipe.preFermentType || 'poolish');
    params.set(PARAM_MAP.preFermentFlourPercent, Math.round(recipe.preFermentFlourPercent * 100).toString());
  }

  // Humidity adjustment
  if (recipe.humidityAdjust) {
    params.set(PARAM_MAP.humidityAdjust, '1');
  }

  // Flour type
  if (recipe.flourType) {
    params.set(PARAM_MAP.flourType, recipe.flourType);
  }

  // Build URL
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://thepizzadoughformula.com';

  return `${baseUrl}/?${params.toString()}`;
}

/**
 * Decode URL parameters into recipe settings
 * @param {string|URLSearchParams} input - URL string or URLSearchParams object
 * @returns {Object} Recipe settings object
 */
export function decodeRecipe(input) {
  let params;

  if (typeof input === 'string') {
    try {
      const url = new URL(input);
      params = url.searchParams;
    } catch {
      params = new URLSearchParams(input);
    }
  } else if (input instanceof URLSearchParams) {
    params = input;
  } else {
    return null;
  }

  const recipe = {};

  // Style
  const style = params.get(PARAM_MAP.style);
  if (style) recipe.style = style;

  // Basic inputs
  const numBalls = params.get(PARAM_MAP.numBalls);
  if (numBalls) recipe.numBalls = parseInt(numBalls, 10);

  const ballWeight = params.get(PARAM_MAP.ballWeight);
  if (ballWeight) recipe.ballWeight = parseInt(ballWeight, 10);

  // Hydration
  const hydration = params.get(PARAM_MAP.hydration);
  if (hydration) recipe.hydration = parseInt(hydration, 10) / 100;

  // Salt
  const salt = params.get(PARAM_MAP.salt);
  if (salt) recipe.salt = parseInt(salt, 10) / 1000;

  // Yeast
  const yeast = params.get(PARAM_MAP.yeast);
  if (yeast) recipe.yeast = parseInt(yeast, 10) / 1000;

  // Oil
  const oil = params.get(PARAM_MAP.oil);
  if (oil) recipe.oil = parseInt(oil, 10) / 100;

  // Sugar
  const sugar = params.get(PARAM_MAP.sugar);
  if (sugar) recipe.sugar = parseInt(sugar, 10) / 100;

  // Pre-ferment
  if (params.get(PARAM_MAP.usePreFerment) === '1') {
    recipe.usePreFerment = true;
    recipe.preFermentType = params.get(PARAM_MAP.preFermentType) || 'poolish';

    const pfp = params.get(PARAM_MAP.preFermentFlourPercent);
    if (pfp) recipe.preFermentFlourPercent = parseInt(pfp, 10) / 100;
  }

  // Humidity adjustment
  if (params.get(PARAM_MAP.humidityAdjust) === '1') {
    recipe.humidityAdjust = true;
  }

  // Flour type
  const flourType = params.get(PARAM_MAP.flourType);
  if (flourType) recipe.flourType = flourType;

  return recipe;
}

/**
 * Check if current URL has recipe parameters
 * @returns {boolean} True if URL contains recipe parameters
 */
export function hasRecipeInURL() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  return params.has(PARAM_MAP.numBalls) || params.has(PARAM_MAP.style);
}

/**
 * Get recipe from current URL
 * @returns {Object|null} Recipe settings or null if no recipe in URL
 */
export function getRecipeFromURL() {
  if (typeof window === 'undefined') return null;

  if (!hasRecipeInURL()) return null;

  return decodeRecipe(window.location.search);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful
 */
export async function copyToClipboard(text) {
  try {
    // Modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Generate recipe text for copying
 * @param {Object} recipe - Calculated recipe object
 * @param {string} styleName - Name of the pizza style
 * @returns {string} Formatted recipe text
 */
export function generateRecipeText(recipe, styleName = 'Pizza') {
  const lines = [];

  lines.push(`${styleName} Dough Recipe`);
  lines.push(`Generated by The Pizza Dough Formula`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push('');

  if (recipe.stage === 'single') {
    lines.push('INGREDIENTS');
    lines.push('───────────────────────────────────');
    lines.push(`Flour: ${recipe.ingredients.flour}g (100%)`);
    lines.push(`Water: ${recipe.ingredients.water}g (${recipe.percentages.hydration}%)`);
    lines.push(`Salt: ${recipe.ingredients.salt}g (${recipe.percentages.salt}%)`);
    lines.push(`Instant Yeast: ${recipe.ingredients.yeast}g (${recipe.percentages.yeast}%)`);

    if (recipe.ingredients.oil > 0) {
      lines.push(`Olive Oil: ${recipe.ingredients.oil}g (${recipe.percentages.oil}%)`);
    }
    if (recipe.ingredients.sugar > 0) {
      lines.push(`Sugar: ${recipe.ingredients.sugar}g (${recipe.percentages.sugar}%)`);
    }

    lines.push('');
    lines.push(`Total dough: ${recipe.totalWeight}g`);
  } else {
    // Two-stage recipe
    lines.push('STAGE 1: PRE-FERMENT (Night Before)');
    lines.push('───────────────────────────────────');
    lines.push(`Flour: ${recipe.preFerment.ingredients.flour}g`);
    lines.push(`Water: ${recipe.preFerment.ingredients.water}g`);
    lines.push(`Instant Yeast: ${recipe.preFerment.ingredients.yeast}g`);
    lines.push('');
    lines.push('Mix, cover loosely, ferment 12-16h at room temp.');
    lines.push('');
    lines.push('STAGE 2: FINAL DOUGH (Next Day)');
    lines.push('───────────────────────────────────');
    lines.push(`Pre-ferment: All of it`);
    lines.push(`Flour: ${recipe.finalDough.ingredients.flour}g`);
    lines.push(`Water: ${recipe.finalDough.ingredients.water}g`);
    lines.push(`Salt: ${recipe.finalDough.ingredients.salt}g`);
    lines.push(`Instant Yeast: ${recipe.finalDough.ingredients.yeast}g`);

    if (recipe.finalDough.ingredients.oil > 0) {
      lines.push(`Olive Oil: ${recipe.finalDough.ingredients.oil}g`);
    }
    if (recipe.finalDough.ingredients.sugar > 0) {
      lines.push(`Sugar: ${recipe.finalDough.ingredients.sugar}g`);
    }

    lines.push('');
    lines.push(`Total dough: ${recipe.totalWeight}g`);
  }

  lines.push('');
  lines.push('───────────────────────────────────');
  lines.push('https://thepizzadoughformula.com');

  return lines.join('\n');
}

export default {
  encodeRecipe,
  decodeRecipe,
  hasRecipeInURL,
  getRecipeFromURL,
  copyToClipboard,
  generateRecipeText
};
