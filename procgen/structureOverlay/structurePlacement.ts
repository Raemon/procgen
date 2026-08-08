import type { PiecePlacement } from './piecePlacement';

export interface CultureStructurePlacement {
  x: number;
  y: number;
  cultureId: number;
  tag: string;
}

export type StructurePlacement = PiecePlacement | CultureStructurePlacement;

export function piecePlacementsOf(
  placements: readonly StructurePlacement[],
): PiecePlacement[] {
  return placements.filter(isPiecePlacement);
}

export function culturePlacementsOf(
  placements: readonly StructurePlacement[],
): CultureStructurePlacement[] {
  return placements.filter(isCulturePlacement);
}

export function isCulturePlacement(
  placement: StructurePlacement,
): placement is CultureStructurePlacement {
  return !isPiecePlacement(placement);
}

export function isPiecePlacement(placement: StructurePlacement): placement is PiecePlacement {
  return 'pieceId' in placement;
}
