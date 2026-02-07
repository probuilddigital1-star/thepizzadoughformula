# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow Rules

When making visual/design changes, always describe what the change will look like BEFORE implementing it. Ask for user approval on visual impact before editing code.

## Tech Stack

Primary tech stack: TypeScript, Astro, Tailwind CSS 4.x, Cloudflare Pages. Always use TypeScript for new files. When working with CSS, test both dev and production builds — styles that work in dev may break in production (especially with link tags vs inline styles in Astro).

## Dev Server

After any code change, always verify the dev server is running and accessible before moving on. If the dev server fails (IPv4/IPv6 binding, port conflicts), fix it immediately. Use `lsof -i :<port>` to check for port conflicts and try explicit `--host 0.0.0.0` or `--host 127.0.0.1` flags.

## Security

Never commit API keys, secrets, or credentials to git. Before every `git add` or `git push`, check staged files for any secrets using `git diff --cached | grep -iE '(api_key|secret|token|password)'`. Use environment variables and .env files (which must be in .gitignore).

## Deployment

For Cloudflare deployments: Always use `Pages` (not Workers) for static/SSR sites. Verify the project type before deploying. For Astro, ensure the correct adapter is configured. Double-check that environment variables are set in the Cloudflare dashboard, not just locally.

## n8n Workflows

For n8n workflow debugging: Always check Content-Type headers on HTTP Request nodes (JSON needs `application/json`), watch for hidden characters in URLs (re-type rather than copy-paste), and verify expression syntax with `{{ }}` brackets. Test each node individually before running the full workflow.

## Commands

```bash
npm run dev       # Start dev server at localhost:4321
npm run build     # Build production site to ./dist/
npm run preview   # Preview production build locally
```

### Testing (Playwright)

```bash
# Start dev server first (tests expect port 8080)
npm run preview -- --port 8080

# In another terminal:
npx playwright test                    # Run all tests
npx playwright test calculator.spec.ts # Run specific test file
npx playwright test --ui               # Interactive UI mode
```

## Architecture

### Calculator Engine (`src/scripts/calculator/`)

- **engine.js** - `DoughCalculator` class using baker's percentages. All ingredients calculated as percentage of flour weight. Supports single-stage and two-stage (poolish/biga) recipes.
- **presets.js** - `PIZZA_STYLES` object with 7 styles (Neapolitan, New York, Detroit, Thin & Crispy, Poolish/Biga, Emergency, Custom). Each has defaults, sizes, flour recommendations, and baking instructions.
- **units.js** - Unit conversion (grams/ounces) and localStorage persistence.

### Key Formula
```
flourWeight = totalDoughWeight / (1 + hydration + salt + yeast + oil + sugar)
```
All percentages stored as decimals (e.g., 0.65 = 65% hydration).

### Component Structure

- **Calculator components** (`src/components/calculator/`) - StyleSelector, BasicInputs, AdvancedOptions, RecipeOutput
- **Monetization** (`src/components/monetization/`) - ProductRecommendations (Amazon affiliate), BreadCalculatorPromo
- **Data files** (`src/data/`) - affiliateProducts.json (Amazon tag: probuild20-20), faq.json

### Pages

- `/` - Main calculator with hero, style selector, recipe output
- `/pizza-styles` - Style comparison guide
- `/bakers-percentages` - Educational content
- `/about`, `/privacy`, `/affiliate-disclosure`

### Styling

Uses Tailwind CSS 4.x with custom theme in `src/styles/global.css`. Self-hosted fonts: Fraunces (headings), DM Sans (body), Cormorant Garamond (editorial). Color palette uses ember/crust/flour/char/sage naming.

### CLS Prevention

Size selectors and quantity presets in BasicInputs.astro are server-rendered with defaults to prevent Cumulative Layout Shift. JavaScript replaces content on style change but containers have min-height set.
