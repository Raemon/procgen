import { isInsidePiece, voxelIndex, type Piece } from './pieceDef';
import { normalizedQuarterTurns } from './pieceRotation';

export function paintVoxel(piece: Piece, x: number, y: number, layer: number, tileId: number): void {
  if (!isInsidePiece(piece, x, y, layer)) return;
  piece.voxels[voxelIndex(piece, x, y, layer)] = tileId;
}

export function paintFacing(piece: Piece, x: number, y: number, layer: number, facing: number): void {
  if (!isInsidePiece(piece, x, y, layer)) return;
  piece.facings[voxelIndex(piece, x, y, layer)] = normalizedQuarterTurns(facing);
}

export function paintFilledRect(
  piece: Piece,
  layer: number,
  tileId: number,
  fromX = 0,
  fromY = 0,
  toX = piece.width - 1,
  toY = piece.depth - 1,
): void {
  for (let y = fromY; y <= toY; y++) {
    for (let x = fromX; x <= toX; x++) paintVoxel(piece, x, y, layer, tileId);
  }
}

export function paintRectOutline(
  piece: Piece,
  layer: number,
  tileId: number,
  fromX = 0,
  fromY = 0,
  toX = piece.width - 1,
  toY = piece.depth - 1,
): void {
  for (let x = fromX; x <= toX; x++) {
    paintVoxel(piece, x, fromY, layer, tileId);
    paintVoxel(piece, x, toY, layer, tileId);
  }
  for (let y = fromY; y <= toY; y++) {
    paintVoxel(piece, fromX, y, layer, tileId);
    paintVoxel(piece, toX, y, layer, tileId);
  }
}
