import { isInsidePrefab, voxelIndex, type Prefab } from './prefabDef';

export function paintVoxel(prefab: Prefab, x: number, y: number, layer: number, tileId: number): void {
  if (!isInsidePrefab(prefab, x, y, layer)) return;
  prefab.voxels[voxelIndex(prefab, x, y, layer)] = tileId;
}

export function paintFilledRect(
  prefab: Prefab,
  layer: number,
  tileId: number,
  fromX = 0,
  fromY = 0,
  toX = prefab.width - 1,
  toY = prefab.depth - 1,
): void {
  for (let y = fromY; y <= toY; y++) {
    for (let x = fromX; x <= toX; x++) paintVoxel(prefab, x, y, layer, tileId);
  }
}

export function paintRectOutline(
  prefab: Prefab,
  layer: number,
  tileId: number,
  fromX = 0,
  fromY = 0,
  toX = prefab.width - 1,
  toY = prefab.depth - 1,
): void {
  for (let x = fromX; x <= toX; x++) {
    paintVoxel(prefab, x, fromY, layer, tileId);
    paintVoxel(prefab, x, toY, layer, tileId);
  }
  for (let y = fromY; y <= toY; y++) {
    paintVoxel(prefab, fromX, y, layer, tileId);
    paintVoxel(prefab, toX, y, layer, tileId);
  }
}
