import type { GenParams } from '../../gen/genParams';
import { PASS_NAMES } from '../../gen/passes/passPipeline';
import { loadStoredParams, storeParams } from './genParamsStorage';
import { knobRow } from './knobRow';
import { KNOBS } from './knobs';
import { seedRow } from './seedRow';

const REGENERATE_DEBOUNCE_MS = 200;

export class GenPanel {
  readonly params: GenParams = loadStoredParams();
  private debounceTimer = 0;

  constructor(
    container: HTMLElement,
    private readonly onRegenerate: (params: GenParams) => void,
  ) {
    container.innerHTML = panelMarkup();
    const rows = container.querySelector('.knob-rows')!;
    rows.appendChild(seedRow(this.params.seed, (seed) => this.setParam('seed', seed)));
    for (const knob of KNOBS) {
      rows.appendChild(
        knobRow(knob, this.params[knob.key], (value) => this.setParam(knob.key, value)),
      );
    }
    container.querySelector('.regen')!.addEventListener('click', () => this.regenerateNow());
  }

  regenerateNow(): void {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = 0;
    this.onRegenerate({ ...this.params });
  }

  private setParam(key: keyof GenParams, value: number): void {
    this.params[key] = value;
    storeParams(this.params);
    this.regenerateSoon();
  }

  private regenerateSoon(): void {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => this.regenerateNow(), REGENERATE_DEBOUNCE_MS);
  }
}

function panelMarkup(): string {
  return `
    <h2>generation</h2>
    <div class="knob-rows"></div>
    <button type="button" class="btn regen">regenerate</button>
    <p class="hint">Passes: ${PASS_NAMES.join(' → ')}.</p>
  `;
}
