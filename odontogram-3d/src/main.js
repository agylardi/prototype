import { SceneManager } from './SceneManager.js';
import { ParallaxController } from './ParallaxController.js';
import { ChartService } from './ChartService.js';
import { Picker } from './Picker.js';
import { ChartStrip } from './ui/ChartStrip.js';
import { loadOdontogram } from './loadModel.js';
import { CONFIG, prefersReducedMotion } from './config.js';

const el = {
  canvas: document.querySelector('#scene'),
  loader: document.querySelector('[data-loader]'),
  loaderLabel: document.querySelector('[data-loader-label]'),
  status: document.querySelector('[data-status]'),
  statusText: document.querySelector('[data-status-text]'),
  motion: document.querySelector('[data-motion]'),
  source: document.querySelector('[data-source]'),
  panel: document.querySelector('[data-chart]'),
};

function setStatus(level, message) {
  el.status.dataset.level = level;
  el.statusText.textContent = message;
}

async function boot() {
  const scene = new SceneManager(el.canvas);

  const { model, placeholder } = await loadOdontogram((_, label) => {
    el.loaderLabel.textContent = label;
  });
  scene.modelRoot.add(model.root);

  el.source.textContent = placeholder ? 'Stand-in geometry' : 'Client model';
  el.source.dataset.placeholder = String(placeholder);

  const chartUI = new ChartStrip(el.panel, {
    onSelect: (fdi) => select(fdi),
    onStateChange: (fdi, state) => chart.setTooth(fdi, state),
  });
  chartUI.setAvailable(model.toothIds);

  const chart = new ChartService();
  chart.addEventListener('change', ({ detail }) => {
    model.applyChart(detail.chart);
    chartUI.render(detail.chart);
  });
  chart.addEventListener('status', ({ detail }) => setStatus(detail.level, detail.message));

  function select(fdi) {
    model.setSelected(fdi);
    chartUI.select(fdi);
  }

  const picker = new Picker(el.canvas, scene.camera, model, {
    onSelect: (fdi) => select(fdi),
  });

  const parallax = new ParallaxController(el.canvas);
  parallax.enableMotion();
  if (parallax.needsPermission && !prefersReducedMotion) {
    el.motion.hidden = false;
    el.motion.addEventListener('click', async () => {
      const granted = await parallax.requestPermission();
      el.motion.hidden = granted;
      if (!granted) setStatus('warn', 'Motion access declined — tilt is off.');
    });
  }

  scene.onFrame((delta) => {
    const { x, y } = parallax.update(delta);
    scene.setParallax(x, y);
    model.update(delta);
    picker.update();
  });

  scene.start();
  await chart.start();

  el.loader.hidden = true;
  document.body.dataset.ready = 'true';

  // Handy for integration work and QA from the console.
  globalThis.odontogram = { scene, model, chart, chartUI, parallax, report: () => model.report() };
  if (CONFIG.debug) console.table(model.report());
  if (placeholder) {
    console.info(
      '[odontogram] Running on the built-in stand-in arch. Drop the real export at '
      + `"${CONFIG.model.url}" to use it.`,
    );
  }
}

boot().catch((error) => {
  console.error(error);
  el.loaderLabel.textContent = 'Something went wrong loading the scene. Check the console.';
});
