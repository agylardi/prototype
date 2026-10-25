/**
 * Tooth numbering.
 *
 * Internally every tooth is keyed by its FDI code (11–18, 21–28, 31–38, 41–48)
 * because it encodes quadrant and position, which the scene and the chart both
 * need. Backends that speak Universal numbering (1–32, the "Tooth 1, Tooth 2…"
 * style) are converted at the edge.
 */

const TYPE_NAMES = [
  'Central incisor', 'Lateral incisor', 'Canine', 'First premolar',
  'Second premolar', 'First molar', 'Second molar', 'Third molar',
];

const QUADRANTS = {
  1: { key: 'UR', label: 'Upper right', arch: 'upper', side: 'right' },
  2: { key: 'UL', label: 'Upper left', arch: 'upper', side: 'left' },
  3: { key: 'LL', label: 'Lower left', arch: 'lower', side: 'left' },
  4: { key: 'LR', label: 'Lower right', arch: 'lower', side: 'right' },
};

/** Every FDI code, in the order a paper chart lists them. */
export const FDI_CODES = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];

export const isFDI = (n) => QUADRANTS[Math.floor(n / 10)] !== undefined && n % 10 >= 1 && n % 10 <= 8;

/** Universal (1–32) → FDI. */
export function universalToFDI(u) {
  if (!Number.isInteger(u) || u < 1 || u > 32) return null;
  if (u <= 8) return 10 + (9 - u);
  if (u <= 16) return 20 + (u - 8);
  if (u <= 24) return 30 + (25 - u);
  return 40 + (u - 24);
}

/** FDI → Universal (1–32). */
export function fdiToUniversal(fdi) {
  if (!isFDI(fdi)) return null;
  const quadrant = Math.floor(fdi / 10);
  const position = fdi % 10;
  if (quadrant === 1) return 9 - position;
  if (quadrant === 2) return 8 + position;
  if (quadrant === 3) return 25 - position;
  return 24 + position;
}

/** Descriptive record for a tooth. */
export function toothInfo(fdi) {
  const quadrant = QUADRANTS[Math.floor(fdi / 10)];
  const position = fdi % 10;
  return {
    fdi,
    universal: fdiToUniversal(fdi),
    quadrant: quadrant.key,
    quadrantLabel: quadrant.label,
    arch: quadrant.arch,
    side: quadrant.side,
    position,
    name: `${quadrant.label} ${TYPE_NAMES[position - 1].toLowerCase()}`,
    shortName: TYPE_NAMES[position - 1],
  };
}

/**
 * Interpret an id coming from the model or the API.
 * @param {number|string} id
 * @param {'fdi'|'universal'} scheme how to read ids that are valid in both
 * @returns {number|null} FDI code
 */
export function toFDI(id, scheme = 'fdi') {
  const n = typeof id === 'number' ? id : Number.parseInt(String(id).replace(/\D+/g, ''), 10);
  if (!Number.isFinite(n)) return null;
  if (n > 32 || (isFDI(n) && scheme === 'fdi')) return isFDI(n) ? n : null;
  return universalToFDI(n);
}

/**
 * Guess the numbering scheme from a set of ids. Codes 33–48 only exist in FDI;
 * 9, 10, 19, 20, 29, 30 only exist in Universal. Anything else is ambiguous.
 * @returns {'fdi'|'universal'|null}
 */
export function detectNumbering(ids) {
  const numbers = ids.map((id) => Number.parseInt(String(id).replace(/\D+/g, ''), 10)).filter(Number.isFinite);
  if (numbers.some((n) => n > 32)) return 'fdi';
  if (numbers.some((n) => [9, 10, 19, 20, 29, 30].includes(n))) return 'universal';
  return null;
}
