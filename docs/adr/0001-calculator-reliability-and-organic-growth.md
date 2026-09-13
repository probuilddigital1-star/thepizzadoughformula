# ADR 0001: Calculator reliability and measurable organic growth

Date: 2026-09-13  
Status: Accepted direction; implementation pending  
Site: thepizzadoughformula.com  
Repository snapshot reviewed: `033385f`

## Context

The site needs a dependable calculator, more useful organic landing pages, and revenue that can be attributed to this site. The audit found calculator defects and measurement gaps that should be addressed before expanding content or commercial features.

The owner has set these constraints:

- AdSense was denied three times and is excluded from this plan. No reapplication or replacement ad-network project is included.
- Work is organized into steps with completion checks. There are no calendar estimates or fixed 30/60/90-day phases.
- Development can use AI assistance. The owner has no time for test bakes or original photos at this stage; implementation must not depend on either.
- Every execution checklist must use sourced methods, schedules labeled as estimates, and illustrations identified as illustrative, without claiming personal tests.
- Amazon tracking ID `probuild20-20` is shared across multiple sites. Its earnings cannot be attributed to the pizza site.
- The original Cloudflare PDF was incorrect. Only the corrected replacement is evidence for this decision.

### Evidence baseline

| Source and reporting period | Observation | Implication and limitation |
| --- | --- | --- |
| Search Console workbook, August 14 to September 10, 2026 | 29 clicks, 795 impressions, 3.65% CTR. Poolish/Biga received 15 clicks and New York received 12. | These two pages generated 27 of 29 clicks, or 93.1%. Improve existing entry pages before publishing many new pages. The sample is too small for confident growth forecasts. |
| Search Console, same period | Mobile contributed 19 clicks. Recipe rich results contributed 27 clicks and 530 impressions. | Mobile deserves attention, and existing recipe search visibility must be preserved. A source-level schema omission does not establish that Google currently shows no rich results. |
| Corrected Cloudflare Web Analytics PDF, August 14 at 10:01 to September 13 at 10:01, UTC-04 | LCP: 93% good, 0% poor. INP: 83% good, 17% poor. CLS: 57% good, 43% poor. | Prioritize layout stability and interaction profiling. These are measurement shares, not visitor counts. The selected scope includes multiple hostnames and is not established as production-only or mobile-only. |
| Amazon screenshot, August 14 to September 12, 2026 | 92 clicks, 3 ordered items, $98.93 merchandise revenue, $3.57 commissions. | These are shared account/tracking results. They do not establish pizza-site revenue, conversion, or earnings per visitor. |
| Repository audit at `033385f` | Small yeast quantities lose display precision; some preferment inputs produce negative final water; initialization can overwrite URL settings; output formats disagree. | Calculator correctness is the first implementation priority after reconciling the live baseline. |

Search Console query rows are incomplete and page-level impressions use a different aggregation from property totals. They must not be forced into a complete query-to-page attribution model. The Cloudflare PDF contains no usable total visits or pageviews for calculating revenue per visitor. Historical localhost Lighthouse files are not a current production performance baseline.

Additional search opportunities are visible, with attribution limits:

- The homepage received 1 click from 163 impressions, or 0.61% CTR. Review its brand-only title and search-intent alignment. The export does not establish which queries produced that page's impressions.
- `pizza poolish y biga` received 126 impressions, no clicks, and an average position of 6.87. This warrants assessing a Spanish Poolish/Biga page, but does not prove that translation is the only solution or predict its clicks.
- Explicit English Poolish/Biga comparison variants total 24 impressions. Queries containing `calculator` account for 10 of the 11 clicks visible in the Queries sheet; the property's total is 29 clicks. These support a clearer comparison section and a reliable guide-to-calculator path, without establishing the intent of every visitor. The two guides' 93.1% share of search clicks measures arrivals, not use of their calculator buttons.
- Queries, Pages, Countries, and Search appearance are separate aggregate tables. Country is not search language, and translated-result impressions can overlap other dimensions. These tables cannot establish that 200 of the Poolish/Biga page's 408 impressions were non-English or that its English-only CTR was 7%.

## Decision

Keep the existing Astro and Tailwind application on Cloudflare Pages. Improve the existing calculator and landing pages incrementally. A framework rewrite, domain merger, or platform migration is not justified by the available evidence.

Use one validated recipe state as the authority for calculations, displayed quantities, copied text, printing, and shared URLs. Presentation and serialization must preserve the recipe's meaning, including yeast type and preferment settings. New implementation files follow the repository's TypeScript convention.

Keep the core calculator, copy, and print functions free. Pursue relevant affiliate recommendations after correctness and attribution work. An email offering is deferred until a sending tool exists; choosing that tool is a separate owner decision. Additional paid products require evidence of demand.

Use Claude Code in the current repository for implementation, one step per prompt on an isolated branch, with the owner reviewing each result against the step's completion check before merging. Tool choice does not change the validation requirements or require moving this project.

### Owner decisions: analytics and email

PostHog replaces GA4 on this site. Use the existing US cloud PostHog project shared with the owner's other sites, with project token `phc_mbbaNJmZTt8YAacD7VyeuMoYMfEd67UmNtkrWrpPHyHg` and `api_host: 'https://us.i.posthog.com'`. Every report for this site filters by `$host = thepizzadoughformula.com`; other sites and preview hostnames are outside that reporting scope.

Use the `posthog-js` npm package, loaded client-side and deferred, with `persistence: 'localStorage'` (no cookies), `autocapture: false`, `person_profiles: 'identified_only'`, `capture_exceptions: true`, and session replay enabled with `maskAllInputs: true`. This mirrors the owner's freezerbatchcocktails.com setup (`src/lib/analytics.ts` in that repository) and keeps one visitor as one visitor across page loads. Do not use `cookieless_mode`, and do not change any settings of the shared PostHog project; the project is shared with other sites that are configured deliberately. The result is no analytics cookies and one localStorage identifier. Verify the behavior during step 4. See [PostHog JavaScript configuration](https://posthog.com/docs/libraries/js/config).

The owner's intent is to count visitors without the former GA4 consent gate. This removes that source of undercounting, but does not guarantee every visitor is recorded: blocked scripts, network failures, and departures before deferred loading can still cause gaps. Keep funnel numerators and denominators within the same observed PostHog population and host filter; do not substitute Cloudflare visits or Search Console clicks for a PostHog denominator.

Use production-scoped Cloudflare data for separate traffic/performance context. Its Web Analytics beacon does not support custom events and cannot supply the planned funnel. See the [Cloudflare Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/).

The owner confirms that the existing n8n webhook appends signups to an Excel spreadsheet. There is no confirmation email, sending provider, or unsubscribe path. This is the known baseline and requires no investigation in step 1. In step 4, a confirmed signup means a row appended to that spreadsheet, verified with a test submission; it does not mean email verification or delivery. Step 7's email deliverable is deferred until a sending tool exists. Choosing that tool is a separate owner decision.

## Ordered implementation steps

All steps below are pending. Their order expresses dependencies and priority, not elapsed time.

### 1. Establish the live baseline

- Identify the deployed revision and reconcile it with the audited source.
- Check the homepage, Poolish/Biga, and New York pages on the live site. Record HTTP responses, canonical URLs, rendered metadata, and structured data.
- Check apex and `www`, trailing slashes, representative query parameters, redirects, and sitemap entries. Verify actual behavior before changing routing.
- Check the Search Console Recipe enhancement report, inspect the relevant URLs, and validate current live markup. An indexed report alone does not establish the markup currently deployed. Preserve working markup while correcting demonstrated errors.
- Record the analytics property, included hostnames, and available device breakdowns so subsequent reports have a known scope.
- Record the selected shared US PostHog project and the site report filter `$host = thepizzadoughformula.com` for the planned GA4 replacement.
- Record the owner-confirmed email baseline: the n8n webhook appends signups to an Excel spreadsheet, with no confirmation email, sending provider, or unsubscribe path. No workflow investigation is needed; the test submission belongs to step 4.

Completion check: a reproducible baseline identifies the deployed source, confirms or rejects suspected routing/schema problems, and separates production evidence from historical local measurements.

### 2. Repair calculator correctness and recipe state

#### 2a. Restore the guide-to-calculator handoff first

- Make this the first isolated code change once the deployed revision and handoff behavior are checked. It need not wait for the remaining analytics and SEO baseline work.
- Initialize the validated selected style's defaults, apply supported URL overrides, synchronize controls, and calculate after the necessary UI references and listeners exist. Keep the style radio, quantities, preferment mode, and output in agreement.
- Do not merely skip the final `applyStyleDefaults('neapolitan')` call. Style-only links still need their selected preset's defaults and initial rendering. Moving the existing rendering call into the early URL block would also risk accessing later-initialized UI references.
- Verify New York and Poolish/Biga guide links against manual selection of the same preset, direct homepage loading, invalid style values, and representative existing shared links. Confirm size/quantity controls still work and startup has no script errors.

Completion check: guide links load the intended preset and a usable initial recipe without introducing a regression in supported shared settings. This change may ship independently after its focused checks; the remaining output and serialization defects stay open under step 2b. Handle any verified hostname redirect as a separate routing change, with paths and recipe query parameters preserved.

#### 2b. Complete numerical and output consistency fixes

- Preserve useful precision for subgram yeast in grams and ounces. Values such as 0.3 g must not appear as zero.
- Validate preferment constraints before presenting a recipe. For example, 45% total hydration with 50% of the flour in a 100%-hydration poolish requires more preferment water than the total recipe allows. Explain the conflict and prevent a negative-water recipe from being copied or shared.
- Complete URL round trips beyond the handoff fix. Preserve explicit zero values, fractional percentages, yeast type, preferment type, and preferment percentage. Distinguish a style shortcut from a saved recipe so intentionally disabled options remain disabled when reloading a preferment preset. Keep omitted defaults distinct from intentionally supplied zero values.
- Keep the current fixed 55% biga-hydration assumption explicit. There is no user control for it today; adding one is not required for this repair. If it becomes configurable, include that value in recipe state and serialization together.
- Make yeast conversion and ingredient quantities consistent across the screen, copied text, print output, and a reopened shared URL.
- Resolve the flour selector's inert behavior. Give it a documented, useful effect or remove the misleading control; do not invent unsupported flour-dependent adjustments.
- Add focused regression coverage for ingredient arithmetic, invalid combinations, unit conversion, output consistency, and URL round trips.

Completion check: representative single-stage and preferment presets, custom inputs, and boundary cases produce valid, consistent recipes across all supported outputs. Numerical tests verify formula behavior; they do not establish baking outcomes.

### 3. Fix demonstrated layout and interaction problems

- Begin with production-hostname data, split by mobile and desktop where available. Exclude preview hosts and retain the measurement counts and reporting period.
- Run a bounded investigation of initial load, guide-link arrival, advanced-panel state, and style changes on the homepage, plus loading of the two leading style pages. Capture a layout-shift/interaction trace for reproduced problems before changing behavior.
- Check programmatic advanced-panel expansion and style size/quantity rebuilding as specific hypotheses. Verify whether expansion occurs and when; source code alone does not establish a layout shift or its cause. Cloudflare's highlighted elements are also investigation leads, not proven causes.
- Inspect font loading or broader rendering behavior only where the initial evidence points to it or the problem remains unexplained.
- Make targeted fixes and repeat the affected interaction and navigation paths. Preserve the generally good LCP result.

Completion check: before/after traces demonstrate the targeted improvement without regressions in calculator behavior. Track field p75 goals of CLS at or below 0.1, INP at or below 200 ms, and LCP at or below 2.5 seconds when suitable production data is available. Allow field data to accumulate while independent work continues; local results alone do not prove a field pass.

### 4. Establish reliable funnel and revenue measurement

- Replace the GA4 loader in `src/layouts/BaseLayout.astro` with the selected PostHog configuration and remove the `gtag` calls in `src/pages/index.astro`. Route the existing affiliate click instrumentation in `src/components/monetization/ProductRecommendations.astro` to PostHog as well, so the unchanged event set has one destination.
- Define and implement events for guide-to-calculator navigation, meaningful valid-recipe use, copy, print, share, affiliate exposure/clicks, email-form exposure, and confirmed signup.
- Count meaningful calculator use separately from its automatic initial render. Specify each event's trigger and avoid duplicate firing.
- Every event carries page, style, and placement identifiers, using explicit not-applicable values when a context has no style or placement; include product identifiers for product events. Verify `$host` is present and reports filter to `thepizzadoughformula.com`. Exclude email addresses and other personal identifiers from analytics events.
- Establish pizza-only Amazon tracking from the start, using a small set of separate tracking IDs for meaningful placements such as guide recommendations and calculator results where available. Maintain a placement-to-ID mapping and introduction dates; never reuse these IDs on other sites. Use event placement IDs for exposure/click analysis, and Amazon IDs for reported commission attribution. Keep earlier shared-ID revenue separate.
- Verify a confirmed signup with a test submission that appends one row to the Excel spreadsheet through the existing n8n webhook. The success event must represent a completed append; a client event or an HTTP response sent before the append completes is insufficient evidence. No confirmation email or delivery check is required.

Completion check: controlled actions appear once in PostHog with page, style, placement, and the correct host. The GA4 loader and calls are removed, PostHog loads deferred with the selected configuration independently of the former GA4 consent gate, and browser checks confirm no analytics cookies, exactly one localStorage identifier, no autocapture, and no change to the shared PostHog project's settings. A test signup produces one spreadsheet row and one corresponding confirmed-signup event. Each funnel numerator and denominator uses the same observed PostHog population and host filter, and future pizza affiliate results can be identified separately. Report spreadsheet signup totals and Amazon commissions separately from PostHog conversion rates; do not calculate sitewide revenue per visitor from mismatched sources.

### 5. Correct SEO and commercial representations

- Use stable canonical URLs and correct per-page structured data based on the live findings from step 1.
- Review homepage-filtered queries, its title, and its description explicitly. Make the calculator's purpose clear in the title while retaining the brand; the existing description already names the calculator, so check its feature claims rather than assuming it is missing. Compare subsequent relevant-query observations without treating one low-CTR sample as proof of a title defect.
- Make sitemap `lastmod` and displayed/structured publication dates reflect known content history; omit unsupported dates instead of resetting them on every build.
- Reconcile recipe ingredients, instructions, images, and durations with visible content and the actual formula. Preserve the observed recipe search visibility while correcting inconsistencies.
- Remove unsupported static prices, availability, offer counts, and related offer markup unless a current, permitted source supports them.
- Put understandable affiliate disclosure near recommendations and include the required Amazon identification statement.
- Update the cookie banner and privacy page to describe the PostHog configuration that actually runs, replacing GA4-specific consent and tracking descriptions: no analytics cookies, a local storage identifier that keeps a visitor's activity together across pages, and session replay with all form inputs masked. Distinguish analytics behavior from any functional browser storage that remains (such as the unit preference).
- Make privacy and newsletter copy state that submitted details are appended to an Excel spreadsheet through n8n. Do not promise confirmation emails, automated email delivery, or an unsubscribe path that does not exist. Check that AdSense is not unintentionally enabled in the deployed configuration.

Completion check: affected production-build pages have consistent visible content and metadata, validated applicable structured data, supported commercial claims, and accurate disclosures.

### 6. Improve the pages already attracting search traffic

- Start with `/pizza-styles/poolish-biga/` and `/pizza-styles/new-york/`, retaining their existing URLs.
- Address the relevant questions demonstrated by Search Console and the page's purpose. Add cited explanations, formula examples with explicit quantities, and schedules labeled as estimates with their assumptions.
- Add a focused Poolish/Biga comparison answering which method to choose, with sourced differences and clear calculator entry points. Treat the observed comparison queries as an editorial target, not a precise estimate of that page's English traffic.
- Make each guide's calculator entry restore the intended style and settings, using the corrected state handling from step 2.
- Explain how readers can adjust quantities and recognize limitations. Use informative diagrams where useful, with generated illustrations identified as illustrative.
- Keep the combined Poolish/Biga page unless stronger query and page evidence supports splitting it.

Completion check: each revised page answers its target questions, supplies traceable factual sources, and leads to a matching valid calculator result. It contains no unsupported claim of personal testing, ownership, or experience.

### 7. Add relevant monetization to useful visitor paths

- Place a small number of relevant recommendations on the entry pages and calculator paths where the equipment helps with the recipe.
- Base recommendations on documented specifications and suitability. For example, a scale presented for measuring subgram yeast must have appropriate precision.
- Explain the selection basis and distinguish researched recommendations from actual personal use. Avoid interrupting recipe access.
- Defer the email deliverable until a sending tool exists. Choosing that tool is a separate owner decision; the current spreadsheet capture does not provide email delivery.
- Evaluate performance using dedicated tracking and the events from step 4.

Completion check: recommendations match the page/style, disclosures are visible, and links and attribution work. The deferred email deliverable does not block this step. Revenue improvement is an outcome to observe, not a release claim.

### 8. Expand when measured demand supports it

- Review comparable reporting windows, including rolling 28-day Search Console results, with release dates and attribution changes recorded.
- Choose adjacent guides or tools from relevant search demand, repeated calculator use, and visitor feedback.
- Assess one Spanish Poolish/Biga page as the first language-expansion candidate. Obtain page-filtered queries and country breakdowns to verify relevance, compare demand across available periods, and establish a way to review the translated guidance. The existing Spanish query is enough to investigate this candidate now; it does not establish a corrected English CTR or justify automatic publication. Country and translated-result counts must not be added to query counts.
- Consider a paid guide or dough log only after a concrete need is demonstrated. Do not assume a subscription is justified.
- Use staged releases and descriptive comparisons at the current traffic level. Do not promise statistically conclusive A/B tests from a small sample.

Completion check for each expansion: record the supporting evidence, intended user benefit, success measure, and a decision to retain, revise, or stop after observation. There is no guaranteed traffic or revenue target.

## Dependencies and delivery approach

Step 1 establishes which source findings apply to production. Step 2a can proceed as soon as its deployed baseline and reproduction are established, while unrelated baseline checks continue. Independent calculator, performance, and measurement work may then proceed in parallel. Use isolated branches or worktrees for implementation, assign ownership of shared files such as `src/pages/index.astro`, and integrate changes sequentially.

Step 2a may restore existing guide links independently; step 2b must pass before expanding promotion of shared recipes or exports. Step 4 implements the owner's PostHog and spreadsheet-signup decisions above and must pass before attributing revenue changes to this site or evaluating funnel improvements. Step 5 may overlap independent foundation work; its cookie-banner and privacy/newsletter copy must accompany the step 4 release so published descriptions match actual behavior. Content preparation for step 6 and the Spanish-demand assessment in step 8 can proceed while coding continues, provided their factual claims have sources. Step 7 depends on accurate content, a reliable calculator, and verified attribution; its email deliverable remains deferred pending the separate sending-tool decision.

For each implementation change, record the defect or intended behavior, the verification performed, and any remaining limitation. Calculator changes need focused numerical and browser regressions. Visual/CSS changes need development and production-build checks under the repository's workflow. Check live behavior after an authorized release and keep releases reversible. Creating this ADR does not itself implement or deploy these changes.

## Implementation map

Paths below refer to the reviewed repository snapshot and identify starting points, not a requirement to rewrite every listed file.

| Area | Starting files |
| --- | --- |
| Formula, precision, presets | `src/scripts/calculator/engine.js`, `src/scripts/calculator/units.js`, `src/scripts/calculator/presets.js` |
| Initialization, input state, outputs, sharing | `src/pages/index.astro`, `src/scripts/features/shareRecipe.js`, `src/components/calculator/AdvancedOptions.astro`, `src/components/calculator/RecipeOutput.astro` |
| Regression coverage | `tests/calculator.spec.ts`, with focused numerical tests added for formula/state behavior |
| Layout and interaction | `src/components/calculator/BasicInputs.astro`, `src/components/global/Header.astro`, `src/styles/global.css`, `src/layouts/BaseLayout.astro` |
| Landing pages, schema, canonical URLs, sitemap | `src/pages/pizza-styles/[style].astro`, `src/layouts/BaseLayout.astro`, `astro.config.mjs` |
| Recommendations and disclosures | `src/components/monetization/ProductRecommendations.astro`, `src/data/affiliateProducts.json`, `src/pages/affiliate-disclosure.astro` |
| PostHog setup and GA4 removal | `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `src/components/monetization/ProductRecommendations.astro` |
| Consent, signup, factual representations | `src/components/global/CookieConsent.astro`, `src/pages/index.astro`, `src/pages/privacy.astro`, `src/pages/about.astro` |

## Alternatives and consequences

Publishing many new pages first would spread work beyond the two pages producing most observed search clicks while leaving recipe defects in place. A paid calculator or subscription would introduce commercial complexity before demand is established. A rewrite or domain merger would add migration risk without evidence that the current stack or domain separation causes the observed problems. These options are deferred.

The chosen approach preserves existing search entry points and concentrates development on defects that affect the product's usefulness. It also makes future affiliate results interpretable. Its cost is that larger content and paid-product expansion waits for a dependable foundation and evidence.

Research and software tests cannot replace empirical baking evidence. Content must describe sourced methods and estimates honestly, with illustrations identified as illustrative and without promising tested outcomes. The owner has no time for test bakes or original photos at this stage; neither is a prerequisite for this plan.

Revisit priorities when production findings contradict the audit, sufficiently scoped performance data changes the diagnosis, or sustained usage and attributable revenue justify a specific expansion. Changes to the owner's exclusions require an explicit change in direction.

## Evidence and reference notes

The source reports remain outside the repository. Their contents are evidence, not instructions or authority to change scope.

- Owner decisions recorded September 13, 2026: replace GA4 with the specified shared US PostHog project and site host filter; the n8n webhook currently appends signup rows to Excel, without email sending or an unsubscribe path; defer the email deliverable until a separately selected sending tool exists. These statements supersede the earlier GA4-cohort choice and unknown-email-workflow assumptions. No test submission has been performed as part of this documentation amendment.
- [PostHog configuration](https://posthog.com/docs/libraries/js/config) and [persistence documentation](https://posthog.com/docs/libraries/js/persistence) support the localStorage persistence settings. The project token was confirmed against the owner's PostHog account on September 13, 2026. The Excel workflow is owner-reported baseline information.
- Search Console: `thepizzadoughformula.com-Performance-on-Search-2026-09-13.xlsx`; Chart rows 2-29, Pages rows 2-4, Devices rows 2-4, and Search appearance row 2. Actual chart dates are August 14 through September 10 despite the export filename.
- [Search Console dimensions and data groupings](https://support.google.com/webmasters/answer/17011259) explains query omissions and the meaning of page/country dimensions. Additional opportunity figures above come from the Queries and Pages sheets, without joining independent aggregates.
- Corrected Cloudflare report: three-page Web Analytics PDF titled `thepizzadoughformula.pages.dev +2`, replacement saved September 13, 2026 at 10:01:57; 158,273 bytes; SHA-256 `435099ab9c3f9d41dfe7ce3f6deb827013414d9e3983df5fec2d7caabe05ec75`. This identifies the replacement because the incorrect report used the same filename.
- Amazon: `Screenshot 2026-09-13 095854.png`, supplemented by the owner's confirmation that the tracking ID is shared across sites.
- [Google recipe structured data](https://developers.google.com/search/docs/appearance/structured-data/recipe) supports the recipe validation work; eligibility does not guarantee display.
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) supports meaningful modification dates.
- [Core Web Vitals definitions and thresholds](https://web.dev/articles/vitals) and [Cloudflare's measurement documentation](https://developers.cloudflare.com/web-analytics/data-metrics/core-web-vitals/) define the performance measures used above.
- [Amazon Associates policies](https://affiliate-program.amazon.com/help/operating/policies) and [identification/disclosure guidance](https://affiliate-program.amazon.com/help/node/topic/GPXFHVYZMTGPUMPE) are references for the affiliate cleanup. Recheck applicable requirements during implementation.
