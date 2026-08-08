import { blankVoxels, EMPTY_VOXEL, MAX_PREFAB_LAYERS, MAX_PREFAB_SIDE, withCenteredAnchor, type Prefab } from './prefabDef';
import { paintVoxel } from './prefabPainting';
import { tileIdOfVoxel } from '../../procgen/prefabOverlay/packedVoxel';

export interface WorldRegion {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface RegionSampler {
  tileAt(x: number, y: number): number;
  elevationAt(x: number, y: number): number;
  packedVoxelColumnAt(x: number, y: number): number[] | null;
}

export function regionSize(region: WorldRegion): { width: number; depth: number } {
  return {
    width: Math.min(MAX_PREFAB_SIDE, region.maxX - region.minX + 1),
    depth: Math.min(MAX_PREFAB_SIDE, region.maxY - region.minY + 1),
  };
}

export function prefabFromWorldRegion(
  sampler: RegionSampler,
  region: WorldRegion,
  name: string,
): Omit<Prefab, 'id'> {
  const { width, depth } = regionSize(region);
  const groundLayers = groundLayersForRegion(sampler, region, width, depth);
  const layers = Math.min(MAX_PREFAB_LAYERS, tallestColumn(sampler, region, width, depth, groundLayers));
  const prefab = { id: 0, name, width, depth, layers, anchorX: 0, anchorY: 0, voxels: blankVoxels(width, depth, layers) };
  fillCapturedVoxels(prefab, sampler, region, groundLayers);
  return withCenteredAnchor(prefab);
}

function groundLayersForRegion(
  sampler: RegionSampler,
  region: WorldRegion,
  width: number,
  depth: number,
): number[] {
  const elevations = mapCells(width, depth, (x, y) =>
    sampler.elevationAt(region.minX + x, region.minY + y),
  );
  const lowest = Math.min(...elevations);
  return elevations.map((elevation) =>
    Math.max(0, Math.min(MAX_PREFAB_LAYERS - 1, Math.round(elevation - lowest))),
  );
}

function tallestColumn(
  sampler: RegionSampler,
  region: WorldRegion,
  width: number,
  depth: number,
  groundLayers: number[],
): number {
  const heights = mapCells(width, depth, (x, y, index) => {
    const column = sampler.packedVoxelColumnAt(region.minX + x, region.minY + y);
    return groundLayers[index]! + Math.max(1, column?.length ?? 0);
  });
  return Math.max(1, ...heights);
}

function fillCapturedVoxels(
  prefab: Prefab,
  sampler: RegionSampler,
  region: WorldRegion,
  groundLayers: number[],
): void {
  forEachCell(prefab.width, prefab.depth, (x, y, index) => {
    const worldX = region.minX + x;
    const worldY = region.minY + y;
    fillGroundColumn(prefab, x, y, groundLayers[index]!, sampler.tileAt(worldX, worldY));
    overlayPrefabColumn(
      prefab,
      x,
      y,
      groundLayers[index]!,
      sampler.packedVoxelColumnAt(worldX, worldY),
    );
  });
}

function fillGroundColumn(
  prefab: Prefab,
  x: number,
  y: number,
  topLayer: number,
  tileId: number,
): void {
  if (tileId === EMPTY_VOXEL) return;
  for (let layer = 0; layer <= topLayer; layer++) paintVoxel(prefab, x, y, layer, tileId);
}

function overlayPrefabColumn(
  prefab: Prefab,
  x: number,
  y: number,
  groundLayer: number,
  column: number[] | null,
): void {
  if (!column) return;
  column.forEach((packed, layer) => {
    const tileId = tileIdOfVoxel(packed);
    if (tileId !== EMPTY_VOXEL) paintVoxel(prefab, x, y, groundLayer + layer, tileId);
  });
}

function mapCells<T>(
  width: number,
  depth: number,
  read: (x: number, y: number, index: number) => T,
): T[] {
  const values: T[] = [];
  forEachCell(width, depth, (x, y, index) => values.push(read(x, y, index)));
  return values;
}

function forEachCell(
  width: number,
  depth: number,
  visit: (x: number, y: number, index: number) => void,
): void {
  let index = 0;
  for (let y = 0; y < depth; y++) {
    for (let x = 0; x < width; x++) visit(x, y, index++);
  }
}
