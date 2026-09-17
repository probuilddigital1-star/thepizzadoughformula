/**
 * Page dates from git history.
 *
 * Each page's dates come from the git history of its source file: datePublished from the first
 * commit that added it, dateModified and the sitemap's lastmod from the most recent commit touching
 * it. The build uses this for the sitemap, the Article schema and the visible "Last updated" lines,
 * so no date is invented and none changes just because the site was rebuilt.
 *
 * Cloudflare Pages may build from a shallow clone, or from a workspace without git history at all.
 * When git cannot answer, the dates come from the checked-in fallback file, src/data/page-dates.json.
 *
 * Refresh the fallback file after content changes:
 *   npm run update:page-dates
 * See docs/page-dates.md.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * The repository root. The build bundles this module into dist/, so its own location is not a
 * reliable anchor; the working directory is, and the module path is the fallback for CLI use.
 */
function resolveRoot() {
  const candidates = [process.cwd(), path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')];
  return candidates.find((candidate) => existsSync(path.join(candidate, 'src', 'pages'))) ?? candidates[0];
}

const ROOT = resolveRoot();
const PAGES_DIR = path.join(ROOT, 'src', 'pages');
const FALLBACK_FILE = path.join(ROOT, 'src', 'data', 'page-dates.json');

/** Source files of all pages, as repository-relative posix paths. */
export function listPageFiles(directory = PAGES_DIR, base = 'src/pages') {
  const entries = [];
  let contents;
  try {
    contents = readdirSync(directory, { withFileTypes: true });
  } catch {
    return entries;
  }
  for (const entry of contents) {
    const relative = `${base}/${entry.name}`;
    if (entry.isDirectory()) entries.push(...listPageFiles(path.join(directory, entry.name), relative));
    else if (entry.name.endsWith('.astro')) entries.push(relative);
  }
  return entries;
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function gitUsable() {
  try {
    git(['rev-parse', '--git-dir']);
    return git(['rev-parse', '--is-shallow-repository']) !== 'true';
  } catch {
    return false;
  }
}

/** First and last commit dates (YYYY-MM-DD) for one file, or null when git does not know it. */
export function gitDatesFor(file) {
  try {
    const modified = git(['log', '-1', '--format=%cI', '--', file]);
    if (!modified) return null;
    const history = git(['log', '--follow', '--format=%cI', '--', file]).split('\n').filter(Boolean);
    const published = history[history.length - 1] ?? modified;
    return { published: published.slice(0, 10), modified: modified.slice(0, 10) };
  } catch {
    return null;
  }
}

function readFallback() {
  if (!existsSync(FALLBACK_FILE)) return {};
  try {
    return JSON.parse(readFileSync(FALLBACK_FILE, 'utf8')).pages ?? {};
  } catch {
    return {};
  }
}

let cached = null;

/** Dates for every page source file, from git when possible and from the checked-in file otherwise. */
export function pageDates() {
  if (cached) return cached;

  if (gitUsable()) {
    const fromGit = {};
    for (const file of listPageFiles()) {
      const dates = gitDatesFor(file);
      if (dates) fromGit[file] = dates;
    }
    if (Object.keys(fromGit).length > 0) {
      cached = fromGit;
      return cached;
    }
  }

  cached = readFallback();
  return cached;
}

/**
 * The page source file a route came from: a direct match, an index file, or the dynamic route in
 * that directory (for example /pizza-styles/new-york/ comes from pizza-styles/[style].astro).
 */
export function sourceFileForPath(pathname) {
  const files = listPageFiles();
  const clean = pathname.replace(/\/+$/, '');
  const candidates = [`src/pages${clean || '/index'}.astro`, `src/pages${clean}/index.astro`];
  for (const candidate of candidates) {
    if (files.includes(candidate)) return candidate;
  }
  const directory = `src/pages${clean.slice(0, clean.lastIndexOf('/'))}`;
  const depth = `${directory}/x.astro`.split('/').length;
  return files.find((file) => file.startsWith(`${directory}/[`) && file.split('/').length === depth) ?? null;
}

/** Dates for a route path, or null when they cannot be determined. */
export function datesForPath(pathname) {
  const file = sourceFileForPath(pathname);
  return file ? pageDates()[file] ?? null : null;
}

/** "February 1, 2026" for a YYYY-MM-DD date. */
export function formatDate(date) {
  if (!date) return '';
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// node scripts/page-dates.mjs --write  regenerates the checked-in fallback file from git history.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv.includes('--write')) {
    console.log(JSON.stringify({ gitUsable: gitUsable(), pages: pageDates() }, null, 2));
    process.exit(0);
  }
  if (!gitUsable()) {
    console.error('Cannot refresh page dates: git history is unavailable or shallow here.');
    process.exit(1);
  }
  const pages = {};
  for (const file of listPageFiles()) {
    const dates = gitDatesFor(file);
    if (dates) pages[file] = dates;
    else console.warn(`No git history yet for ${file}; it will have no dates until it is committed.`);
  }
  mkdirSync(path.dirname(FALLBACK_FILE), { recursive: true });
  writeFileSync(FALLBACK_FILE, `${JSON.stringify({ generated: new Date().toISOString().slice(0, 10), pages }, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, FALLBACK_FILE)} with ${Object.keys(pages).length} pages.`);
}
