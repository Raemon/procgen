import type { Feature } from '../../../procgen/features/feature';
import { colorOfCategory } from './featureColors';

const LEGEND_CLASSES =
  'pointer-events-none absolute right-2 top-2 flex max-h-[60%] flex-col gap-0.5 overflow-hidden rounded bg-black/60 p-2 font-mono text-[11px] text-zinc-200';

interface LegendRow {
  nodeLabel: string;
  category: string;
  count: number;
}

export class FeatureLegend {
  private readonly list = document.createElement('div');

  constructor(container: HTMLElement) {
    this.list.className = LEGEND_CLASSES;
    container.appendChild(this.list);
  }

  update(features: readonly Feature[]): void {
    this.list.replaceChildren(...legendRowsOf(features).map(rowElement));
  }

  dispose(): void {
    this.list.remove();
  }
}

function legendRowsOf(features: readonly Feature[]): LegendRow[] {
  const byNode = new Map<string, LegendRow>();
  for (const feature of features) {
    const row =
      byNode.get(feature.nodeId) ??
      { nodeLabel: feature.nodeLabel, category: feature.category, count: 0 };
    row.count++;
    byNode.set(feature.nodeId, row);
  }
  return [...byNode.values()];
}

function rowElement(row: LegendRow): HTMLElement {
  const element = document.createElement('div');
  element.className = 'flex items-center gap-1.5';
  element.append(swatchOf(row.category), textOf(`${row.nodeLabel} · ${row.count}`));
  return element;
}

function swatchOf(category: string): HTMLElement {
  const swatch = document.createElement('span');
  swatch.className = 'inline-block h-2 w-2 rounded-sm';
  swatch.style.backgroundColor = colorOfCategory(category);
  return swatch;
}

function textOf(text: string): HTMLElement {
  const span = document.createElement('span');
  span.textContent = text;
  return span;
}
