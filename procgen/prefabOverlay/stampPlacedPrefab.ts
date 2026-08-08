import { EMPTY_VOXEL, voxelAt } from '../../assets/prefabs/prefabDef';
import { rotatedDepth, rotatedWidth, unrotatedCell } from '../../assets/prefabs/prefabRotation';
import { CHUNK_SIZE } from '../chunk';
import type { ChunkVoxelColumns } from './chunkVoxelColumns';
import { packedVoxel } from './packedVoxel';
import type { PlacedPrefab } from './prefabPlacement';

const PREFABS_HAVE_NO_FACING_YET = 0;

export function stampPlacedPrefabIntoChunk(
  placed: PlacedPrefab,
  chunkOriginX: number,
  chunkOriginY: number,
  into: ChunkVoxelColumns,
): void {
  const width = rotatedWidth(placed.prefab, placed.turns);
  const depth = rotatedDepth(placed.prefab, placed.turns);
  for (let localY = 0; localY < depth; localY++) {
    for (let localX = 0; localX < width; localX++) {
      stampColumn(placed, chunkOriginX, chunkOriginY, localX, localY, into);
    }
  }
}

function stampColumn(
  placed: PlacedPrefab,
  chunkOriginX: number,
  chunkOriginY: number,
  localX: number,
  localY: number,
  into: ChunkVoxelColumns,
): void {
  const cellX = placed.originX + localX - chunkOriginX;
  const cellY = placed.originY + localY - chunkOriginY;
  if (cellX < 0 || cellY < 0 || cellX >= CHUNK_SIZE || cellY >= CHUNK_SIZE) return;
  const source = unrotatedCell(placed.prefab, placed.turns, localX, localY);
  const cellIndex = cellY * CHUNK_SIZE + cellX;
  for (let layer = 0; layer < placed.prefab.layers; layer++) {
    const tileId = voxelAt(placed.prefab, source.x, source.y, layer);
    if (tileId !== EMPTY_VOXEL) {
      into.paint(cellIndex, layer, packedVoxel(tileId, PREFABS_HAVE_NO_FACING_YET));
    }
  }
}
