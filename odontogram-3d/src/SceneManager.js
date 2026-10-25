import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from './config.js';

/**
 * Owns the renderer, the camera rig and the lights, and runs the frame loop.
 *
 * The camera never moves directly: it is parented to a rig that the parallax
 * controller nudges. That keeps orbit controls (when enabled) and the parallax
 * offset from fighting over the same transform.
 */
export class SceneManager {
  #frameCallbacks = new Set();
  #parallax = { x: 0, y: 0 };
  #resizeObserver;
  #lookAtScratch;

  constructor(canvas) {
    this.canvas = canvas;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1, CONFIG.camera.near, CONFIG.camera.far);
    this.camera.position.set(...CONFIG.camera.position);

    this.cameraRig = new THREE.Group();
    this.cameraRig.add(this.camera);
    this.scene.add(this.cameraRig);

    this.lookAtTarget = new THREE.Vector3(...CONFIG.camera.target);
    this.#lookAtScratch = new THREE.Vector3();

    /** Everything loaded goes in here so parallax can tilt the subject as a unit. */
    this.modelRoot = new THREE.Group();
    this.scene.add(this.modelRoot);

    this.#buildLights();
    this.#buildEnvironment();

    if (CONFIG.controls.orbit) {
      this.controls = new OrbitControls(this.camera, canvas);
      this.controls.enableDamping = true;
      this.controls.target.copy(this.lookAtTarget);
      this.controls.minDistance = 3;
      this.controls.maxDistance = 14;
    }

    this.clock = new THREE.Clock();
    this.#resizeObserver = new ResizeObserver(() => this.resize());
    this.#resizeObserver.observe(canvas.parentElement ?? canvas);
    this.resize();
  }

  #buildLights() {
    this.lights = new THREE.Group();
    this.scene.add(this.lights);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    this.keyLight.position.set(2.6, 4.2, 5.0);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 20;
    this.keyLight.shadow.camera.left = -4;
    this.keyLight.shadow.camera.right = 4;
    this.keyLight.shadow.camera.top = 4;
    this.keyLight.shadow.camera.bottom = -4;
    this.keyLight.shadow.bias = -0.0015;
    this.keyLight.shadow.radius = 3;
    this.keyBasePosition = this.keyLight.position.clone();
    this.lights.add(this.keyLight);

    // Cool fill from the opposite side stops the shadow side going muddy.
    this.fillLight = new THREE.DirectionalLight(0xc8e2ff, 0.85);
    this.fillLight.position.set(-4.0, 1.2, 2.4);
    this.fillBasePosition = this.fillLight.position.clone();
    this.lights.add(this.fillLight);

    // Rim separates the arch from the backdrop.
    this.rimLight = new THREE.DirectionalLight(0xfff2e0, 1.1);
    this.rimLight.position.set(-1.2, 2.0, -4.5);
    this.lights.add(this.rimLight);

    this.lights.add(new THREE.HemisphereLight(0xdfe9f5, 0x2a1c1c, 0.55));

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.ShadowMaterial({ opacity: 0.22 }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.55;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);
  }

  #buildEnvironment() {
    // Enamel reads as plastic without an environment to reflect.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.65;
    pmrem.dispose();
  }

  /** Normalised parallax deflection, each in [-1, 1]. */
  setParallax(x, y) {
    this.#parallax.x = x;
    this.#parallax.y = y;
  }

  onFrame(callback) {
    this.#frameCallbacks.add(callback);
    return () => this.#frameCallbacks.delete(callback);
  }

  start() {
    this.renderer.setAnimationLoop(() => this.#tick());
  }

  #tick() {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    for (const callback of this.#frameCallbacks) callback(delta);

    const { x, y } = this.#parallax;
    const p = CONFIG.parallax;

    this.cameraRig.position.set(x * p.cameraShift[0], y * p.cameraShift[1], 0);
    this.modelRoot.rotation.y = x * p.modelTilt[0];
    this.modelRoot.rotation.x = -y * p.modelTilt[1];

    this.keyLight.position.set(
      this.keyBasePosition.x + x * p.lightShift[0],
      this.keyBasePosition.y + y * p.lightShift[1],
      this.keyBasePosition.z,
    );
    this.fillLight.position.set(
      this.fillBasePosition.x + x * p.lightShift[0] * 0.6,
      this.fillBasePosition.y - y * p.lightShift[1] * 0.4,
      this.fillBasePosition.z,
    );

    if (this.controls) {
      this.controls.update();
    } else {
      // Counter-rotating the look-at point turns translation into a subtle
      // orbit rather than a slide, which is what reads as "alive".
      this.#lookAtScratch.set(
        this.lookAtTarget.x - x * p.targetShift[0],
        this.lookAtTarget.y - y * p.targetShift[1],
        this.lookAtTarget.z,
      );
      this.camera.lookAt(this.#lookAtScratch);
    }

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const parent = this.canvas.parentElement ?? this.canvas;
    const width = parent.clientWidth || 1;
    const height = parent.clientHeight || 1;
    this.camera.aspect = width / height;
    // Keep the arch fully framed on tall phone viewports.
    this.camera.fov = this.camera.aspect < 0.85 ? CONFIG.camera.fov * 1.5 : CONFIG.camera.fov;
    // On wide screens the chart panel occupies the lower right, so bias the
    // subject to the left of frame rather than letting the panel cover it.
    this.lookAtTarget.x = CONFIG.camera.target[0] + (width / height >= 1.4 ? 0.62 : 0);
    this.controls?.target.copy(this.lookAtTarget);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  dispose() {
    this.#resizeObserver.disconnect();
    this.renderer.setAnimationLoop(null);
    this.controls?.dispose();
    this.renderer.dispose();
  }
}
