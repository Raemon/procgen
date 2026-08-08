import type { PiecePlacement } from './piecePlacement';

export interface CultureStructurePlacement {
  x: number;
  y: number;
  cultureId: number;
}

export type StructurePlacement = PiecePlacement | CultureStructurePlacement;

export function piecePlacementsOf(
  placements: readonly StructurePlacement[],
): PiecePlacement[] {
  return placements.filter(isPiecePlacement);
}

export function isPiecePlacement(placement: StructurePlacement): placement is PiecePlacement {
  return 'pieceId' in placement;
}
