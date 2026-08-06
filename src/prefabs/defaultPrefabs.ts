import { blankVoxels, withCenteredAnchor, type Prefab } from './prefabDef';
import { paintFilledRect, paintRectOutline, paintVoxel } from './prefabPainting';

export type TileIdByName = (name: string) => number;

export function defaultPrefabs(tileIdOf: TileIdByName): Prefab[] {
  return [cottage(0, tileIdOf), watchtower(1, tileIdOf), standingStones(2, tileIdOf)];
}

function blankPrefab(id: number, name: string, width: number, depth: number, layers: number): Prefab {
  return withCenteredAnchor({
    id,
    name,
    width,
    depth,
    layers,
    anchorX: 0,
    anchorY: 0,
    voxels: blankVoxels(width, depth, layers),
  });
}

function cottage(id: number, tileIdOf: TileIdByName): Prefab {
  const prefab = blankPrefab(id, 'cottage', 5, 5, 4);
  paintFilledRect(prefab, 0, tileIdOf('wood planks'));
  paintRectOutline(prefab, 1, tileIdOf('stone wall'));
  paintRectOutline(prefab, 2, tileIdOf('stone wall'));
  paintVoxel(prefab, 2, 4, 1, -1);
  paintVoxel(prefab, 2, 4, 2, -1);
  paintFilledRect(prefab, 3, tileIdOf('thatch roof'));
  return prefab;
}

function watchtower(id: number, tileIdOf: TileIdByName): Prefab {
  const prefab = blankPrefab(id, 'watchtower', 3, 3, 7);
  paintFilledRect(prefab, 0, tileIdOf('flagstone'));
  for (let layer = 1; layer <= 5; layer++) paintRectOutline(prefab, layer, tileIdOf('brick wall'));
  paintFilledRect(prefab, 6, tileIdOf('flagstone'));
  paintVoxel(prefab, 1, 2, 1, -1);
  return prefab;
}

function standingStones(id: number, tileIdOf: TileIdByName): Prefab {
  const prefab = blankPrefab(id, 'standing stones', 7, 7, 3);
  for (const [x, y] of [
    [3, 0],
    [6, 3],
    [3, 6],
    [0, 3],
    [1, 1],
    [5, 5],
  ]) {
    for (let layer = 0; layer < 3; layer++) paintVoxel(prefab, x!, y!, layer, tileIdOf('rock'));
  }
  paintVoxel(prefab, 3, 3, 0, tileIdOf('cobblestone'));
  return prefab;
}
