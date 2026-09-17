/**
 * Share Recipe URL and recipe text
 * Encodes the recipe state into shareable URLs, reads current and earlier links, and formats the
 * recipe. The screen, the copied text and the print output all use buildRecipeView(), so they agree.
 *
 * @module features/shareRecipe
 */
import { DEFAULT_RECIPE_STATE, PREFERMENT_TYPES, YEAST_TYPES } from '../calculator/engine.js';
import { formatWeight } from '../calculator/units.js';

/**
 * URL format 2 (v=2): percentages are plain percent values with up to three decimals (h=62.5,
 * sa=2.75), and a saved recipe always carries the yeast type, oil, sugar, and the pre-ferment and
 * humidity switches, so zeros and switched-off options survive a reload.
 *
 * Links without v use the earlier format: h, o, su and pfp are whole percents, sa and y are tenths of
 * a percent, and zero oil or sugar and switched-off options were left out. Those links are still read.
 * The earlier flour type parameter (ft) is ignored.
 */
export const URL_FORMAT_VERSION = '2';

const PARAM = {
  version: 'v',
  style: 's',
  numBalls: 'n',
  ballWeight: 'w',
  hydration: 'h',
  salt: 'sa',
  yeast: 'y',
  yeastType: 'yt',
  oil: 'o',
  sugar: 'su',
  usePreFerment: 'pf',
  preFermentType: 'pft',
  preFermentFlourPercent: 'pfp',
  humidityAdjust: 'ha'
};

/** A fraction as a URL percent value: 0.625 -> "62.5", 0 -> "0". */
function percentParam(fraction) {
  return String(Math.round(fraction * 100 * 1000) / 1000);
}

/**
 * Encode a recipe state into a share URL (format 2)
 * @param {typeof DEFAULT_RECIPE_STATE} state - Recipe state
 * @returns {string} URL with encoded parameters
 */
export function encodeRecipe(state) {
  const params = new URLSearchParams();
  params.set(PARAM.version, URL_FORMAT_VERSION);
  if (state.style) params.set(PARAM.style, state.style);
  params.set(PARAM.numBalls, String(state.numBalls));
  params.set(PARAM.ballWeight, String(state.ballWeight));
  params.set(PARAM.hydration, percentParam(state.hydration));
  params.set(PARAM.salt, percentParam(state.salt));
  params.set(PARAM.yeast, percentParam(state.yeast));
  params.set(PARAM.yeastType, state.yeastType ?? DEFAULT_RECIPE_STATE.yeastType);
  params.set(PARAM.oil, percentParam(state.oil));
  params.set(PARAM.sugar, percentParam(state.sugar));
  params.set(PARAM.usePreFerment, state.usePreFerment ? '1' : '0');
  if (state.usePreFerment) {
    params.set(PARAM.preFermentType, state.preFermentType);
    params.set(PARAM.preFermentFlourPercent, percentParam(state.preFermentFlourPercent));
  }
  params.set(PARAM.humidityAdjust, state.humidityAdjust ? '1' : '0');

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://thepizzadoughformula.com';

  return `${baseUrl}/?${params.toString()}`;
}

/**
 * Decode URL parameters into recipe settings. Only values the link carries are returned.
 * `savedRecipe` is true when the link is a saved recipe (it has n) rather than a style link.
 * @param {string|URLSearchParams} input - URL string or URLSearchParams object
 * @returns {Object|null} Recipe settings
 */
export function decodeRecipe(input) {
  let params;

  if (typeof input === 'string') {
    try {
      params = new URL(input).searchParams;
    } catch {
      params = new URLSearchParams(input);
    }
  } else if (input instanceof URLSearchParams) {
    params = input;
  } else {
    return null;
  }

  const number = (key) => {
    const raw = params.get(key);
    if (raw === null || raw.trim() === '') return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  };
  const scaled = (key, divisor) => {
    const value = number(key);
    return value === undefined ? undefined : value / divisor;
  };
  const flag = (key) => {
    const raw = params.get(key);
    return raw === '1' ? true : raw === '0' ? false : undefined;
  };
  const oneOf = (key, allowed) => (allowed.includes(params.get(key)) ? params.get(key) : undefined);

  const recipe = {};
  const style = params.get(PARAM.style);
  if (style) recipe.style = style;
  recipe.savedRecipe = params.has(PARAM.numBalls);
  if (!recipe.savedRecipe) return recipe;

  const numBalls = number(PARAM.numBalls);
  recipe.numBalls = numBalls === undefined ? undefined : Math.trunc(numBalls);
  recipe.ballWeight = number(PARAM.ballWeight);

  if (params.get(PARAM.version) === URL_FORMAT_VERSION) {
    recipe.hydration = scaled(PARAM.hydration, 100);
    recipe.salt = scaled(PARAM.salt, 100);
    recipe.yeast = scaled(PARAM.yeast, 100);
    recipe.yeastType = oneOf(PARAM.yeastType, YEAST_TYPES);
    recipe.oil = scaled(PARAM.oil, 100);
    recipe.sugar = scaled(PARAM.sugar, 100);
    recipe.usePreFerment = flag(PARAM.usePreFerment);
    recipe.humidityAdjust = flag(PARAM.humidityAdjust);
    if (recipe.usePreFerment) {
      recipe.preFermentType = oneOf(PARAM.preFermentType, PREFERMENT_TYPES);
      recipe.preFermentFlourPercent = scaled(PARAM.preFermentFlourPercent, 100);
    }
  } else {
    // Earlier format. Its encoder left out zero oil and sugar and switched-off options, so in a saved
    // link a missing value means zero or off.
    recipe.hydration = scaled(PARAM.hydration, 100);
    recipe.salt = scaled(PARAM.salt, 1000);
    recipe.yeast = scaled(PARAM.yeast, 1000);
    recipe.oil = scaled(PARAM.oil, 100) ?? 0;
    recipe.sugar = scaled(PARAM.sugar, 100) ?? 0;
    recipe.usePreFerment = params.get(PARAM.usePreFerment) === '1';
    recipe.humidityAdjust = params.get(PARAM.humidityAdjust) === '1';
    if (recipe.usePreFerment) {
      recipe.preFermentType = oneOf(PARAM.preFermentType, PREFERMENT_TYPES) ?? 'poolish';
      recipe.preFermentFlourPercent = scaled(PARAM.preFermentFlourPercent, 100);
    }
  }

  Object.keys(recipe).forEach((key) => recipe[key] === undefined && delete recipe[key]);
  return recipe;
}

/**
 * Check if current URL has recipe parameters
 * @returns {boolean} True if URL contains recipe parameters
 */
export function hasRecipeInURL() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  return params.has(PARAM.numBalls) || params.has(PARAM.style);
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
 * "Makes 4 dough balls at 250g each (1000g total)"
 * @param {typeof DEFAULT_RECIPE_STATE} state - Recipe state
 */
export function describeBatch(state) {
  const count = state.numBalls;
  const unit = state.unit;
  return `Makes ${count} dough ball${count === 1 ? '' : 's'} at ${formatWeight(state.ballWeight, unit)} each (${formatWeight(count * state.ballWeight, unit)} total)`;
}

const yeastName = (yeastType) => (yeastType === 'activeDry' ? 'Active Dry Yeast' : 'Instant Yeast');
const percentText = (value) => `${value.toFixed(1)}%`;

/**
 * Display rows for a valid recipe: label, formatted amount, optional percentage and visibility.
 * The screen and the copied text are both built from these rows.
 * @param {Object} result - A valid result from DoughCalculator.calculate()
 * @param {typeof DEFAULT_RECIPE_STATE} state - Recipe state (for the unit and batch summary)
 */
export function buildRecipeView(result, state) {
  const unit = state.unit ?? DEFAULT_RECIPE_STATE.unit;
  const amount = (grams) => formatWeight(grams, unit);
  const yeastLabel = yeastName(result.yeastType);
  const view = {
    stage: result.stage,
    unit,
    summary: describeBatch(state),
    totalWeight: amount(result.totalWeight),
    yeastLabel
  };

  if (result.stage === 'single') {
    const ingredients = result.ingredients;
    const percentages = result.percentages;
    view.rows = [
      { key: 'flour', label: 'Flour', amount: amount(ingredients.flour), percent: '100%', visible: true },
      { key: 'water', label: 'Water', amount: amount(ingredients.water), percent: percentText(percentages.hydration), visible: true },
      { key: 'salt', label: 'Salt', amount: amount(ingredients.salt), percent: percentText(percentages.salt), visible: true },
      { key: 'yeast', label: yeastLabel, amount: amount(ingredients.yeast), percent: percentText(percentages.yeast), visible: true },
      { key: 'oil', label: 'Olive Oil', amount: amount(ingredients.oil), percent: percentText(percentages.oil), visible: ingredients.oil > 0 },
      { key: 'sugar', label: 'Sugar', amount: amount(ingredients.sugar), percent: percentText(percentages.sugar), visible: ingredients.sugar > 0 }
    ];
    return view;
  }

  const typeName = result.preFerment.type === 'biga' ? 'Biga' : 'Poolish';
  const preFerment = result.preFerment.ingredients;
  const finalDough = result.finalDough.ingredients;
  view.preFerment = {
    typeName,
    title: `${typeName} (Night Before)`,
    rows: [
      { key: 'flour', label: 'Flour', amount: amount(preFerment.flour), visible: true },
      { key: 'water', label: 'Water', amount: amount(preFerment.water), visible: true },
      { key: 'yeast', label: yeastLabel, amount: amount(preFerment.yeast), visible: true }
    ]
  };
  view.finalDough = {
    rows: [
      { key: 'preFerment', label: `${typeName} (from above)`, amount: 'All of it', visible: true },
      { key: 'flour', label: 'Flour (remaining)', amount: amount(finalDough.flour), visible: true },
      { key: 'water', label: 'Water (remaining)', amount: amount(finalDough.water), visible: true },
      { key: 'salt', label: 'Salt', amount: amount(finalDough.salt), visible: true },
      { key: 'yeast', label: `${yeastLabel} (remaining)`, amount: amount(finalDough.yeast), visible: finalDough.yeast > 0 },
      { key: 'oil', label: 'Olive Oil', amount: amount(finalDough.oil), visible: finalDough.oil > 0 },
      { key: 'sugar', label: 'Sugar', amount: amount(finalDough.sugar), visible: finalDough.sugar > 0 }
    ]
  };
  return view;
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
 * Generate recipe text for copying, from the same rows as the screen.
 * @param {Object} result - Result from DoughCalculator.calculate()
 * @param {typeof DEFAULT_RECIPE_STATE} state - Recipe state
 * @param {string} styleName - Name of the pizza style
 * @returns {string} Formatted recipe text, or an empty string for an invalid recipe
 */
export function generateRecipeText(result, state, styleName = 'Pizza') {
  if (!result?.valid) return '';

  const view = buildRecipeView(result, state);
  const rule = '───────────────────────────────────';
  const line = (row) => `${row.label}: ${row.amount}${row.percent ? ` (${row.percent})` : ''}`;
  const visibleLines = (rows) => rows.filter((row) => row.visible).map(line);
  const lines = [
    `${styleName} Dough Recipe`,
    'Generated by The Pizza Dough Formula',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    view.summary,
    ''
  ];

  if (view.stage === 'single') {
    lines.push('INGREDIENTS', rule, ...visibleLines(view.rows));
  } else {
    lines.push(
      `STAGE 1: ${view.preFerment.typeName.toUpperCase()} (NIGHT BEFORE)`,
      rule,
      ...visibleLines(view.preFerment.rows),
      '',
      'Mix, cover loosely, ferment 12-16h at room temp.',
      '',
      'STAGE 2: FINAL DOUGH (NEXT DAY)',
      rule,
      ...visibleLines(view.finalDough.rows)
    );
  }

  lines.push('', `Total dough: ${view.totalWeight}`, '', rule, 'https://thepizzadoughformula.com');
  return lines.join('\n');
}

export default {
  encodeRecipe,
  decodeRecipe,
  hasRecipeInURL,
  getRecipeFromURL,
  describeBatch,
  buildRecipeView,
  copyToClipboard,
  generateRecipeText
};
