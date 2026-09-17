# Analytics events

PostHog measurement for thepizzadoughformula.com, added in step 4 of
[ADR 0001](adr/0001-calculator-reliability-and-organic-growth.md). The PostHog project is shared with
other sites, so every report for this site filters on `$host = thepizzadoughformula.com`. Preview
hosts such as `*.pages.dev` and `localhost` fall outside that filter.

## Setup

| Item | Value |
| --- | --- |
| Library | `posthog-js` npm package (version locked in `package-lock.json`) |
| Loader | `src/lib/analytics.ts`, started by a module script in `src/layouts/BaseLayout.astro` on every page |
| Loading | Deferred: a module script runs after the page is parsed, then dynamically imports `posthog-js`, so the library downloads only when analytics is allowed. Events recorded before PostHog starts are queued in `src/lib/analytics.ts` and sent once it does. |
| Host | `https://us.i.posthog.com` |
| Key | `PUBLIC_POSTHOG_KEY`, read at build time. Production needs it set in the Cloudflare Pages environment. |
| Settings | `persistence: 'localStorage'`, `autocapture: false`, `capture_pageview: true`, `person_profiles: 'identified_only'`, `capture_exceptions: true`, `session_recording: { maskAllInputs: true }` |

Analytics does nothing (no download, no requests, no storage) when the build has no
`PUBLIC_POSTHOG_KEY` or the browser sends Do Not Track (`navigator.doNotTrack === '1'`). There is no
consent gate; `src/components/global/CookieConsent.astro` shows a one-time notice instead.

Storage: no cookies, and one `localStorage` key, `ph_<token>_posthog`. For the current tab, PostHog
also uses two `sessionStorage` keys (`ph_<token>_posthog` and `ph_<token>_primary_window_exists`).

## Rules for every event

- Every event carries `page` (the pathname), `style` (a preset id from
  `src/scripts/calculator/presets.js`, or `none`), and `placement` (see the table below, or `none`).
  `track()` in `src/lib/analytics.ts` fills in `none` when a call site passes no style or placement.
- `track()` drops property values that are not booleans, finite numbers, strings of 64 characters or
  fewer, or lists of up to 20 such strings. Any string that looks like an email address is dropped.
- Call sites never send email addresses, names, or the share URL.
- PostHog adds its own properties to every event, including `$host`, `$current_url`, and
  `$referrer`. `$current_url` is the full address with its query string, so events on a page opened
  from a saved recipe link include that link's recipe parameters there.
- Each event fires once per trigger. None fires because the calculator rendered on page load, except
  `guide_to_calculator`, whose trigger is the page load itself.

## Events

### `guide_to_calculator`

- **Trigger:** the homepage loads with an `s` parameter that is a valid preset id. Missing or
  invalid values send nothing.
- **Frequency:** once per page load.
- **Properties:** `page`, `style` (the preset id from `s`), `placement` (`none`),
  `referrer_path` (the referring page's path when it is on this site, `external` for another site,
  `none` without a referrer), `saved_recipe` (`true` when the URL also has `n`, meaning a saved recipe
  link rather than a guide link).
- **Source:** `initializeCalculator()` in `src/pages/index.astro`.

### `calculator_used`

- **Trigger:** the first user-initiated `input` or `change` event inside `#calculator` (style cards,
  size options, quantity and weight inputs, advanced options), or a click on a quantity preset
  button. Values set by code during initialization, from URL parameters, or by style defaults dispatch
  no events and are not counted. Events dispatched by scripts are ignored (`isTrusted`). The newsletter
  form inside `#calculator` does not count. Neither do the unit toggle and opening Advanced Options.
- **Frequency:** once per page view.
- **Properties:** `page`, `style` (the style selected after the change), `placement` (`none`).
- **Source:** `trackCalculatorUse()` in `src/pages/index.astro`.

### `recipe_invalid`

- **Trigger:** a user change to the calculator produces a recipe that `DoughCalculator.validate()` in
  `src/scripts/calculator/engine.js` rejects, for example a pre-ferment that needs more water than
  the whole recipe has. The initial render never sends it, including a shared link that opens with an
  impossible recipe.
- **Frequency:** once each time the rejection reason changes. Further changes that keep the same
  reason do not send it again; a valid recipe resets it.
- **Properties:** `page`, `style`, `placement` (`none`), `reason` (`preferment_water_exceeds_total`,
  `preferment_flour_exceeds_total`, or `invalid_input`).
- **Source:** `render()` in `src/pages/index.astro`.

### `recipe_copied`

- **Trigger:** a Copy button on a recipe card (`#copyRecipe`, `#copyRecipe2`), after the recipe text
  is copied successfully.
- **Frequency:** every successful copy.
- **Properties:** `page`, `style`, `placement` (`none`), `preferment` (boolean), `unit` (`grams` or
  `ounces`).
- **Source:** copy handler in `src/pages/index.astro`.

### `recipe_printed`

- **Trigger:** a click on a Print button (`#printRecipe`, `#printRecipe2`). Printing from the browser
  menu is not counted.
- **Frequency:** every click.
- **Properties:** `page`, `style`, `placement` (`none`), `preferment` (boolean), `unit`.
- **Source:** print listener in `src/pages/index.astro` (the dialog is opened by
  `src/components/calculator/RecipeOutput.astro`).

### `recipe_shared`

- **Trigger:**
  - the Copy Recipe Link button in the share section, after the link is copied
    (`method: copy_link`, `placement: share-section`);
  - the X, Facebook, or Reddit links in the share section (`method: twitter`, `facebook`, or
    `reddit`; `placement: share-section`);
  - the Copy button in the Share This Recipe dialog, after the link is copied
    (`method: copy_link`, `placement: share-modal`).
- **Frequency:** every trigger.
- **Properties:** `page`, `style`, `placement`, `method`. The share URL itself is never sent.
- **Source:** `src/pages/index.astro` (share section) and
  `src/components/calculator/RecipeOutput.astro` (dialog).

### `affiliate_exposure`

- **Trigger:** a `ProductRecommendations` block enters the viewport (IntersectionObserver, any
  visible part).
- **Frequency:** once per block per page view.
- **Properties:** `page`, `placement` (the block's `data-placement`), `style` (the block's style
  filter, or `none`), `product_ids` (list of the product ids shown).
- **Source:** script in `src/components/monetization/ProductRecommendations.astro`.

### `affiliate_click`

- **Trigger:** a click or middle-click on a product link in a `ProductRecommendations` block.
- **Frequency:** every click.
- **Properties:** `page`, `placement`, `style`, `product_id`, `tracking_id` (the link's Amazon `tag`
  parameter, or `none`). The tag comes from the block's placement, so `tracking_id` shows which
  pizza-only ID the click was credited to. See the tracking ID table below.
- **Source:** script in `src/components/monetization/ProductRecommendations.astro`.

### `newsletter_form_viewed`

- **Trigger:** a newsletter form enters the viewport.
- **Frequency:** once per form per page view. The homepage has two forms, and each is counted
  separately so the signup event below has a matching denominator for each placement.
- **Properties:** `page`, `placement` (`post-calculator` or `newsletter-section`), `style` (the
  selected style for `post-calculator`, `none` for `newsletter-section`).
- **Source:** IntersectionObserver in `src/pages/index.astro`.

### `newsletter_signup_submitted`

- **Trigger:** the n8n webhook answers a form submission with a 2xx status.
- **Frequency:** every successful submission.
- **Properties:** `page`, `placement`, `style` (same rule as `newsletter_form_viewed`). The email
  address is never sent.
- **Caveat:** this fires when the webhook responds. It equals a completed spreadsheet append only if
  the n8n workflow sends its response after the Excel step. A test submission that adds one row, as
  step 4's completion check requires, is the evidence for that.
- **Source:** form handlers in `src/pages/index.astro`.

## Placements

| `placement` | Where |
| --- | --- |
| `homepage-equipment` | Essential Pizza Equipment section on the homepage (`ProductRecommendations`) |
| `post-calculator` | Newsletter form directly below the calculator |
| `newsletter-section` | Newsletter section above the FAQ |
| `share-section` | "Planning a Pizza Night with Friends?" share section |
| `share-modal` | Share This Recipe dialog |

`ProductRecommendations` requires a `placement` prop. When adding the component or a new form
elsewhere, choose a new placement value and add a row here.

## Amazon tracking IDs

Introduced 2026-09-17, these are used only on thepizzadoughformula.com. The double hyphen is part of
each ID. The tag comes from the block's placement, set in `TRACKING_IDS` in
`src/components/monetization/ProductRecommendations.astro`, not from the product data, so a
commission can be traced to the page that earned it. The build fails if a block uses a placement that
has no ID.

| Placement | Amazon tracking ID | Where |
| --- | --- | --- |
| `style-guide` | `pizzaguide--20` | Recommendation blocks on the pizza-styles pages |
| `calculator-results` | `pizzacalc--20` | The block under the calculator results on the homepage |
| `homepage-equipment` | `pizzahome--20` | Any other homepage placement, currently the Essential Pizza Equipment section |

`probuild20-20`, which was shared with other sites, is no longer used here. Earnings reported against
it cannot be attributed to this site, so keep them separate from anything reported against the IDs
above. `affiliate_click` reads `tracking_id` from the link it was rendered with, so events and Amazon
reports can be compared.

The `style-guide` and `calculator-results` placements have IDs but no blocks on the site yet; those
are step 7 of the ADR.

## Automatic PostHog events

- `$pageview` on every page load (`capture_pageview: true`).
- `$pageleave` when a page is left (PostHog's default when page views are captured).
- `$exception` for uncaught script errors (`capture_exceptions: true`).
- Session recordings, when recording is enabled for the project, with every input masked.

Clicks, form interactions, and other DOM events are not autocaptured (`autocapture: false`).

## Testing

- `npm run test:analytics` runs `tests/analytics.spec.ts` under `playwright.analytics.config.ts`. It
  builds the site into `dist-analytics/` with a throwaway key and
  `PUBLIC_POSTHOG_TEST_DISABLE_COMPRESSION=true`, serves it on port 8082, and answers every PostHog
  request locally, so nothing reaches PostHog.
- `PUBLIC_POSTHOG_TEST_DISABLE_COMPRESSION` exists only so tests can read event payloads, because
  `posthog-js` gzips them by default. Never set it for a deployed build.
- `tests/third-party-scripts.spec.ts` loads every page in the sitemap and fails on any request to a
  Google ads or tag host. It runs in both Playwright configs.
