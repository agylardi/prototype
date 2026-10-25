import { CONFIG } from './config.js';
import { STATE, resolveState } from './toothStates.js';
import { FDI_CODES, detectNumbering, fdiToUniversal, toFDI } from './numbering.js';

/**
 * The seam between the scene and whatever the backend happens to be.
 *
 * Accepts any of these shapes, in FDI or Universal numbering:
 *   { "teeth": { "1": "healthy", "3": "unhealthy" } }
 *   { "teeth": [ { "id": 1, "state": "healthy" } ] }
 *   [ { "tooth": 11, "status": "decayed" } ]
 *
 * Emits:
 *   'change' → detail { chart: Map<fdi,state>, changed: number[] }
 *   'status' → detail { level, message }
 */
export class ChartService extends EventTarget {
  #chart = new Map();
  #timer = null;
  #socket = null;
  #retry = 0;
  #stopped = false;
  #scheme = null;

  constructor(options = {}) {
    super();
    this.options = { ...CONFIG.chart, ...options };
    this.writable = true;
  }

  get chart() {
    return this.#chart;
  }

  #status(level, message) {
    this.dispatchEvent(new CustomEvent('status', { detail: { level, message } }));
  }

  #emit(changed) {
    if (!changed.length) return;
    this.dispatchEvent(new CustomEvent('change', { detail: { chart: this.#chart, changed } }));
  }

  async start() {
    this.#stopped = false;
    switch (this.options.source) {
      case 'ws': return this.#startSocket();
      case 'mock': return this.#startMock();
      default: return this.#startHttp();
    }
  }

  stop() {
    this.#stopped = true;
    clearInterval(this.#timer);
    this.#socket?.close();
    this.#socket = null;
  }

  /* ---------------------------------------------------------------- *
   * Sources
   * ---------------------------------------------------------------- */

  async #startHttp() {
    this.#status('loading', 'Loading chart…');
    await this.refresh();
    if (this.options.pollMs > 0) {
      this.#timer = setInterval(() => this.refresh(), this.options.pollMs);
    }
  }

  async refresh() {
    try {
      const response = await fetch(this.options.url, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const changed = this.merge(await response.json());
      this.#status('live', this.options.pollMs > 0 ? 'Live · polling' : 'Chart loaded');
      this.#emit(changed);
    } catch (error) {
      this.#status('error', `Could not load the chart (${error.message}). Showing the last known values.`);
      if (this.#chart.size === 0) {
        this.#emit(this.merge(buildDemoChart()));
        this.#status('warn', 'Backend unreachable — running on demo data.');
      }
    }
  }

  #startSocket() {
    this.#status('loading', 'Connecting…');
    const socket = new WebSocket(this.options.url);
    this.#socket = socket;

    socket.addEventListener('open', () => {
      this.#retry = 0;
      this.#status('live', 'Live · connected');
    });
    socket.addEventListener('message', (event) => {
      try {
        this.#emit(this.merge(JSON.parse(event.data)));
      } catch (error) {
        console.warn('[chart] unreadable message', error);
      }
    });
    socket.addEventListener('close', () => {
      if (this.#stopped) return;
      // Exponential backoff, capped, so a flapping server does not spin the tab.
      const delay = Math.min(1000 * 2 ** this.#retry++, 15000);
      this.#status('warn', `Disconnected — retrying in ${Math.round(delay / 1000)}s`);
      setTimeout(() => !this.#stopped && this.#startSocket(), delay);
    });
    socket.addEventListener('error', () => socket.close());
  }

  #startMock() {
    this.#emit(this.merge(buildDemoChart()));
    this.#status('live', 'Demo data · no backend');
  }

  /* ---------------------------------------------------------------- *
   * Writes
   * ---------------------------------------------------------------- */

  /**
   * Optimistic write: the scene updates immediately, the request follows.
   * A static host will reject the PATCH; that is expected in the demo and only
   * downgrades the status line.
   */
  async setTooth(fdi, state) {
    const changed = this.#assign(fdi, state);
    this.#emit(changed);
    if (!this.writable) return;

    const id = this.#scheme === 'universal' ? fdiToUniversal(fdi) : fdi;
    try {
      if (this.#socket?.readyState === WebSocket.OPEN) {
        this.#socket.send(JSON.stringify({ type: 'setTooth', id, state }));
        return;
      }
      if (this.options.source !== 'http') return;
      const response = await fetch(this.options.url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teeth: { [id]: state } }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch {
      this.writable = false;
      this.#status('warn', 'Read-only source — edits stay in this browser.');
    }
  }

  /* ---------------------------------------------------------------- *
   * Normalisation
   * ---------------------------------------------------------------- */

  /** Merge a payload into the chart. @returns {number[]} FDI codes that changed. */
  merge(payload) {
    const pairs = flatten(payload);
    if (!pairs.length) return [];

    if (!this.#scheme) {
      // Trust the payload if it says which scheme it uses, then sniff, then
      // fall back to FDI.
      const declared = ['fdi', 'universal'].includes(payload?.numbering) ? payload.numbering : null;
      this.#scheme = this.options.numbering === 'auto'
        ? (declared ?? detectNumbering(pairs.map(([id]) => id)) ?? 'fdi')
        : this.options.numbering;
    }

    const changed = [];
    for (const [id, rawState] of pairs) {
      const fdi = toFDI(id, this.#scheme);
      const state = resolveState(rawState);
      if (!fdi) { console.warn(`[chart] unknown tooth id "${id}"`); continue; }
      if (!state) { console.warn(`[chart] unknown state "${rawState}" for tooth ${id}`); continue; }
      changed.push(...this.#assign(fdi, state));
    }
    return changed;
  }

  #assign(fdi, state) {
    if (this.#chart.get(fdi) === state) return [];
    this.#chart.set(fdi, state);
    return [fdi];
  }
}

/** Pull [id, state] pairs out of any of the supported payload shapes. */
function flatten(payload) {
  const source = Array.isArray(payload) ? payload : payload?.teeth ?? payload?.chart ?? payload;
  if (!source) return [];

  if (Array.isArray(source)) {
    return source
      .map((item) => [item.id ?? item.tooth ?? item.number ?? item.fdi, item.state ?? item.status ?? item.condition])
      .filter(([id, state]) => id != null && state != null);
  }
  if (typeof source === 'object') {
    return Object.entries(source)
      .filter(([, value]) => typeof value === 'string' || typeof value === 'number' || value?.state)
      .map(([id, value]) => [id, typeof value === 'object' ? value.state : value]);
  }
  return [];
}

/** Plausible-looking chart used when there is no backend to talk to. */
export function buildDemoChart() {
  const teeth = {};
  const flagged = {
    18: STATE.MISSING, 26: STATE.UNHEALTHY, 27: STATE.VERY_UNHEALTHY,
    36: STATE.VERY_UNHEALTHY, 37: STATE.MISSING, 45: STATE.UNHEALTHY,
    12: STATE.UNHEALTHY, 48: STATE.MISSING,
  };
  for (const fdi of FDI_CODES) teeth[fdi] = flagged[fdi] ?? STATE.HEALTHY;
  return { teeth };
}
