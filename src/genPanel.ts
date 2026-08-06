// Generation panel — the knobs that feed the pass pipeline. Every change
// persists to localStorage and regenerates (debounced); the seed also has a
// dice button. Each knob maps 1:1 onto a GenParams field, so growing the
// pipeline means adding a row here and a field there.

import { DEFAULT_PARAMS, type GenParams } from './gen';

const STORAGE_KEY = 'procgen.params.v1';
const DEBOUNCE_MS = 200;

interface Knob {
  key: keyof GenParams;
  label: string;
  min: number;
  max: number;
  step: number;
}

const KNOBS: readonly Knob[] = [
  { key: 'size', label: 'world size', min: 48, max: 128, step: 1 },
  { key: 'noiseScale', label: 'noise scale', min: 0.02, max: 0.16, step: 0.005 },
  { key: 'waterLevel', label: 'water level', min: 0, max: 1, step: 0.01 },
  { key: 'rockLevel', label: 'rock level', min: 0, max: 1, step: 0.01 },
  { key: 'smoothing', label: 'smoothing', min: 0, max: 5, step: 1 },
  { key: 'treeDensity', label: 'tree density', min: 0, max: 1, step: 0.01 },
];

export class GenPanel {
  readonly params: GenParams;
  private timer = 0;

  constructor(
    container: HTMLElement,
    private readonly onRegenerate: (params: GenParams) => void,
  ) {
    this.params = load();

    container.innerHTML = `
      <h2>generation</h2>
      <div class="knob-rows"></div>
      <button type="button" class="btn regen">regenerate</button>
      <p class="hint">Passes: elevation noise → threshold terrain → CA smooth → scatter trees.</p>
    `;
    const rows = container.querySelector('.knob-rows')!;

    // Seed row: number input + dice.
    const seedRow = document.createElement('div');
    seedRow.className = 'knob';
    const seedLabel = document.createElement('label');
    seedLabel.textContent = 'seed';
    const seedInput = document.createElement('input');
    seedInput.type = 'number';
    seedInput.className = 'seed-input';
    seedInput.value = String(this.params.seed);
    seedInput.addEventListener('input', () => {
      const v = Number(seedInput.value);
      if (Number.isFinite(v)) this.setParam('seed', Math.round(v));
    });
    const dice = document.createElement('button');
    dice.type = 'button';
    dice.className = 'btn dice';
    dice.title = 'randomize seed';
    dice.textContent = '🎲';
    dice.addEventListener('click', () => {
      const v = Math.floor(Math.random() * 1_000_000);
      seedInput.value = String(v);
      this.setParam('seed', v);
    });
    seedRow.append(seedLabel, seedInput, dice);
    rows.appendChild(seedRow);

    for (const knob of KNOBS) rows.appendChild(this.knobRow(knob));

    container.querySelector('.regen')!.addEventListener('click', () => this.regenerateNow());
  }

  /** Fire the initial generation (call once after construction). */
  regenerateNow(): void {
    clearTimeout(this.timer);
    this.timer = 0;
    this.onRegenerate({ ...this.params });
  }

  private knobRow(knob: Knob): HTMLElement {
    const row = document.createElement('div');
    row.className = 'knob';
    const label = document.createElement('label');
    label.textContent = knob.label;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(knob.min);
    input.max = String(knob.max);
    input.step = String(knob.step);
    input.value = String(this.params[knob.key]);
    const value = document.createElement('span');
    value.className = 'knob-value';
    value.textContent = fmt(this.params[knob.key]);
    input.addEventListener('input', () => {
      const v = Number(input.value);
      value.textContent = fmt(v);
      this.setParam(knob.key, v);
    });
    row.append(label, input, value);
    return row;
  }

  private setParam(key: keyof GenParams, v: number): void {
    this.params[key] = v;
    save(this.params);
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.regenerateNow(), DEBOUNCE_MS);
  }
}

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(v < 0.2 ? 3 : 2);
}

function load(): GenParams {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PARAMS };
    const parsed = JSON.parse(raw) as Partial<GenParams>;
    const out = { ...DEFAULT_PARAMS };
    for (const key of Object.keys(out) as (keyof GenParams)[]) {
      const v = parsed[key];
      if (typeof v === 'number' && Number.isFinite(v)) out[key] = v;
    }
    return out;
  } catch {
    return { ...DEFAULT_PARAMS };
  }
}

function save(params: GenParams): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch {
    // Storage unavailable — knobs still work for the session.
  }
}
