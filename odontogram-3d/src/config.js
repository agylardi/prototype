/**
 * Single source of tunables. Anything here can be overridden per-session with a
 * query string, which keeps QA and client review quick:
 *
 *   ?model=./public/models/odontogram.glb
 *   ?source=http&url=https://api.example.com/patients/42/chart&poll=5000
 *   ?source=ws&url=wss://api.example.com/charts/42
 *   ?numbering=universal&orbit=1&debug=1
 */

const params = new URLSearchParams(globalThis.location?.search ?? '');
const num = (key, fallback) => (params.has(key) ? Number(params.get(key)) : fallback);
const bool = (key, fallback) => (params.has(key) ? params.get(key) !== '0' && params.get(key) !== 'false' : fallback);

export const CONFIG = {
  model: {
    /** Drop the client's export here. If it 404s we fall back to the stand-in mesh. */
    url: params.get('model') ?? './public/models/odontogram.glb',
    /** Optional explicit node→tooth map for exports whose names we cannot parse. */
    mapUrl: params.get('map') ?? './public/models/tooth-map.json',
    dracoPath: 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/',
    /** Fit the loaded model to this height in world units. */
    targetHeight: 2.4,
  },

  chart: {
    /** 'http' | 'ws' | 'mock' */
    source: params.get('source') ?? 'http',
    url: params.get('url') ?? './api/chart.example.json',
    /** ms between polls; 0 disables polling. */
    pollMs: num('poll', 0),
    /** How ids in the payload are numbered. 'auto' sniffs the first response. */
    numbering: params.get('numbering') ?? 'auto',
  },

  camera: {
    fov: 32,
    position: [0, 0.25, 7.6],
    /** Aimed a little below centre so the arch sits above the chart panel. */
    target: [0, -0.3, 0],
    near: 0.1,
    far: 100,
  },

  /** Subtle "alive" motion. Amplitudes are world units / radians. */
  parallax: {
    enabled: bool('parallax', true),
    cameraShift: [0.42, 0.26],      // x, y translation of the camera rig
    targetShift: [0.09, 0.06],      // counter-shift of the look-at point
    modelTilt: [0.075, 0.055],      // yaw, pitch of the model itself
    lightShift: [1.5, 1.1],         // key light travel
    /** Higher = snappier. Frame-rate independent (exponential damping). */
    damping: 3.2,
    /** Degrees of device tilt that map to full deflection. */
    tiltRangeDeg: 22,
    /** Idle drift keeps the scene breathing when nothing is touching it. */
    idle: { enabled: true, amplitude: 0.18, speed: 0.14, delayMs: 2600 },
  },

  controls: {
    /** Orbit is off by default — the parallax rig owns the camera. */
    orbit: bool('orbit', false),
  },

  transition: {
    /** Crossfade between tooth states, ms. */
    durationMs: num('fade', 320),
  },

  debug: bool('debug', false),
};

export const prefersReducedMotion =
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
