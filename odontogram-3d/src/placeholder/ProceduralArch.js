import * as THREE from 'three';
import { FDI_CODES, toothInfo } from '../numbering.js';

/**
 * A stand-in odontogram, generated in code.
 *
 * It exists so the repository runs and can be reviewed before the real asset
 * lands, and — more usefully — so the naming convention the loader expects is
 * exercised end to end. Every node here is named exactly as the glTF should be:
 *
 *   tooth_11_healthy / tooth_11_unhealthy / tooth_11_very_unhealthy / gum_11_empty
 *
 * Delete this module once `public/models/odontogram.glb` is in place.
 */

const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Crown width per position, central incisor → third molar. */
const WIDTHS = [0.34, 0.28, 0.32, 0.31, 0.33, 0.46, 0.44, 0.39];
const HEIGHTS = [0.68, 0.60, 0.72, 0.58, 0.57, 0.54, 0.52, 0.47];
const DEPTHS = [0.24, 0.23, 0.29, 0.33, 0.34, 0.44, 0.43, 0.40];

const materials = {
  enamel: new THREE.MeshPhysicalMaterial({
    color: 0xf6f0e6, roughness: 0.22, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.25,
  }),
  enamelWorn: new THREE.MeshPhysicalMaterial({
    color: 0xdcc79c, roughness: 0.48, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.5,
  }),
  enamelFailing: new THREE.MeshPhysicalMaterial({
    color: 0xa88b63, roughness: 0.72, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.8,
  }),
  root: new THREE.MeshStandardMaterial({ color: 0xe4d5bd, roughness: 0.75 }),
  decay: new THREE.MeshStandardMaterial({ color: 0x40291a, roughness: 0.95 }),
  decayDeep: new THREE.MeshStandardMaterial({ color: 0x1d120a, roughness: 1.0 }),
  calculus: new THREE.MeshStandardMaterial({ color: 0xc9b183, roughness: 0.9 }),
  gum: new THREE.MeshStandardMaterial({ color: 0xb05a5c, roughness: 0.85 }),
  gumInflamed: new THREE.MeshStandardMaterial({ color: 0x9c3f45, roughness: 0.8 }),
};

const CROWN = new THREE.SphereGeometry(0.5, 18, 14);
const CUSP = new THREE.SphereGeometry(0.5, 10, 8);
const ROOT = new THREE.ConeGeometry(0.5, 1, 12);
const BLOB = new THREE.SphereGeometry(0.5, 10, 8);
const RING = new THREE.TorusGeometry(0.5, 0.11, 8, 20);

function crown(size, material, flatten = 1) {
  const mesh = new THREE.Mesh(CROWN, material);
  mesh.scale.set(size.w, size.h * flatten, size.d);
  return mesh;
}

function roots(size, count) {
  const group = new THREE.Group();
  for (let i = 0; i < count; i += 1) {
    const mesh = new THREE.Mesh(ROOT, materials.root);
    const spread = count === 1 ? 0 : (i / (count - 1) - 0.5) * size.w * 0.62;
    // Kept short so the roots stay inside the gum ridge.
    mesh.scale.set(size.w * (count === 1 ? 0.72 : 0.4), size.h * 0.7, size.d * 0.7);
    mesh.position.set(spread, size.h * 0.42, 0);
    group.add(mesh);
  }
  return group;
}

/** Occlusal bumps read as "molar" from a distance far more cheaply than a sculpt. */
function cusps(size, material, rand) {
  const group = new THREE.Group();
  for (let i = 0; i < 4; i += 1) {
    const mesh = new THREE.Mesh(CUSP, material);
    const sx = i % 2 ? 1 : -1;
    const sz = i < 2 ? 1 : -1;
    mesh.scale.setScalar(size.w * 0.26);
    mesh.position.set(sx * size.w * 0.22, -size.h * 0.40 + rand() * 0.01, sz * size.d * 0.22);
    group.add(mesh);
  }
  return group;
}

function buildVariant(state, info, size, rand) {
  const group = new THREE.Group();
  group.name = `tooth_${info.fdi}_${state}`;
  const molar = info.position >= 6;

  const enamel = {
    healthy: materials.enamel,
    unhealthy: materials.enamelWorn,
    very_unhealthy: materials.enamelFailing,
  }[state];

  group.add(crown(size, enamel, state === 'very_unhealthy' ? 0.88 : 1));
  if (molar) group.add(cusps(size, enamel, rand));
  group.add(roots(size, molar ? 3 : info.position >= 4 ? 2 : 1));

  if (state !== 'healthy') {
    const severe = state === 'very_unhealthy';
    const lesion = new THREE.Mesh(BLOB, severe ? materials.decayDeep : materials.decay);
    lesion.scale.setScalar(size.w * (severe ? 0.46 : 0.28));
    lesion.position.set(
      (rand() - 0.5) * size.w * 0.36,
      -size.h * (severe ? 0.26 : 0.32),
      size.d * (severe ? 0.2 : 0.26),
    );
    group.add(lesion);

    const tartar = new THREE.Mesh(RING, severe ? materials.decay : materials.calculus);
    tartar.rotation.x = Math.PI / 2;
    tartar.scale.set(size.w * 1.02, size.d * 1.25, severe ? 1.1 : 0.7);
    // Calculus sits at the gumline, which is where it forms.
    tartar.position.y = size.h * 0.18;
    group.add(tartar);

    if (severe) {
      // A missing corner where the crown has fractured.
      const chip = new THREE.Mesh(BLOB, materials.decayDeep);
      chip.scale.set(size.w * 0.42, size.h * 0.36, size.d * 0.42);
      chip.position.set(size.w * 0.3, -size.h * 0.44, -size.d * 0.14);
      group.add(chip);
    }
  }

  return group;
}

function buildSocket(info, size) {
  const group = new THREE.Group();
  group.name = `gum_${info.fdi}_empty`;
  const dome = new THREE.Mesh(BLOB, materials.gumInflamed);
  dome.scale.set(size.w * 1.05, size.h * 0.5, size.d * 1.15);
  dome.position.y = 0;
  group.add(dome);
  return group;
}

function buildGumRidge(points, name) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 128, 0.21, 14, false), materials.gum);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * @returns {THREE.Group} scene graph shaped like the expected glTF export
 */
export function createPlaceholderOdontogram() {
  const root = new THREE.Group();
  root.name = 'odontogram_placeholder';
  const rand = mulberry32(20260728);

  const ridgePoints = { upper: [], lower: [] };

  for (const fdi of FDI_CODES) {
    const info = toothInfo(fdi);
    const index = info.position - 1;
    const upper = info.arch === 'upper';
    const sign = info.side === 'left' ? 1 : -1;

    // Walk outward from the midline, stepping by each crown's own width.
    let theta = 0;
    for (let i = 0; i <= index; i += 1) {
      theta += (i === 0 ? WIDTHS[0] * 0.5 : (WIDTHS[i - 1] + WIDTHS[i]) * 0.5) / 1.62;
    }

    const rx = (upper ? 1.34 : 1.2) + index * 0.012;
    const rz = upper ? 1.72 : 1.56;
    const size = { w: WIDTHS[index], h: HEIGHTS[index], d: DEPTHS[index] };

    const pivot = new THREE.Group();
    pivot.name = `tooth_${fdi}`;
    pivot.position.set(sign * rx * Math.sin(theta), upper ? 0.62 : -0.62, rz * Math.cos(theta) - 0.35);
    pivot.rotation.y = sign * theta;
    // Slight lingual lean, plus a touch of noise so the arch is not machined.
    pivot.rotation.x = (upper ? -1 : 1) * (0.06 + rand() * 0.05);
    // Lower teeth are the same build flipped over. A rotation rather than a
    // negative scale, so face winding and normals stay correct.
    pivot.rotation.z = (upper ? 0 : Math.PI) + (rand() - 0.5) * 0.06;

    for (const state of ['healthy', 'unhealthy', 'very_unhealthy']) {
      pivot.add(buildVariant(state, info, size, rand));
    }
    pivot.add(buildSocket(info, size));

    root.add(pivot);
    ridgePoints[info.arch].push(new THREE.Vector3(
      pivot.position.x,
      pivot.position.y + (upper ? 0.36 : -0.36),
      pivot.position.z,
    ));
  }

  for (const arch of ['upper', 'lower']) {
    // Sort left-to-right so the ridge threads through the arch in order.
    const points = ridgePoints[arch].slice().sort((a, b) => a.x - b.x);
    root.add(buildGumRidge(points, `gum_${arch}_ridge`));
  }

  return root;
}
