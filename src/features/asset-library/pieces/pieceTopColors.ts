import type { TileId } from '@/features/asset-library/asset';
import { EMPTY_VOXEL, voxelAt, type Piece } from './pieceDef';

export type ColorOfTile = (tileId: TileId) => string | null;

export function pieceTopColors(piece: Piece, colorOfTile: ColorOfTile): (string | null)[] {
  const seenFromAbove: (string | null)[] = [];
  for (let y = 0; y < piece.depth; y += 1) {
    for (let x = 0; x < piece.width; x += 1) {
      const tileId = highestVoxelAt(piece, x, y);
      seenFromAbove.push(tileId === EMPTY_VOXEL ? null : colorOfTile(tileId));
    }
  }
  return seenFromAbove;
}

function highestVoxelAt(piece: Piece, x: number, y: number): TileId {
  for (let layer = piece.layers - 1; layer >= 0; layer -= 1) {
    const tileId = voxelAt(piece, x, y, layer);
    if (tileId !== EMPTY_VOXEL) return tileId;
  }
  return EMPTY_VOXEL;
}
