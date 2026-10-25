import { FDI_CODES, toothInfo } from '../numbering.js';
import { STATE, STATE_LABEL, STATE_ORDER } from '../toothStates.js';

/**
 * The paper chart, rebuilt in HTML.
 *
 * It is the demo's control surface and the scene's index at the same time:
 * quadrants read outward from the midline exactly as a clinician would write
 * them, upper arch above the line, lower below, missing teeth struck through.
 */
export class ChartStrip {
  #cells = new Map();
  #selected = null;

  /**
   * @param {HTMLElement} root
   * @param {{onSelect:(fdi:number)=>void, onStateChange:(fdi:number, state:string)=>void}} handlers
   */
  constructor(root, { onSelect, onStateChange } = {}) {
    this.root = root;
    this.onSelect = onSelect;
    this.onStateChange = onStateChange;
    this.numbering = 'fdi';

    this.grid = root.querySelector('[data-chart-grid]');
    this.detail = root.querySelector('[data-detail]');
    this.detailCode = root.querySelector('[data-detail-code]');
    this.detailName = root.querySelector('[data-detail-name]');
    this.detailAlt = root.querySelector('[data-detail-alt]');
    this.stateButtons = root.querySelector('[data-state-buttons]');

    this.#buildGrid();
    this.#buildStateButtons();

    const collapse = root.querySelector('[data-collapse]');
    collapse?.addEventListener('click', () => {
      const collapsed = root.dataset.collapsed === 'true';
      root.dataset.collapsed = String(!collapsed);
      collapse.setAttribute('aria-expanded', String(collapsed));
      collapse.textContent = collapsed ? 'Hide' : 'Show';
    });

    root.querySelector('[data-numbering-toggle]')?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-scheme]');
      if (!button) return;
      this.setNumbering(button.dataset.scheme);
    });
  }

  #buildGrid() {
    const rows = [FDI_CODES.slice(0, 16), FDI_CODES.slice(16)];
    rows.forEach((row, rowIndex) => {
      const rowEl = document.createElement('div');
      rowEl.className = `chart-row chart-row--${rowIndex === 0 ? 'upper' : 'lower'}`;

      row.forEach((fdi, columnIndex) => {
        if (columnIndex === 8) {
          const midline = document.createElement('span');
          midline.className = 'chart-midline';
          midline.setAttribute('aria-hidden', 'true');
          rowEl.append(midline);
        }

        const info = toothInfo(fdi);
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'tooth';
        cell.dataset.fdi = String(fdi);
        cell.setAttribute('aria-pressed', 'false');
        cell.innerHTML = `
          <span class="tooth__mark" aria-hidden="true"></span>
          <span class="tooth__code">${fdi}</span>
        `;
        cell.title = `${info.name} · FDI ${fdi} · Universal ${info.universal}`;
        cell.addEventListener('click', () => this.onSelect?.(fdi));
        this.#cells.set(fdi, cell);
        rowEl.append(cell);
      });

      this.grid.append(rowEl);
    });
  }

  #buildStateButtons() {
    for (const state of STATE_ORDER) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'state-button';
      button.dataset.state = state;
      button.innerHTML = `<span class="state-button__dot" data-state="${state}"></span>${STATE_LABEL[state]}`;
      button.addEventListener('click', () => {
        if (this.#selected != null) this.onStateChange?.(this.#selected, state);
      });
      this.stateButtons.append(button);
    }
  }

  setNumbering(scheme) {
    this.numbering = scheme;
    for (const [fdi, cell] of this.#cells) {
      const info = toothInfo(fdi);
      cell.querySelector('.tooth__code').textContent = scheme === 'fdi' ? fdi : info.universal;
    }
    for (const button of this.root.querySelectorAll('[data-scheme]')) {
      button.setAttribute('aria-pressed', String(button.dataset.scheme === scheme));
    }
    if (this.#selected != null) this.select(this.#selected);
  }

  /** Reflect the chart. @param {Map<number,string>} chart */
  render(chart) {
    for (const [fdi, cell] of this.#cells) {
      const state = chart.get(fdi) ?? STATE.HEALTHY;
      cell.dataset.state = state;
      cell.setAttribute('aria-label', `Tooth ${this.numbering === 'fdi' ? fdi : toothInfo(fdi).universal}: ${STATE_LABEL[state]}`);
      if (fdi === this.#selected) this.#renderDetail(fdi, state);
    }
  }

  /** Mark which teeth exist in the loaded model; the rest are disabled. */
  setAvailable(fdiList) {
    const available = new Set(fdiList);
    for (const [fdi, cell] of this.#cells) {
      cell.disabled = !available.has(fdi);
      cell.classList.toggle('is-absent', !available.has(fdi));
    }
  }

  select(fdi) {
    this.#selected = fdi;
    for (const [code, cell] of this.#cells) {
      const active = code === fdi;
      cell.classList.toggle('is-selected', active);
      cell.setAttribute('aria-pressed', String(active));
    }
    this.detail.hidden = fdi == null;
    if (fdi != null) this.#renderDetail(fdi, this.#cells.get(fdi)?.dataset.state ?? STATE.HEALTHY);
  }

  #renderDetail(fdi, state) {
    const info = toothInfo(fdi);
    this.detailCode.textContent = this.numbering === 'fdi' ? fdi : info.universal;
    this.detailName.textContent = info.name;
    this.detailAlt.textContent = this.numbering === 'fdi'
      ? `Universal ${info.universal}`
      : `FDI ${info.fdi}`;
    for (const button of this.stateButtons.children) {
      button.setAttribute('aria-pressed', String(button.dataset.state === state));
    }
  }
}
