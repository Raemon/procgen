import { piecesBoundToRole, type Culture } from '@/features/asset-library/cultures/cultureDef';
import { EMPTY_VOXEL, facingAt, voxelAt, type Piece, type PieceRole } from '@/features/asset-library/pieces/pieceDef';
import {
  rotatedAnchorX,
  rotatedAnchorY,
  rotatedDepth,
  rotatedFacing,
  rotatedWidth,
  unrotatedCell,
} from '@/features/asset-library/pieces/pieceRotation';
import { hashString } from '../random/hashString';
import { mulberry32, type RandomStream } from '../random/mulberry32';
import { packedVoxel } from '../structureOverlay/packedVoxel';
import type { PaintVoxel } from './buildingSpec';
import type { PieceSource } from './pieceSource';

export function cellRng(seedKey: string, x: number, y: number, label: string): RandomStream {
  return mulberry32(hashString(`${seedKey}:${x},${y}:${label}`));
}

export function pieceForRole(
  culture: Culture,
  pieces: PieceSource,
  role: PieceRole,
  rng: RandomStream,
): Piece | null {
  const bound = piecesBoundToRole(culture, role);
  const roll = rng();
  if (bound.length === 0) return null;
  return pieces.byId(bound[Math.min(bound.length - 1, Math.floor(roll * bound.length))]!) ?? null;
}

export function stampPieceThroughPaint(
  piece: Piece,
  turns: number,
  cellX: number,
  cellY: number,
  baseLayer: number,
  paint: PaintVoxel,
): void {
  const originX = cellX - rotatedAnchorX(piece, turns);
  const originY = cellY - rotatedAnchorY(piece, turns);
  for (let localY = 0; localY < rotatedDepth(piece, turns); localY++) {
    for (let localX = 0; localX < rotatedWidth(piece, turns); localX++) {
      stampPieceColumn(piece, turns, { originX, originY, localX, localY, baseLayer }, paint);
    }
  }
}

interface StampedColumn {
  originX: number;
  originY: number;
  localX: number;
  localY: number;
  baseLayer: number;
}

function stampPieceColumn(
  piece: Piece,
  turns: number,
  column: StampedColumn,
  paint: PaintVoxel,
): void {
  const source = unrotatedCell(piece, turns, column.localX, column.localY);
  for (let layer = 0; layer < piece.layers; layer++) {
    const tileId = voxelAt(piece, source.x, source.y, layer);
    if (tileId === EMPTY_VOXEL) continue;
    const facing = rotatedFacing(facingAt(piece, source.x, source.y, layer), turns);
    paint(
      column.originX + column.localX,
      column.originY + column.localY,
      column.baseLayer + layer,
      packedVoxel(tileId, facing),
    );
  }
}
