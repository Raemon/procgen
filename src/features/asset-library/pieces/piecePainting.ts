import type { TileId } from '@/features/asset-library/asset';
import { isInsidePiece, voxelIndex, type Piece } from './pieceDef';
import { normalizedQuarterTurns } from './pieceRotation';

export function paintVoxel(piece: Piece, x: number, y: number, layer: number, tileId: TileId): void {
  if (!isInsidePiece(piece, x, y, layer)) return;
  piece.voxels[voxelIndex(piece, x, y, layer)] = tileId;
}

export function paintFacing(piece: Piece, x: number, y: number, layer: number, facing: number): void {
  if (!isInsidePiece(piece, x, y, layer)) return;
  piece.facings[voxelIndex(piece, x, y, layer)] = normalizedQuarterTurns(facing);
}

