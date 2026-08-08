export const EMPTY_VOXEL = -1;
export const MAX_PREFAB_SIDE = 48;
export const MAX_PREFAB_LAYERS = 24;

export interface Prefab {
  id: number;
  name: string;
  width: number;
  depth: number;
  layers: number;
  anchorX: number;
  anchorY: number;
  voxels: number[];
}

export function newPrefabWithId(id: number): Prefab {
  return withCenteredAnchor({
    id,
    name: `prefab ${id}`,
    width: 5,
    depth: 5,
    layers: 3,
    anchorX: 2,
    anchorY: 2,
    voxels: blankVoxels(5, 5, 3),
  });
}

export function blankVoxels(width: number, depth: number, layers: number): number[] {
  return new Array<number>(width * depth * layers).fill(EMPTY_VOXEL);
}

export function voxelIndex(prefab: Prefab, x: number, y: number, layer: number): number {
  return (layer * prefab.depth + y) * prefab.width + x;
}

export function isInsidePrefab(prefab: Prefab, x: number, y: number, layer: number): boolean {
  return (
    x >= 0 && y >= 0 && layer >= 0 && x < prefab.width && y < prefab.depth && layer < prefab.layers
  );
}

export function voxelAt(prefab: Prefab, x: number, y: number, layer: number): number {
  if (!isInsidePrefab(prefab, x, y, layer)) return EMPTY_VOXEL;
  return prefab.voxels[voxelIndex(prefab, x, y, layer)] ?? EMPTY_VOXEL;
}

export function withVoxelsPainted(
  prefab: Prefab,
  indices: readonly number[],
  tileId: number,
): Prefab {
  const voxels = [...prefab.voxels];
  for (const index of indices) if (index >= 0 && index < voxels.length) voxels[index] = tileId;
  return { ...prefab, voxels };
}

export function withCenteredAnchor(prefab: Prefab): Prefab {
  return {
    ...prefab,
    anchorX: Math.floor(prefab.width / 2),
    anchorY: Math.floor(prefab.depth / 2),
  };
}

export function filledVoxelCount(prefab: Prefab): number {
  return prefab.voxels.reduce((count, voxel) => count + (voxel === EMPTY_VOXEL ? 0 : 1), 0);
}

export function prefabFootprintRadius(prefab: Prefab): number {
  return Math.max(prefab.width, prefab.depth);
}
