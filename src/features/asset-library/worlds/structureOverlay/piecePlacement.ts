import type { PieceId } from '@/features/asset-library/asset';
import { hashString } from '../random/hashString';
import type { Piece } from '@/features/asset-library/pieces/pieceDef';
import { rotatedAnchorX, rotatedAnchorY, normalizedQuarterTurns } from '@/features/asset-library/pieces/pieceRotation';
import { RANDOM_ROTATION } from '../display/displayBinding';

export interface PiecePlacement {
  x: number;
  y: number;
  pieceId: PieceId;
  rotation: number;
}

export interface PlacedPiece {
  piece: Piece;
  turns: number;
  originX: number;
  originY: number;
}

export function placedPieceOf(piece: Piece, placement: PiecePlacement): PlacedPiece {
  const turns = quarterTurnsFor(placement);
  return {
    piece,
    turns,
    originX: placement.x - rotatedAnchorX(piece, turns),
    originY: placement.y - rotatedAnchorY(piece, turns),
  };
}

function quarterTurnsFor(placement: PiecePlacement): number {
  if (placement.rotation !== RANDOM_ROTATION) return normalizedQuarterTurns(placement.rotation);
  return hashString(`piece-turn:${placement.pieceId}:${placement.x},${placement.y}`) % 4;
}
