import * as THREE from 'three';

/**
 * Turns pointer events into tooth selections.
 *
 * Only fires on a genuine tap: if the pointer travelled more than a few pixels
 * between down and up it was an orbit or a scroll, not a pick.
 */
export class Picker {
  #raycaster = new THREE.Raycaster();
  #pointer = new THREE.Vector2();
  #down = null;
  #listeners = [];
  #hovered = null;
  #hoverEnabled = false;
  #lastHoverAt = 0;

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {THREE.Camera} camera
   * @param {{pickables: THREE.Object3D[]}} model
   * @param {{onSelect?:(fdi:number|null)=>void, onHover?:(fdi:number|null)=>void}} handlers
   */
  constructor(canvas, camera, model, { onSelect, onHover } = {}) {
    this.canvas = canvas;
    this.camera = camera;
    this.model = model;
    this.onSelect = onSelect;
    this.onHover = onHover;

    const track = (event) => {
      const rect = canvas.getBoundingClientRect();
      this.#pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      );
    };

    const onDown = (event) => {
      track(event);
      this.#down = { x: event.clientX, y: event.clientY, time: performance.now() };
    };

    const onUp = (event) => {
      if (!this.#down) return;
      const travelled = Math.hypot(event.clientX - this.#down.x, event.clientY - this.#down.y);
      const elapsed = performance.now() - this.#down.time;
      this.#down = null;
      if (travelled > 8 || elapsed > 700) return;
      track(event);
      this.onSelect?.(this.#pick());
    };

    const onMove = (event) => {
      if (event.pointerType !== 'mouse') return;
      track(event);
      this.#hoverEnabled = true;
    };

    const onLeave = () => {
      this.#hoverEnabled = false;
      this.#setHovered(null);
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerleave', onLeave);
    this.#listeners.push(
      () => canvas.removeEventListener('pointerdown', onDown),
      () => canvas.removeEventListener('pointerup', onUp),
      () => canvas.removeEventListener('pointermove', onMove),
      () => canvas.removeEventListener('pointerleave', onLeave),
    );
  }

  #pick() {
    this.#raycaster.setFromCamera(this.#pointer, this.camera);
    const hits = this.#raycaster.intersectObjects(this.model.pickables, false);
    return hits.length ? hits[0].object.userData.fdi ?? null : null;
  }

  #setHovered(fdi) {
    if (this.#hovered === fdi) return;
    this.#hovered = fdi;
    this.canvas.style.cursor = fdi == null ? '' : 'pointer';
    this.onHover?.(fdi);
  }

  /**
   * Called from the frame loop so hover tracks the parallaxing camera too.
   * Throttled — hover does not need to resolve at 60 Hz.
   */
  update() {
    if (!this.#hoverEnabled) return;
    const now = performance.now();
    if (now - this.#lastHoverAt < 40) return;
    this.#lastHoverAt = now;
    this.#setHovered(this.#pick());
  }

  dispose() {
    for (const off of this.#listeners) off();
    this.#listeners = [];
  }
}
