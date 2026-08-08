import {
  blankVoxels,
  MAX_PREFAB_LAYERS,
  MAX_PREFAB_SIDE,
  voxelAt,
  withCenteredAnchor,
  type Prefab,
} from './prefabDef';

export interface PrefabExtent {
  width: number;
  depth: number;
  layers: number;
}

export function resizedPrefab(prefab: Prefab, extent: PrefabExtent): Prefab {
  const size = clampedExtent(extent);
  const resized: Prefab = { ...prefab, ...size, voxels: blankVoxels(size.width, size.depth, size.layers) };
  copyOverlappingVoxels(prefab, resized);
  return withCenteredAnchor(resized);
}

export function shiftedPrefab(prefab: Prefab, dx: number, dy: number, dLayer: number): Prefab {
  const shifted: Prefab = {
    ...prefab,
    voxels: blankVoxels(prefab.width, prefab.depth, prefab.layers),
  };
  forEachCell(shifted, (x, y, layer, index) => {
    shifted.voxels[index] = voxelAt(prefab, x - dx, y - dy, layer - dLayer);
  });
  return shifted;
}

function clampedExtent({ width, depth, layers }: PrefabExtent): PrefabExtent {
  return {
    width: clampSide(width, MAX_PREFAB_SIDE),
    depth: clampSide(depth, MAX_PREFAB_SIDE),
    layers: clampSide(layers, MAX_PREFAB_LAYERS),
  };
}

function clampSide(value: number, max: number): number {
  return Math.min(max, Math.max(1, Math.round(value)));
}

function copyOverlappingVoxels(from: Prefab, into: Prefab): void {
  forEachCell(into, (x, y, layer, index) => {
    into.voxels[index] = voxelAt(from, x, y, layer);
  });
}

function forEachCell(
  prefab: Prefab,
  visit: (x: number, y: number, layer: number, index: number) => void,
): void {
  let index = 0;
  for (let layer = 0; layer < prefab.layers; layer++) {
    for (let y = 0; y < prefab.depth; y++) {
      for (let x = 0; x < prefab.width; x++) visit(x, y, layer, index++);
    }
  }
}
