import { EMPTY_VOXEL, facingAt, voxelAt } from '../../assets/pieces/pieceDef';
import {
  rotatedDepth,
  rotatedFacing,
  rotatedWidth,
  unrotatedCell,
  type FootprintCell,
} from '../../assets/pieces/pieceRotation';
import { CHUNK_SIZE } from '../chunk';
import type { ChunkVoxelColumns } from './chunkVoxelColumns';
import { packedVoxel } from './packedVoxel';
import type { PlacedPiece } from './piecePlacement';

export function stampPlacedPieceIntoChunk(
  placed: PlacedPiece,
  chunkOriginX: number,
  chunkOriginY: number,
  into: ChunkVoxelColumns,
): void {
  const width = rotatedWidth(placed.piece, placed.turns);
  const depth = rotatedDepth(placed.piece, placed.turns);
  for (let localY = 0; localY < depth; localY++) {
    for (let localX = 0; localX < width; localX++) {
      stampColumn(placed, chunkOriginX, chunkOriginY, localX, localY, into);
    }
  }
}

function stampColumn(
  placed: PlacedPiece,
  chunkOriginX: number,
  chunkOriginY: number,
  localX: number,
  localY: number,
  into: ChunkVoxelColumns,
): void {
  const cellX = placed.originX + localX - chunkOriginX;
  const cellY = placed.originY + localY - chunkOriginY;
  if (cellX < 0 || cellY < 0 || cellX >= CHUNK_SIZE || cellY >= CHUNK_SIZE) return;
  const source = unrotatedCell(placed.piece, placed.turns, localX, localY);
  const cellIndex = cellY * CHUNK_SIZE + cellX;
  for (let layer = 0; layer < placed.piece.layers; layer++) {
    stampVoxel(placed, source, layer, cellIndex, into);
  }
}

function stampVoxel(
  placed: PlacedPiece,
  source: FootprintCell,
  layer: number,
  cellIndex: number,
  into: ChunkVoxelColumns,
): void {
  const tileId = voxelAt(placed.piece, source.x, source.y, layer);
  if (tileId === EMPTY_VOXEL) return;
  const facing = rotatedFacing(facingAt(placed.piece, source.x, source.y, layer), placed.turns);
  into.paint(cellIndex, layer, packedVoxel(tileId, facing));
}
