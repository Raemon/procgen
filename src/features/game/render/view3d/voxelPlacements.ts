import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { EMPTY_VOXEL } from '@/features/asset-library/pieces/pieceDef';
import { facingOfVoxel, tileIdOfVoxel } from '@/features/asset-library/worlds/structureOverlay/packedVoxel';
import { blockLayersOfTile, WALKABLE_TILE_HEIGHT } from '@/features/asset-library/tiles/tileHeight';
import { shapeFillsCell } from '@/features/asset-library/tiles/tileShapeKind';
import type { TileDef } from '@/features/asset-library/tiles/tileDef';
import { glowOfEmitter } from './selfLitGlow';
import { wallConnectionMask } from './shaped/shapedTileBoxParts';
import { sealsWallSeam, tileStandsAsSolidBlock, type TilePlacement } from './tilePlacements';

export interface VoxelPlacementsByShape {
  voxels: TilePlacement[];
  shaped: TilePlacement[];
}

export function voxelPlacementsForRect(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  minX: number,
  minY: number,
  width: number,
  height: number,
): VoxelPlacementsByShape {
  const shapes: VoxelPlacementsByShape = { voxels: [], shaped: [] };
  for (let y = minY; y < minY + height; y++) {
    for (let x = minX; x < minX + width; x++) {
      collectColumn(shapes, sampler, tileAssets, x, y);
    }
  }
  return shapes;
}

function collectColumn(
  into: VoxelPlacementsByShape,
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  x: number,
  y: number,
): void {
  const column = sampler.packedVoxelColumnAt(x, y);
  if (!column || column.length < 2) return;
  const groundElevation = sampler.elevationAt(x, y) + standingHeightOfGround(sampler, tileAssets, x, y);
  for (let layer = 1; layer < column.length; layer++) {
    collectVoxel(into, sampler, tileAssets, x, y, layer, groundElevation + layer - 1, column[layer] ?? EMPTY_VOXEL);
  }
}

function collectVoxel(
  into: VoxelPlacementsByShape,
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  x: number,
  y: number,
  layer: number,
  elevation: number,
  packed: number,
): void {
  const tile = tileAssets.byId(tileIdOfVoxel(packed));
  if (!tile) return;
  const facing =
    tile.shape === 'wall'
      ? wallConnectionMask((direction) =>
          voxelSealsWallSeam(sampler, tileAssets, x + direction.dx, y + direction.dy, layer),
        )
      : facingOfVoxel(packed);
  const placement = voxelPlacement(tile, x, y, elevation, facing);
  (shapeFillsCell(tile.shape) ? into.voxels : into.shaped).push(placement);
}

function voxelSealsWallSeam(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  x: number,
  y: number,
  layer: number,
): boolean {
  const packed = sampler.packedVoxelColumnAt(x, y)?.[layer];
  if (packed !== undefined && packed !== EMPTY_VOXEL) {
    const tile = tileAssets.byId(tileIdOfVoxel(packed));
    if (tile && !tile.walkable) return true;
  }
  const ground = tileAssets.byId(sampler.tileAt(x, y));
  return ground !== undefined && sealsWallSeam(ground) && blockLayersOfTile(ground) >= layer;
}

function voxelPlacement(
  tile: TileDef,
  x: number,
  y: number,
  elevation: number,
  facing: number,
): TilePlacement {
  return {
    x,
    y,
    elevation,
    height: WALKABLE_TILE_HEIGHT,
    baseColor: tile.color,
    textureId: tile.textureId,
    shade: 1,
    faceArt: tile.faceArt,
    glow: glowOfEmitter(tile),
    sunkenAsWater: false,
    shape: tile.shape,
    facing,
  };
}

function standingHeightOfGround(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  x: number,
  y: number,
): number {
  const tile = tileAssets.byId(sampler.tileAt(x, y));
  return tile && tileStandsAsSolidBlock(tile) ? blockLayersOfTile(tile) : 0;
}
