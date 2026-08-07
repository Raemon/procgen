import { EMPTY_TILE } from '../../procgen/values/chunkValues';
import type { WorldSampler } from '../../procgen/worldSampler';
import type { ReadOnlyTileset } from '../../app/readOnlyLibraries';
import type { TilePlacement } from './tilePlacements';

const CEILING_LAYER_HEIGHT = 1;

export function ceilingPlacementsForRect(
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
      addCeilingCell(placements, sampler, tileset, x, y);
    }
  }
  return placements;
}

function addCeilingCell(
  into: TilePlacement[],
  sampler: WorldSampler,
  tileset: ReadOnlyTileset,
  x: number,
  y: number,
): void {
  const tileId = sampler.ceilingTileAt(x, y);
  if (tileId === EMPTY_TILE) return;
  const tile = tileset.byId(tileId);
  if (!tile) return;
  into.push({
    x,
    y,
    elevation: sampler.elevationAt(x, y) + sampler.ceilingHeightAt(x, y),
    height: CEILING_LAYER_HEIGHT,
    baseColor: tile.color,
    shade: 1,
    faceArt: tile.faceArt,
    sunkenAsWater: false,
  });
}
