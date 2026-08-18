import type { Feature } from '@/features/asset-library/worlds/features/feature';
import { colorOfCategory } from './featureColors';
import type { FeatureVisibility, FeatureVisibilityState } from './featureVisibility';

const LEGEND_CLASSES =
  'absolute right-2 top-2 flex max-h-[60%] flex-col gap-0.5 overflow-y-auto rounded bg-black/60 p-2 font-mono text-[11px] text-zinc-200';

const ROW_CLASSES =
  'flex w-full items-center gap-1.5 rounded px-1 text-left hover:bg-white/10 cursor-pointer';

const ROW_OPACITY: Record<FeatureVisibilityState, string> = {
  shown: '1',
  faded: '0.45',
  hidden: '0.3',
};

interface LegendRow {
  nodeId: string;
  nodeLabel: string;
  category: string;
  count: number;
}

export class FeatureLegend {
  private readonly list = document.createElement('div');

  constructor(
    container: HTMLElement,
    private readonly visibility: FeatureVisibility,
    private readonly onToggled: () => void,
  ) {
    this.list.className = LEGEND_CLASSES;
    container.appendChild(this.list);
  }

  update(features: readonly Feature[]): void {
    this.list.replaceChildren(...legendRowsOf(features).map((row) => this.rowElement(row)));
  }

  dispose(): void {
    this.list.remove();
  }

  private rowElement(row: LegendRow): HTMLElement {
    const state = this.visibility.stateOf(row.nodeId);
    const element = document.createElement('button');
    element.type = 'button';
    element.className = ROW_CLASSES;
    element.style.opacity = ROW_OPACITY[state];
    element.title = `${row.nodeLabel}: ${state} — click to cycle shown, 20%, hidden`;
    element.append(
      swatchOf(row.category, state),
      textOf(`${row.nodeLabel} · ${row.count}`, state),
    );
    element.addEventListener('click', () => {
      this.visibility.cycle(row.nodeId);
      this.onToggled();
    });
    return element;
  }
}

function legendRowsOf(features: readonly Feature[]): LegendRow[] {
  const byNode = new Map<string, LegendRow>();
  for (const feature of features) {
    const row =
      byNode.get(feature.nodeId) ??
      { nodeId: feature.nodeId, nodeLabel: feature.nodeLabel, category: feature.category, count: 0 };
    row.count++;
    byNode.set(feature.nodeId, row);
  }
  return [...byNode.values()];
}

function swatchOf(category: string, state: FeatureVisibilityState): HTMLElement {
  const swatch = document.createElement('span');
  swatch.className = 'inline-block h-2 w-2 shrink-0 rounded-sm';
  swatch.style.backgroundColor = state === 'hidden' ? 'transparent' : colorOfCategory(category);
  swatch.style.boxShadow = `inset 0 0 0 1px ${colorOfCategory(category)}`;
  return swatch;
}

function textOf(text: string, state: FeatureVisibilityState): HTMLElement {
  const span = document.createElement('span');
  span.textContent = text;
  if (state === 'hidden') span.style.textDecoration = 'line-through';
  return span;
}
