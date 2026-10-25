import { MathUtils } from 'three';
import { CONFIG, prefersReducedMotion } from './config.js';

const clamp = (v) => MathUtils.clamp(v, -1, 1);

/**
 * Produces a smoothed deflection in [-1, 1] on both axes from whichever input
 * the device offers: cursor on desktop, gyroscope on mobile.
 *
 * Notes on the mobile path:
 *  - The first few readings become the neutral pose, so the effect works the
 *    same whether the phone is held flat or upright.
 *  - Screen orientation is compensated, so landscape does not invert the axes.
 *  - iOS 13+ requires a user gesture before it will emit events at all; call
 *    `requestPermission()` from a click handler.
 */
export class ParallaxController {
  #target = { x: 0, y: 0 };
  #current = { x: 0, y: 0 };
  #calibration = null;
  #samples = [];
  #lastInputAt = 0;
  #elapsed = 0;
  #listeners = [];

  constructor(element = document.body) {
    this.element = element;
    this.source = 'idle';
    this.enabled = CONFIG.parallax.enabled && !prefersReducedMotion;
    this.motionActive = false;
    if (this.enabled) this.#bindPointer();
  }

  /** True when the platform will not deliver tilt events without a gesture. */
  get needsPermission() {
    return typeof DeviceOrientationEvent !== 'undefined'
      && typeof DeviceOrientationEvent.requestPermission === 'function'
      && !this.motionActive;
  }

  get hasMotionSupport() {
    return typeof DeviceOrientationEvent !== 'undefined';
  }

  #bindPointer() {
    const onMove = (event) => {
      // A tilt-capable device that is also being touched should not fight itself.
      if (this.motionActive && event.pointerType !== 'mouse') return;
      const rect = this.element.getBoundingClientRect();
      this.#target.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1);
      this.#target.y = clamp(-(((event.clientY - rect.top) / rect.height) * 2 - 1));
      this.source = 'pointer';
      this.#lastInputAt = performance.now();
    };
    const onLeave = () => { this.#target.x = 0; this.#target.y = 0; };

    globalThis.addEventListener('pointermove', onMove, { passive: true });
    this.element.addEventListener('pointerleave', onLeave, { passive: true });
    this.#listeners.push(
      () => globalThis.removeEventListener('pointermove', onMove),
      () => this.element.removeEventListener('pointerleave', onLeave),
    );
  }

  /** Start listening for tilt. Resolves false if the user declines. */
  async requestPermission() {
    if (!this.hasMotionSupport) return false;
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response !== 'granted') return false;
      } catch {
        return false;
      }
    }
    this.#startMotion();
    return true;
  }

  /** Attach tilt listening without prompting (Android and older iOS). */
  enableMotion() {
    if (!this.hasMotionSupport) return false;
    if (typeof DeviceOrientationEvent.requestPermission === 'function') return false;
    this.#startMotion();
    return true;
  }

  #startMotion() {
    if (this.motionActive) return;
    this.motionActive = true;
    this.#calibration = null;
    this.#samples = [];

    const onOrientation = (event) => {
      if (event.beta == null || event.gamma == null) return;

      // Average the opening readings into a neutral pose.
      if (!this.#calibration) {
        this.#samples.push({ beta: event.beta, gamma: event.gamma });
        if (this.#samples.length < 6) return;
        const mean = this.#samples.reduce(
          (acc, s) => ({ beta: acc.beta + s.beta / this.#samples.length, gamma: acc.gamma + s.gamma / this.#samples.length }),
          { beta: 0, gamma: 0 },
        );
        this.#calibration = mean;
      }

      const range = CONFIG.parallax.tiltRangeDeg;
      let dx = (event.gamma - this.#calibration.gamma) / range;
      let dy = -(event.beta - this.#calibration.beta) / range;

      switch (screen.orientation?.angle ?? globalThis.orientation ?? 0) {
        case 90: [dx, dy] = [-dy, dx]; break;
        case -90: case 270: [dx, dy] = [dy, -dx]; break;
        case 180: [dx, dy] = [-dx, -dy]; break;
        default: break;
      }

      this.#target.x = clamp(dx);
      this.#target.y = clamp(dy);
      this.source = 'motion';
      this.#lastInputAt = performance.now();
    };

    globalThis.addEventListener('deviceorientation', onOrientation, { passive: true });
    this.#listeners.push(() => globalThis.removeEventListener('deviceorientation', onOrientation));
  }

  /** Re-centre the neutral pose at the phone's current attitude. */
  recalibrate() {
    this.#calibration = null;
    this.#samples = [];
  }

  /**
   * @param {number} delta seconds since last frame
   * @returns {{x:number, y:number}} smoothed deflection
   */
  update(delta) {
    if (!this.enabled) return this.#current;
    this.#elapsed += delta;

    const idle = CONFIG.parallax.idle;
    let { x, y } = this.#target;

    if (idle.enabled && performance.now() - this.#lastInputAt > idle.delayMs) {
      // Two incommensurate frequencies avoid an obvious loop.
      const t = this.#elapsed * idle.speed * Math.PI * 2;
      x = Math.sin(t) * idle.amplitude;
      y = Math.sin(t * 0.73 + 1.2) * idle.amplitude * 0.6;
      this.source = 'idle';
    }

    const lambda = CONFIG.parallax.damping;
    this.#current.x = MathUtils.damp(this.#current.x, x, lambda, delta);
    this.#current.y = MathUtils.damp(this.#current.y, y, lambda, delta);
    return this.#current;
  }

  dispose() {
    for (const off of this.#listeners) off();
    this.#listeners = [];
  }
}
