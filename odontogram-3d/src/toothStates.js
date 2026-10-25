/**
 * Canonical tooth states and the alias resolution used to map whatever the
 * backend and the 3D artist call things onto one vocabulary.
 *
 * Everything downstream (model, UI, API) speaks only these four strings.
 */

export const STATE = Object.freeze({
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
  VERY_UNHEALTHY: 'very-unhealthy',
  MISSING: 'missing',
});

/** Ordered for UI display: best to worst, absence last. */
export const STATE_ORDER = [STATE.HEALTHY, STATE.UNHEALTHY, STATE.VERY_UNHEALTHY, STATE.MISSING];

export const STATE_LABEL = Object.freeze({
  [STATE.HEALTHY]: 'Healthy',
  [STATE.UNHEALTHY]: 'Unhealthy',
  [STATE.VERY_UNHEALTHY]: 'Very unhealthy',
  [STATE.MISSING]: 'Missing',
});

/**
 * Alias table. Keys are normalised (lowercase, non-alphanumerics stripped).
 * Extend this when the client's model or API uses different wording — it is
 * the single place that needs touching.
 */
const STATE_ALIASES = new Map(Object.entries({
  // healthy
  healthy: STATE.HEALTHY, health: STATE.HEALTHY, good: STATE.HEALTHY, ok: STATE.HEALTHY,
  clean: STATE.HEALTHY, sound: STATE.HEALTHY, normal: STATE.HEALTHY, state1: STATE.HEALTHY,
  s1: STATE.HEALTHY, lvl0: STATE.HEALTHY, '0': STATE.HEALTHY, '1': STATE.HEALTHY,
  // unhealthy
  unhealthy: STATE.UNHEALTHY, decayed: STATE.UNHEALTHY, decay: STATE.UNHEALTHY,
  caries: STATE.UNHEALTHY, cavity: STATE.UNHEALTHY, bad: STATE.UNHEALTHY, mid: STATE.UNHEALTHY,
  medium: STATE.UNHEALTHY, state2: STATE.UNHEALTHY, s2: STATE.UNHEALTHY, lvl1: STATE.UNHEALTHY,
  '2': STATE.UNHEALTHY,
  // very unhealthy
  veryunhealthy: STATE.VERY_UNHEALTHY, severe: STATE.VERY_UNHEALTHY, verybad: STATE.VERY_UNHEALTHY,
  critical: STATE.VERY_UNHEALTHY, advanced: STATE.VERY_UNHEALTHY, worst: STATE.VERY_UNHEALTHY,
  state3: STATE.VERY_UNHEALTHY, s3: STATE.VERY_UNHEALTHY, lvl2: STATE.VERY_UNHEALTHY,
  '3': STATE.VERY_UNHEALTHY,
  // missing / empty gum
  missing: STATE.MISSING, empty: STATE.MISSING, none: STATE.MISSING, extracted: STATE.MISSING,
  absent: STATE.MISSING, gap: STATE.MISSING, socket: STATE.MISSING, gum: STATE.MISSING,
  emptygum: STATE.MISSING, state4: STATE.MISSING, s4: STATE.MISSING, '4': STATE.MISSING,
}));

const normalise = (value) => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');

/** @returns {string|null} canonical state, or null if unrecognised. */
export function resolveState(value) {
  if (value == null) return null;
  return STATE_ALIASES.get(normalise(value)) ?? null;
}

/* ------------------------------------------------------------------ *
 * Node name parsing
 * ------------------------------------------------------------------ */

/**
 * Patterns tried in order against every node name in the glTF.
 * Each must expose named groups `tooth` and `state`.
 *
 * Matches, among others:
 *   tooth_11_healthy      Tooth-11-very_unhealthy    T11.Severe
 *   tooth11_state3        gum_11_empty               Tooth_11_VeryUnhealthy
 */
const NAME_PATTERNS = [
  /(?:^|[^a-z0-9])(?:tooth|teeth|t|gum|socket)[\s._-]*(?<tooth>\d{1,2})[\s._-]+(?<state>[a-z0-9_\s-]+?)(?:[\s._-]*(?:mesh|geo|geometry|\d{3})?)?$/i,
  /(?:^|[^a-z0-9])(?<state>very[\s._-]*unhealthy|unhealthy|healthy|missing|empty)[\s._-]+(?:tooth|t)?[\s._-]*(?<tooth>\d{1,2})$/i,
];

/**
 * Parse a scene-graph node name into { tooth, state }.
 * @param {string} name
 * @returns {{tooth:number, state:string}|null}
 */
export function parseNodeName(name) {
  if (!name) return null;
  const cleaned = name.replace(/[\s._-]*(mesh|geo|geometry|lp|hp)?(\.\d+|_\d{3})?$/i, '');
  for (const pattern of NAME_PATTERNS) {
    const match = pattern.exec(cleaned) ?? pattern.exec(name);
    if (!match?.groups) continue;
    const state = resolveState(match.groups.state);
    const tooth = Number.parseInt(match.groups.tooth, 10);
    if (state && Number.isFinite(tooth)) return { tooth, state };
  }
  return null;
}
