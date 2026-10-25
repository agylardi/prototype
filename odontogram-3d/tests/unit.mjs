/**
 * Dependency-free tests for the pure logic: numbering conversion, node-name
 * parsing and payload normalisation. These are the parts that will break
 * quietly when a new model export or a new backend shape shows up, so they are
 * worth pinning down.
 *
 *   npm test
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  FDI_CODES, detectNumbering, fdiToUniversal, toFDI, toothInfo, universalToFDI,
} from '../src/numbering.js';
import { STATE, parseNodeName, resolveState } from '../src/toothStates.js';
import { ChartService, buildDemoChart } from '../src/ChartService.js';

const root = new URL('..', import.meta.url);
let failed = 0;
const ok = (condition, label) => {
  if (condition) return;
  console.error(`  ✗ ${label}`);
  failed += 1;
};
const group = (name, fn) => { console.log(name); fn(); };

group('numbering', () => {
  for (let u = 1; u <= 32; u += 1) {
    ok(fdiToUniversal(universalToFDI(u)) === u, `round trip for universal ${u}`);
  }
  ok(universalToFDI(1) === 18, 'universal 1 is the upper right third molar');
  ok(universalToFDI(8) === 11 && universalToFDI(9) === 21, 'the midline crosses at 8/9');
  ok(universalToFDI(24) === 31 && universalToFDI(25) === 41, 'the lower midline crosses at 24/25');
  ok(new Set(FDI_CODES).size === 32, 'FDI_CODES holds 32 distinct teeth');
  ok(toothInfo(11).name === 'Upper right central incisor', 'anatomical naming');
  ok(toothInfo(38).quadrant === 'LL' && toothInfo(38).shortName === 'Third molar', 'quadrants');
});

group('id interpretation', () => {
  ok(toFDI(3, 'universal') === 16, 'universal 3 reads as FDI 16');
  ok(toFDI(11, 'fdi') === 11, 'FDI ids pass through');
  ok(toFDI(11, 'universal') === 23, 'the same digits read differently per scheme');
  ok(toFDI('#46', 'fdi') === 46, 'punctuation is stripped');
  ok(toFDI(99, 'fdi') === null, 'nonsense ids are rejected');
  ok(detectNumbering([1, 2, 3, 9]) === 'universal', 'ids below 11 imply universal');
  ok(detectNumbering([11, 12, 48]) === 'fdi', 'ids above 32 imply FDI');
  ok(detectNumbering([11, 12, 21]) === null, 'genuinely ambiguous sets return null');
});

group('node names', () => {
  const cases = [
    ['tooth_11_healthy', 11, STATE.HEALTHY],
    ['Tooth-11-very_unhealthy', 11, STATE.VERY_UNHEALTHY],
    ['tooth11_state3', 11, STATE.VERY_UNHEALTHY],
    ['T_11.Severe', 11, STATE.VERY_UNHEALTHY],
    ['gum_4_empty', 4, STATE.MISSING],
    ['Tooth_26_Unhealthy.001', 26, STATE.UNHEALTHY],
    ['tooth_26_healthy_mesh', 26, STATE.HEALTHY],
    ['very_unhealthy_tooth_31', 31, STATE.VERY_UNHEALTHY],
    ['TOOTH 7 DECAYED', 7, STATE.UNHEALTHY],
  ];
  for (const [name, tooth, state] of cases) {
    const parsed = parseNodeName(name);
    ok(parsed?.tooth === tooth && parsed?.state === state, `parses "${name}"`);
  }
  ok(parseNodeName('Camera') === null, 'ignores nodes that are not teeth');
  ok(parseNodeName('Armature') === null, 'ignores rig nodes');
  ok(resolveState('Very Unhealthy') === STATE.VERY_UNHEALTHY, 'state aliases are case and space tolerant');
  ok(resolveState('sparkly') === null, 'unknown states are rejected rather than guessed');
});

group('chart payloads', () => {
  const example = JSON.parse(readFileSync(fileURLToPath(new URL('api/chart.example.json', root))));
  const service = new ChartService({ numbering: 'auto' });
  ok(service.merge(example).length === 32, 'the shipped example applies in full');
  ok(service.chart.get(16) === STATE.UNHEALTHY, 'universal 3 lands on FDI 16');
  ok(service.chart.get(15) === STATE.MISSING, 'universal 4 lands on FDI 15');
  ok(service.merge({ teeth: { 3: 'unhealthy' } }).length === 0, 're-sending the same value is a no-op');

  const arrayForm = new ChartService({ numbering: 'auto' });
  arrayForm.merge([
    { id: 46, status: 'decayed' },
    { tooth: 11, state: 'Very Unhealthy' },
    { id: 21, state: 'extracted' },
  ]);
  ok(arrayForm.chart.get(46) === STATE.UNHEALTHY, 'array payloads with alias states');
  ok(arrayForm.chart.get(11) === STATE.VERY_UNHEALTHY, 'alias: very unhealthy');
  ok(arrayForm.chart.get(21) === STATE.MISSING, 'alias: extracted');

  const nested = new ChartService({ numbering: 'fdi' });
  nested.merge({ 11: 'healthy', 12: { state: 'unhealthy', note: 'distal' } });
  ok(nested.chart.get(12) === STATE.UNHEALTHY, 'object values with extra fields');

  const messy = new ChartService({ numbering: 'fdi' });
  const warn = console.warn;
  console.warn = () => {};
  messy.merge({ teeth: { 99: 'healthy', 11: 'sparkly', 12: 'healthy' } });
  console.warn = warn;
  ok(messy.chart.size === 1, 'bad rows are skipped, good rows still apply');

  const events = new ChartService({ numbering: 'fdi' });
  let changed = null;
  events.addEventListener('change', (event) => { changed = event.detail.changed; });
  events.writable = false;
  events.setTooth(11, STATE.UNHEALTHY);
  ok(changed?.[0] === 11, 'writes emit a change event');

  ok(Object.keys(buildDemoChart().teeth).length === 32, 'the fallback chart covers every tooth');
});

console.log(failed === 0 ? '\nAll tests passed.' : `\n${failed} test(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
