import { RANK_LANDMARK } from '../../../procgen/features/feature';

export interface LabelCandidate {
  key: string;
  nodeId: string;
  text: string;
  anchorX: number;
  anchorY: number;
  widthPx: number;
  heightPx: number;
  rank: number;
  extentArea: number;
}

export interface PlacedLabel {
  key: string;
  text: string;
  x: number;
  y: number;
  widthPx: number;
  heightPx: number;
}

const LABELS_HIDDEN_BELOW_PPT = 0.6;
const ONLY_LANDMARK_LABELS_BELOW_PPT = 2;
export const LABELS_ONE_NODE_MAY_NAME = 12;
const LABEL_GAP_PX = 6;

export function layoutLabels(
  candidates: readonly LabelCandidate[],
  pixelsPerTile: number,
): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  const namedPerNode = new Map<string, number>();
  for (const candidate of visibleAtZoom(candidates, pixelsPerTile)) {
    if (aNodeHasSaidEnough(namedPerNode, candidate)) continue;
    const box = boxOf(candidate);
    if (placed.some((other) => boxesOverlap(box, other))) continue;
    placed.push(box);
    namedPerNode.set(candidate.nodeId, (namedPerNode.get(candidate.nodeId) ?? 0) + 1);
  }
  return placed;
}

function aNodeHasSaidEnough(namedPerNode: Map<string, number>, candidate: LabelCandidate): boolean {
  return (namedPerNode.get(candidate.nodeId) ?? 0) >= LABELS_ONE_NODE_MAY_NAME;
}

function visibleAtZoom(
  candidates: readonly LabelCandidate[],
  pixelsPerTile: number,
): LabelCandidate[] {
  if (pixelsPerTile < LABELS_HIDDEN_BELOW_PPT) return [];
  const shown =
    pixelsPerTile < ONLY_LANDMARK_LABELS_BELOW_PPT
      ? candidates.filter((candidate) => candidate.rank === RANK_LANDMARK)
      : [...candidates];
  return shown.sort(byPriority);
}

function byPriority(a: LabelCandidate, b: LabelCandidate): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  if (a.extentArea !== b.extentArea) return a.extentArea - b.extentArea;
  return a.key < b.key ? -1 : 1;
}

function boxOf(candidate: LabelCandidate): PlacedLabel {
  return {
    key: candidate.key,
    text: candidate.text,
    x: candidate.anchorX + LABEL_GAP_PX,
    y: candidate.anchorY - candidate.heightPx / 2,
    widthPx: candidate.widthPx,
    heightPx: candidate.heightPx,
  };
}

export function boxesOverlap(a: PlacedLabel, b: PlacedLabel): boolean {
  return (
    a.x < b.x + b.widthPx && b.x < a.x + a.widthPx && a.y < b.y + b.heightPx && b.y < a.y + a.heightPx
  );
}
