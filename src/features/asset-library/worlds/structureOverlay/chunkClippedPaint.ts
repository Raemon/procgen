import { CHUNK_SIZE } from '../chunk';
import type { PaintVoxel } from '../assembly/buildingSpec';
import type { ChunkVoxelColumns } from './chunkVoxelColumns';

export function chunkClippedPaint(
  chunkOriginX: number,
  chunkOriginY: number,
  into: ChunkVoxelColumns,
): PaintVoxel {
  return (worldX, worldY, layer, packed) => {
    const cellX = worldX - chunkOriginX;
    const cellY = worldY - chunkOriginY;
    if (cellX < 0 || cellY < 0 || cellX >= CHUNK_SIZE || cellY >= CHUNK_SIZE) return;
    if (layer < 0) return;
    into.paint(cellY * CHUNK_SIZE + cellX, layer, packed);
  };
}
