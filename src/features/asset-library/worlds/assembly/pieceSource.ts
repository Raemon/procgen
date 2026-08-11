import type { Piece } from '@/features/asset-library/pieces/pieceDef';

export interface PieceSource {
  byId(id: number): Piece | undefined;
  largestFootprint(): number;
}

export const NO_PIECES: PieceSource = {
  byId: () => undefined,
  largestFootprint: () => 0,
};
