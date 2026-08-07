import { EMPTY_TILE } from '../../../procgen/values/chunkValues';
import type { WorldSampler } from '../../../procgen/worldSampler';
import type { ReadOnlyTileset } from '../../../frontend/readOnlyLibraries';
import { blockLayersOfTile, WALKABLE_TILE_HEIGHT } from '../../../library/tiles/tileHeight';
import { glowOfEmitter } from './selfLitGlow';
import { tileStandsAsSolidBlock, type TilePlacement } from './tilePlacements';

export function voxelPlacementsForRect(
  sampler: WorldSampler,
  tileset: ReadOnlyTileset,
  minX: number,
  minY: number,
  width: number,
  height: number,
): TilePlacement[] {
  const placements: TilePlacement[] = [];
  for (let y = minY; y < minY + height; y++) {
    for (let x = minX; x < minX + width; x++) {
      collectColumn(placements, sampler, tileset, x, y);
    }
  }
  return placements;
}

function collectColumn(
  into: TilePlacement[],
  sampler: WorldSampler,
  tileset: ReadOnlyTileset,
  x: number,
  y: number,
): void {
  const column = sampler.voxelColumnAt(x, y);
  if (!column || column.length < 2) return;
  const groundElevation = sampler.elevationAt(x, y) + standingHeightOfGround(sampler, tileset, x, y);
  for (let layer = 1; layer < column.length; layer++) {
    const tile = tileset.byId(column[layer] ?? EMPTY_TILE);
    if (!tile) continue;
    into.push({
      x,
      y,
      elevation: groundElevation + layer - 1,
      height: WALKABLE_TILE_HEIGHT,
      baseColor: tile.color,
      shade: 1,
      faceArt: tile.faceArt,
      glow: glowOfEmitter(tile),
      sunkenAsWater: false,
    });
  }
}

function standingHeightOfGround(
  sampler: WorldSampler,
  tileset: ReadOnlyTileset,
  x: number,
  y: number,
): number {
  const tile = tileset.byId(sampler.tileAt(x, y));
  return tile && tileStandsAsSolidBlock(tile) ? blockLayersOfTile(tile) : 0;
}
