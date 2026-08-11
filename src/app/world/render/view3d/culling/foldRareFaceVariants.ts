import type { TilePlacement } from '../tilePlacements';

export interface FacedPlacement {
  placement: TilePlacement;
  faces: number;
}

const MIN_INSTANCES_PER_FACE_VARIANT = 32;

export function foldRareFaceVariants(faced: readonly FacedPlacement[]): FacedPlacement[] {
  const counts = instancesPerFaceVariant(faced);
  const shared = facesOfRareVariants(counts);
  if (shared === 0) return [...faced];
  return faced.map((one) => (isRare(counts, one.faces) ? { ...one, faces: shared } : one));
}

function instancesPerFaceVariant(faced: readonly FacedPlacement[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const one of faced) counts.set(one.faces, (counts.get(one.faces) ?? 0) + 1);
  return counts;
}

function facesOfRareVariants(counts: Map<number, number>): number {
  return [...counts.keys()].filter((faces) => isRare(counts, faces)).reduce((a, b) => a | b, 0);
}

function isRare(counts: Map<number, number>, faces: number): boolean {
  return (counts.get(faces) ?? 0) < MIN_INSTANCES_PER_FACE_VARIANT;
}
