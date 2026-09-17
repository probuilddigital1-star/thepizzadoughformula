/**
 * Cookie-free analytics wrapper (PostHog).
 *
 * Mirrors src/lib/analytics.ts in the freezerbatchcocktails.com repository: the same posthog-js
 * settings and the same fail-closed, queued loading. Events and their properties are documented in
 * docs/analytics-events.md.
 *
 * - Fail closed. With no `PUBLIC_POSTHOG_KEY` at build time, or with Do Not Track set, every entry
 *   point here is a no-op and nothing is loaded or sent.
 * - No personal data. `sanitizeProps` drops anything that is not a primitive or a short list of
 *   strings, any string longer than 64 characters, and anything that looks like an email address.
 *   Style ids, placements, product ids, units, and booleans are the intended payload.
 * - Never break the feature. `track` swallows every error: analytics failures must not affect the
 *   calculator, sharing, or the newsletter forms.
 * - Session replay runs with every input masked, so a typed value cannot reach PostHog through a
 *   recording any more than it can through `track`.
 * - Identity is a random id in first-party localStorage, never a cookie, so it is not attached to
 *   requests and no other site can read it.
 *
 * Nothing outside this module imports `posthog-js` directly.
 */

/** Events this site sends. Keep in sync with docs/analytics-events.md. */
export type AnalyticsEvent =
  | 'guide_to_calculator'
  | 'calculator_used'
  | 'recipe_invalid'
  | 'recipe_copied'
  | 'recipe_printed'
  | 'recipe_shared'
  | 'affiliate_exposure'
  | 'affiliate_click'
  | 'newsletter_form_viewed'
  | 'newsletter_signup_submitted';

/** Property values we are willing to send. Anything else is dropped. */
export type EventProps = Record<string, string | number | boolean | string[]>;

interface AnalyticsClient {
  capture(event: string, props?: EventProps): void;
}

/** PostHog US cloud, as recorded in docs/adr/0001-calculator-reliability-and-organic-growth.md. */
const POSTHOG_HOST = 'https://us.i.posthog.com';

/** Value of `style` and `placement` on events that have no style or placement. */
const NOT_APPLICABLE = 'none';

/** Strings longer than this are assumed to be free text and are dropped. */
const MAX_STRING_LENGTH = 64;

/** Longest list property kept: the product ids shown in one recommendations block. */
const MAX_LIST_LENGTH = 20;

/** Deliberately loose: we want false positives here, not false negatives. */
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;

let client: AnalyticsClient | null = null;
let enabled = false;
let initialized = false;
/**
 * `initAnalytics` is async (it dynamically imports posthog-js), but events can fire before it
 * settles: the homepage records guide_to_calculator while it initializes. Buffer those instead of
 * dropping them, then flush once we know whether analytics is permitted. Bounded so a disabled
 * build cannot grow this without limit.
 */
let ready = false;
const MAX_QUEUED_EVENTS = 50;
const queue: Array<{ event: AnalyticsEvent; props: EventProps }> = [];

/** Analytics runs only with a key present and Do Not Track unset. */
export function analyticsAllowed(key: string | undefined | null, doNotTrack: string | null | undefined): boolean {
  if (typeof key !== 'string' || key.trim() === '') return false;
  return doNotTrack !== '1';
}

function isSafeString(value: string): boolean {
  return value.length <= MAX_STRING_LENGTH && !EMAIL_PATTERN.test(value);
}

/**
 * Reduce arbitrary input to the primitive, non-identifying subset we allow. Silently drops anything
 * questionable rather than throwing: a bad property must never cost us the event, and must never leak.
 */
export function sanitizeProps(props?: Record<string, unknown> | null): EventProps {
  const safe: EventProps = {};
  if (!props || typeof props !== 'object') return safe;

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'boolean') {
      safe[key] = value;
      continue;
    }
    if (typeof value === 'number') {
      // NaN/Infinity serialize badly and carry no analytical meaning.
      if (Number.isFinite(value)) safe[key] = value;
      continue;
    }
    if (typeof value === 'string') {
      if (isSafeString(value)) safe[key] = value;
      continue;
    }
    if (Array.isArray(value)) {
      // Lists are kept only whole: every item a safe string, and not too many of them.
      if (value.length <= MAX_LIST_LENGTH && value.every((item) => typeof item === 'string' && isSafeString(item))) {
        safe[key] = value as string[];
      }
      continue;
    }
    // Objects, null, undefined, functions, symbols: dropped.
  }

  return safe;
}

/**
 * Every event carries `page` (the pathname), `style` (a preset id or 'none'), and `placement`
 * ('none' where not applicable). Call sites pass style and placement when they apply.
 */
function withContext(props: EventProps): EventProps {
  const page = typeof window === 'undefined' ? '' : window.location.pathname;
  return {
    ...props,
    page: typeof props.page === 'string' ? props.page : page,
    style: typeof props.style === 'string' ? props.style : NOT_APPLICABLE,
    placement: typeof props.placement === 'string' ? props.placement : NOT_APPLICABLE,
  };
}

function readEnvKey(): string | undefined {
  try {
    return import.meta.env?.PUBLIC_POSTHOG_KEY as string | undefined;
  } catch {
    return undefined;
  }
}

/**
 * Test-only: posthog-js gzips event payloads by default. playwright.analytics.config.ts builds with
 * PUBLIC_POSTHOG_TEST_DISABLE_COMPRESSION=true so tests can read what is sent. Never set it for a
 * deployed build.
 */
function readTestDisableCompression(): boolean {
  try {
    return import.meta.env?.PUBLIC_POSTHOG_TEST_DISABLE_COMPRESSION === 'true';
  } catch {
    return false;
  }
}

function readDoNotTrack(): string | null {
  if (typeof navigator === 'undefined') return null;
  return navigator.doNotTrack ?? null;
}

/**
 * Initialise analytics at most once. Safe to call unconditionally: it returns without loading
 * anything when analytics is not permitted.
 */
export async function initAnalytics(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const key = readEnvKey();
  if (!analyticsAllowed(key, readDoNotTrack())) {
    settle();
    return;
  }

  try {
    // Dynamic import keeps posthog-js out of the main bundle and off the network entirely when
    // analytics is disabled.
    const { default: posthog } = await import('posthog-js');
    posthog.init(key as string, {
      api_host: POSTHOG_HOST,
      autocapture: false,
      capture_pageview: true,
      // First-party localStorage, never a cookie. Every navigation on this static site is a full
      // page load, so 'memory' would count one visitor as a new visitor on every page.
      persistence: 'localStorage',
      person_profiles: 'identified_only',
      // Replay masks every input, so an email address typed into a form cannot land in a recording.
      session_recording: { maskAllInputs: true },
      // Error autocapture: an uncaught script failure is otherwise invisible.
      capture_exceptions: true,
      // Absent from deployed builds, so they use exactly the settings above.
      ...(readTestDisableCompression() ? { disable_compression: true } : {}),
    });
    client = posthog as unknown as AnalyticsClient;
    enabled = true;
  } catch {
    // Blocked by an extension, offline, chunk failed: stay silent and disabled.
    client = null;
    enabled = false;
  }

  settle();
}

/**
 * Mark init complete and drain anything captured while it was in flight: forwarded when analytics
 * is on, discarded when it is off.
 */
function settle(): void {
  ready = true;
  if (enabled && client) {
    for (const queued of queue.splice(0, queue.length)) {
      try {
        client.capture(queued.event, queued.props);
      } catch {
        // Same contract as track(): never surface an analytics failure.
      }
    }
  }
  queue.length = 0;
}

/**
 * Record an event. Never throws, never blocks, and no-ops whenever analytics is disabled, so call
 * sites can use it without defensive wrapping.
 */
export function track(event: AnalyticsEvent, props?: Record<string, unknown> | null): void {
  if (typeof event !== 'string' || event === '') return;

  // Sanitize up front so queued events carry no personal data even before we know whether
  // analytics is enabled.
  const safeProps = withContext(sanitizeProps(props));

  if (!ready) {
    if (queue.length < MAX_QUEUED_EVENTS) queue.push({ event, props: safeProps });
    return;
  }

  if (!enabled || !client) return;
  try {
    client.capture(event, safeProps);
  } catch {
    // Analytics must never surface an error to the user-facing flow.
  }
}
