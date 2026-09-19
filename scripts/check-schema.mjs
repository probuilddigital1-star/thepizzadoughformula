/**
 * Structured data check for the built site. Runs as part of `npm run build`.
 *
 * It parses every JSON-LD block in dist/ and asserts:
 *  - Recipe blocks carry the fields Google documents as required for recipe rich results
 *    (name, image, recipeIngredient, recipeInstructions), with real quantities in the ingredients
 *    (https://developers.google.com/search/docs/appearance/structured-data/recipe)
 *  - no Product markup exists at all: without a price it is not eligible for product rich results,
 *    and Amazon Associates does not permit prices that are not pulled live from their API
 *    (ADR 0001, step 5)
 *  - no product card shows a dollar amount
 *  - no em dash appears in any page's visible text
 *  - the retired shared Amazon tracking ID appears nowhere in the built output
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const RETIRED_TRACKING_ID = 'probuild20-20';
const PRICE_PATTERN = /[$£€]\s?\d/;
const EM_DASH = '—';

const problems = [];
let pagesChecked = 0;
let recipesChecked = 0;
let productsChecked = 0;

function htmlFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

/** Every schema object in a block, flattening arrays and @graph. */
function schemaObjects(parsed) {
  if (Array.isArray(parsed)) return parsed.flatMap(schemaObjects);
  if (parsed && typeof parsed === 'object') {
    return Array.isArray(parsed['@graph']) ? [parsed, ...parsed['@graph'].flatMap(schemaObjects)] : [parsed];
  }
  return [];
}

const isFilled = (value) => typeof value === 'string' && value.trim() !== '';
const asArray = (value) => (Array.isArray(value) ? value : value === undefined ? [] : [value]);

function checkRecipe(recipe, page) {
  recipesChecked += 1;
  const fail = (message) => problems.push(`${page}: Recipe "${recipe.name ?? '(unnamed)'}" ${message}`);

  if (!isFilled(recipe.name)) fail('has no name');

  const images = asArray(recipe.image).filter((image) => isFilled(image) || isFilled(image?.url));
  if (images.length === 0) fail('has no image');
  for (const image of images) {
    const url = isFilled(image) ? image : image.url;
    if (/\.svg($|\?)/i.test(url)) fail(`uses an SVG image (${url}); Google accepts .jpg, .png or .gif`);
  }

  const ingredients = asArray(recipe.recipeIngredient).filter(isFilled);
  if (ingredients.length < 3) fail(`lists ${ingredients.length} ingredients, expected at least 3`);
  if (!ingredients.some((ingredient) => /\d/.test(ingredient) && /\b(g|kg|ml|oz|cup|tsp|tbsp)\b/i.test(ingredient))) {
    fail('has no ingredient with a real quantity and unit');
  }

  const instructions = asArray(recipe.recipeInstructions);
  if (instructions.length === 0) fail('has no instructions');
  for (const [index, step] of instructions.entries()) {
    const text = isFilled(step) ? step : step?.text;
    if (!isFilled(text)) fail(`has an empty instruction at position ${index + 1}`);
    // Every step carries a short name and a link to itself on the page
    if (!isFilled(step?.name)) fail(`has no name on the instruction at position ${index + 1}`);
    if (!isFilled(step?.url)) fail(`has no url on the instruction at position ${index + 1}`);
  }

  // Calories per serving, estimated from the flour, oil and sugar (see [style].astro)
  const calories = recipe.nutrition?.calories;
  if (!isFilled(calories)) fail('has no nutrition.calories');
  else if (!/^\d+ calories$/.test(calories)) fail(`has nutrition.calories "${calories}", expected the form "640 calories"`);
}

function checkNoProduct(product, page) {
  productsChecked += 1;
  problems.push(`${page}: Product schema for "${product.name ?? '(unnamed)'}" should not be published at all`);
}

/**
 * No em dash in visible copy. The site's prose uses periods, commas or parentheses instead, so one
 * appearing in a built page means new copy slipped past the style rule. Script and style tags are
 * excluded, which also covers the JSON-LD blocks, and the entity spellings are folded in first.
 */
function checkNoEmDash(html, page) {
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&mdash;|&#8212;|&#x2014;/gi, EM_DASH);

  for (let at = visible.indexOf(EM_DASH); at !== -1; at = visible.indexOf(EM_DASH, at + 1)) {
    const excerpt = visible.slice(Math.max(0, at - 30), at + 30).replace(/\s+/g, ' ').trim();
    problems.push(`${page}: visible text contains an em dash (…${excerpt}…)`);
  }
}

/** Product cards must show no price: Amazon permits only prices pulled live from their API. */
function checkProductCards(html, page) {
  for (const [card] of html.matchAll(/<a[^>]*class="[^"]*product-card[\s\S]*?<\/a>/g)) {
    if (PRICE_PATTERN.test(card)) {
      const shown = card.match(new RegExp(`.{0,40}${PRICE_PATTERN.source}.{0,20}`))?.[0].replace(/\s+/g, ' ');
      problems.push(`${page}: a product card shows a price (${shown?.trim()})`);
    }
  }
}

let files;
try {
  files = htmlFiles(DIST);
} catch {
  console.error('No dist/ directory. Run the build first.');
  process.exit(1);
}

for (const file of files) {
  const page = path.relative(DIST, file).replace(/\\/g, '/');
  const html = readFileSync(file, 'utf8');
  pagesChecked += 1;

  if (html.includes(RETIRED_TRACKING_ID)) {
    problems.push(`${page}: contains the retired Amazon tracking ID ${RETIRED_TRACKING_ID}`);
  }
  checkProductCards(html, page);
  checkNoEmDash(html, page);

  for (const [, block] of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let parsed;
    try {
      parsed = JSON.parse(block);
    } catch (error) {
      problems.push(`${page}: JSON-LD block does not parse (${error.message})`);
      continue;
    }
    for (const schema of schemaObjects(parsed)) {
      const types = asArray(schema['@type']);
      if (types.includes('Recipe')) checkRecipe(schema, page);
      if (types.includes('Product')) checkNoProduct(schema, page);
    }
  }
}

if (recipesChecked === 0) problems.push('No Recipe schema found in the built site.');

console.log(`Schema check: ${pagesChecked} pages, ${recipesChecked} Recipe blocks, ${productsChecked} Product blocks (expected 0).`);
if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log('Schema check passed.');
