import * as THREE from 'three';
import { CONFIG, prefersReducedMotion } from './config.js';
import { STATE, parseNodeName } from './toothStates.js';
import { detectNumbering, toFDI, toothInfo } from './numbering.js';

const HIGHLIGHT_COLOR = new THREE.Color('#4fd1c5');

const eachMaterial = (mesh, fn) => {
  if (Array.isArray(mesh.material)) mesh.material.forEach(fn);
  else if (mesh.material) fn(mesh.material);
};

/**
 * Wraps the loaded glTF scene and exposes it as an odontogram:
 * `setState(11, 'unhealthy')` rather than a pile of node visibility toggles.
 *
 * The client's export only has to follow a naming convention — one node (mesh
 * or group) per tooth per state, e.g. `tooth_11_healthy`, `tooth_11_unhealthy`,
 * `tooth_11_very_unhealthy`, `gum_11_empty`. Anything the parser cannot read
 * can be pinned explicitly in `public/models/tooth-map.json`.
 */
export class OdontogramModel {
  /** @type {Map<number, {info:object, states:Map<string, THREE.Mesh[]>}>} */
  #teeth = new Map();
  #chart = new Map();
  #fades = new Map();
  #highlight = new Map();
  #selected = null;
  #pickables = [];
  #pickablesDirty = true;

  /**
   * @param {THREE.Object3D} root scene graph from GLTFLoader
   * @param {Record<string, {tooth:number|string, state:string}>} [overrides] node name → assignment
   */
  constructor(root, overrides = {}) {
    this.root = root;
    this.overrides = overrides;
    this.diagnostics = { unmatched: [], scheme: 'fdi' };
    this.#index();
  }

  /* ---------------------------------------------------------------- *
   * Indexing
   * ---------------------------------------------------------------- */

  #index() {
    const found = [];
    const unmatched = new Set();

    this.root.traverse((node) => {
      if (!node.isMesh) return;
      const assignment = this.#resolve(node);
      if (assignment) found.push({ mesh: node, ...assignment });
      else unmatched.add(node.name || '(unnamed mesh)');
    });

    // Model authors may number in FDI or Universal; work out which from the set.
    const scheme = detectNumbering(found.map((f) => f.tooth)) ?? 'fdi';
    this.diagnostics.scheme = scheme;

    for (const { mesh, tooth, state } of found) {
      const fdi = toFDI(tooth, scheme);
      if (!fdi) continue;

      let entry = this.#teeth.get(fdi);
      if (!entry) {
        entry = { info: toothInfo(fdi), states: new Map() };
        this.#teeth.set(fdi, entry);
      }
      if (!entry.states.has(state)) entry.states.set(state, []);
      entry.states.get(state).push(mesh);

      mesh.userData.fdi = fdi;
      mesh.userData.state = state;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.visible = false;
    }

    this.#cloneMaterials();

    this.diagnostics.unmatched = [...unmatched];
    if (CONFIG.debug && unmatched.size) {
      console.groupCollapsed(`[odontogram] ${unmatched.size} node(s) not recognised as tooth states`);
      console.table([...unmatched]);
      console.groupEnd();
    }

    // Nothing is visible yet — default everyone to healthy so a model with no
    // chart data still renders something sensible.
    for (const fdi of this.#teeth.keys()) this.setState(fdi, STATE.HEALTHY, { animate: false });
  }

  /**
   * Give every tooth-state group its own materials so opacity and emissive can
   * be driven independently — but share them *within* a group, since those
   * meshes always fade and highlight together. One clone per source material
   * per group rather than per mesh.
   */
  #cloneMaterials() {
    for (const entry of this.#teeth.values()) {
      for (const meshes of entry.states.values()) {
        const cache = new Map();
        const clone = (source) => {
          let copy = cache.get(source);
          if (!copy) {
            copy = source.clone();
            copy.userData = {
              ...copy.userData,
              baseOpacity: source.opacity,
              baseTransparent: source.transparent,
              baseEmissive: source.emissive?.clone() ?? null,
              baseEmissiveIntensity: source.emissiveIntensity ?? 1,
            };
            cache.set(source, copy);
          }
          return copy;
        };
        for (const mesh of meshes) {
          mesh.material = Array.isArray(mesh.material)
            ? mesh.material.map(clone)
            : clone(mesh.material);
        }
      }
    }
  }

  /** Walk up the graph until a node name yields a tooth + state. */
  #resolve(mesh) {
    let node = mesh;
    while (node && node !== this.root.parent) {
      const override = this.overrides[node.name];
      if (override) {
        const state = override.state;
        if (state) return { tooth: override.tooth, state };
      }
      const parsed = parseNodeName(node.name);
      if (parsed) return parsed;
      node = node.parent;
    }
    return null;
  }

  /* ---------------------------------------------------------------- *
   * Public API
   * ---------------------------------------------------------------- */

  /** FDI codes present in the model, in chart order. */
  get toothIds() {
    return [...this.#teeth.keys()].sort((a, b) => a - b);
  }

  has(fdi) {
    return this.#teeth.has(fdi);
  }

  info(fdi) {
    return this.#teeth.get(fdi)?.info ?? null;
  }

  stateOf(fdi) {
    return this.#chart.get(fdi) ?? null;
  }

  /** States actually authored for a tooth — useful for greying out UI. */
  availableStates(fdi) {
    return [...(this.#teeth.get(fdi)?.states.keys() ?? [])];
  }

  /**
   * @param {Map<number,string>|Record<number,string>} chart FDI → state
   */
  applyChart(chart, options = {}) {
    const entries = chart instanceof Map ? chart.entries() : Object.entries(chart);
    for (const [fdi, state] of entries) this.setState(Number(fdi), state, options);
  }

  /**
   * @param {number} fdi
   * @param {string} state canonical state string
   */
  setState(fdi, state, { animate = true } = {}) {
    const entry = this.#teeth.get(fdi);
    if (!entry) return false;
    if (this.#chart.get(fdi) === state) return true;

    if (!entry.states.has(state) && state !== STATE.MISSING) {
      console.warn(`[odontogram] tooth ${fdi} has no "${state}" variant; leaving as is`);
      return false;
    }
    if (state === STATE.MISSING && !entry.states.has(STATE.MISSING)) {
      // No empty-gum node authored: hiding every variant still reads correctly.
      if (CONFIG.debug) console.warn(`[odontogram] tooth ${fdi} has no empty-gum node`);
    }

    this.#chart.set(fdi, state);
    const fade = animate && !prefersReducedMotion && CONFIG.transition.durationMs > 0;

    for (const [variant, meshes] of entry.states) {
      const show = variant === state;
      for (const mesh of meshes) this.#setMeshVisible(mesh, show, fade);
    }

    this.#pickablesDirty = true;
    if (this.#selected === fdi) this.#refreshHighlight();
    return true;
  }

  #setMeshVisible(mesh, show, fade) {
    if (!fade) {
      this.#fades.delete(mesh);
      mesh.visible = show;
      eachMaterial(mesh, (material) => {
        material.opacity = material.userData.baseOpacity;
        material.transparent = material.userData.baseTransparent;
      });
      return;
    }

    const current = this.#fades.get(mesh);
    const from = current ? current.value : (mesh.visible ? 1 : 0);
    if (mesh.visible === show && from === (show ? 1 : 0)) return;

    mesh.visible = true;
    eachMaterial(mesh, (material) => { material.transparent = true; });
    this.#fades.set(mesh, { value: from, target: show ? 1 : 0, show });
  }

  /** Emissive rim on the selected tooth. Pass null to clear. */
  setSelected(fdi) {
    if (this.#selected === fdi) return;
    this.#selected = fdi;
    this.#refreshHighlight();
  }

  get selected() {
    return this.#selected;
  }

  #refreshHighlight() {
    for (const [material, target] of this.#highlight) target.value = 0;
    if (this.#selected == null) return;

    const entry = this.#teeth.get(this.#selected);
    if (!entry) return;
    const state = this.#chart.get(this.#selected);
    for (const mesh of entry.states.get(state) ?? []) {
      eachMaterial(mesh, (material) => {
        if (!material.emissive) return;
        let target = this.#highlight.get(material);
        if (!target) {
          target = { value: 0, current: 0 };
          this.#highlight.set(material, target);
        }
        target.value = 1;
      });
    }
  }

  /** Meshes worth raycasting against — only what is on screen. */
  get pickables() {
    if (this.#pickablesDirty) {
      this.#pickables = [];
      for (const entry of this.#teeth.values()) {
        for (const meshes of entry.states.values()) {
          for (const mesh of meshes) if (mesh.visible) this.#pickables.push(mesh);
        }
      }
      this.#pickablesDirty = false;
    }
    return this.#pickables;
  }

  update(delta) {
    const step = CONFIG.transition.durationMs > 0 ? (delta * 1000) / CONFIG.transition.durationMs : 1;

    for (const [mesh, fade] of this.#fades) {
      fade.value += Math.sign(fade.target - fade.value) * step;
      const done = Math.abs(fade.target - fade.value) < 0.01 || fade.value <= 0 || fade.value >= 1;
      if (done) fade.value = fade.target;

      eachMaterial(mesh, (material) => {
        material.opacity = material.userData.baseOpacity * fade.value;
      });

      if (done) {
        mesh.visible = fade.show;
        eachMaterial(mesh, (material) => {
          material.opacity = material.userData.baseOpacity;
          material.transparent = material.userData.baseTransparent;
        });
        this.#fades.delete(mesh);
        this.#pickablesDirty = true;
      }
    }

    for (const [material, target] of this.#highlight) {
      if (Math.abs(target.current - target.value) < 0.002) continue;
      target.current = THREE.MathUtils.damp(target.current, target.value, 8, delta);
      material.emissive.copy(material.userData.baseEmissive ?? new THREE.Color(0x000000))
        .lerp(HIGHLIGHT_COLOR, target.current);
      material.emissiveIntensity = (material.userData.baseEmissiveIntensity ?? 1) + target.current * 0.55;
    }
  }

  /** Centre on the origin and scale to a known height so any export frames well. */
  normalise(targetHeight = CONFIG.model.targetHeight) {
    const box = new THREE.Box3().setFromObject(this.root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = size.y > 0 ? targetHeight / size.y : 1;
    this.root.position.sub(center.multiplyScalar(scale));
    this.root.scale.setScalar(scale);
    return this;
  }

  /** Human-readable coverage report — the fastest way to validate a new export. */
  report() {
    const teeth = this.toothIds;
    const incomplete = teeth
      .map((fdi) => ({ fdi, states: this.availableStates(fdi) }))
      .filter((t) => !t.states.includes(STATE.HEALTHY)
        || !t.states.includes(STATE.UNHEALTHY)
        || !t.states.includes(STATE.VERY_UNHEALTHY));
    return {
      teethFound: teeth.length,
      numbering: this.diagnostics.scheme,
      withEmptyGum: teeth.filter((fdi) => this.availableStates(fdi).includes(STATE.MISSING)).length,
      incomplete,
      unmatchedNodes: this.diagnostics.unmatched,
    };
  }

  dispose() {
    this.root.traverse((node) => {
      if (!node.isMesh) return;
      node.geometry?.dispose();
      eachMaterial(node, (material) => material.dispose());
    });
  }
}
