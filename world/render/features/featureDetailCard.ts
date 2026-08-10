import type { Feature } from '../../../procgen/features/feature';
import { clusterLabel, type FeatureCluster } from './featureClusters';

const CARD_CLASSES =
  'pointer-events-none absolute z-10 max-w-60 rounded border border-zinc-700 bg-zinc-900/95 px-2 py-1.5 font-mono text-[11px] leading-snug text-zinc-100';
const CURSOR_GAP_PX = 14;

export class FeatureDetailCard {
  private readonly card = document.createElement('div');

  constructor(container: HTMLElement) {
    this.card.className = `${CARD_CLASSES} hidden`;
    container.appendChild(this.card);
  }

  show(cluster: FeatureCluster, byKey: ReadonlyMap<string, Feature>, x: number, y: number): void {
    this.card.classList.remove('hidden');
    this.card.style.left = `${x + CURSOR_GAP_PX}px`;
    this.card.style.top = `${y + CURSOR_GAP_PX}px`;
    this.card.replaceChildren(...detailLines(cluster, byKey).map(lineOf));
  }

  hide(): void {
    this.card.classList.add('hidden');
  }

  dispose(): void {
    this.card.remove();
  }
}

function detailLines(cluster: FeatureCluster, byKey: ReadonlyMap<string, Feature>): string[] {
  const feature = cluster.feature;
  return [
    clusterLabel(cluster),
    `${feature.nodeLabel} · ${feature.category}`,
    `at ${feature.x},${feature.y}`,
    ...parentLine(feature, byKey),
    ...linkLines(feature, byKey),
  ];
}

function parentLine(feature: Feature, byKey: ReadonlyMap<string, Feature>): string[] {
  const parent = feature.parentKey ? byKey.get(feature.parentKey) : undefined;
  return parent ? [`from ${parent.label} at ${parent.x},${parent.y}`] : [];
}

function linkLines(feature: Feature, byKey: ReadonlyMap<string, Feature>): string[] {
  return feature.linkKeys.flatMap((key) => {
    const link = byKey.get(key);
    return link ? [`linked to ${link.label}`] : [];
  });
}

function lineOf(text: string): HTMLElement {
  const line = document.createElement('div');
  line.textContent = text;
  return line;
}
