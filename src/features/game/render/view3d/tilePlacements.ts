import { EMPTY_TILE } from '@/features/asset-library/worlds/values/chunkValues';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { glowOfEmitter } from './selfLitGlow';
import type { TileDef } from '@/features/asset-library/tiles/tileDef';
import { blockLayersOfTile, storedTileHeight } from '@/features/asset-library/tiles/tileHeight';
import type { CubeFaceArt } from '@/features/asset-library/tiles/tileFaceArt';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import {
  DEFAULT_TILE_SHAPE,
  shapeFillsCell,
  type TileShapeKind,
} from '@/features/asset-library/tiles/tileShapeKind';
import { wallConnectionMask } from './shaped/shapedTileBoxParts';

export interface TilePlacement {
  x: number;
  y: number;
  elevation: number;
  height: number;
  baseColor: string;
  shade: number;
  faceArt: CubeFaceArt | null;
  textureId: string | null;
  glow: number;
  sunkenAsWater: boolean;
  shape: TileShapeKind;
  facing: number;
}

export interface TilePlacementsByShape {
  floors: TilePlacement[];
  blocks: TilePlacement[];
  shaped: TilePlacement[];
}

const WATER_SHADE = 0.7;
const BLOCK_FLOOR_SHADE = 0.8;

export function tilePlacementsForRect(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  minX: number,
  minY: number,
  width: number,
  height: number,
): TilePlacementsByShape {
  const shapes: TilePlacementsByShape = { floors: [], blocks: [], shaped: [] };
  for (let y = minY; y < minY + height; y++) {
    for (let x = minX; x < minX + width; x++) {
      addCellToShapes(shapes, sampler, tileAssets, x, y);
    }
  }
  return shapes;
}

function addCellToShapes(
  shapes: TilePlacementsByShape,
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  x: number,
  y: number,
): void {
  const tileId = sampler.tileAt(x, y);
  if (tileId === EMPTY_TILE) return;
  const tile = tileAssets.byId(tileId);
  if (!tile) return;
  const facing =
    tile.shape === 'wall'
      ? wallConnectionMask((direction) =>
          sealsWallSeam(tileAssets.byId(sampler.tileAt(x + direction.dx, y + direction.dy))),
        )
      : sampler.groundFacingAt(x, y);
  addTileToShapes(shapes, tile, x, y, sampler.elevationAt(x, y), facing);
}

export function sealsWallSeam(tile: TileDef | undefined): boolean {
  return tile !== undefined && !tile.walkable && tile.role !== 'water';
}

function addTileToShapes(
  shapes: TilePlacementsByShape,
  tile: TileDef,
  x: number,
  y: number,
  elevation: number,
  facing: number,
): void {
  if (!shapeFillsCell(tile.shape)) {
    addShapedTileStandingOnItsFloor(shapes, placement(x, y, elevation, tile, 1, false), facing);
  } else if (tile.role === 'water') {
    shapes.floors.push(placement(x, y, elevation, tile, WATER_SHADE, true));
  } else if (tileStandsAsSolidBlock(tile)) {
    shapes.floors.push(placement(x, y, elevation, tile, BLOCK_FLOOR_SHADE, false));
    for (const layerElevation of blockLayerElevations(tile, elevation)) {
      shapes.blocks.push(placement(x, y, layerElevation, tile, 1, false));
    }
  } else {
    shapes.floors.push(placement(x, y, elevation, tile, 1, false));
  }
}

function addShapedTileStandingOnItsFloor(
  shapes: TilePlacementsByShape,
  standing: TilePlacement,
  facing: number,
): void {
  shapes.floors.push({ ...standing, shape: DEFAULT_TILE_SHAPE });
  shapes.shaped.push({ ...standing, facing });
}

export function tileStandsAsSolidBlock(tile: TileDef): boolean {
  return tile.role === 'rock' || !tile.walkable;
}

function blockLayerElevations(tile: TileDef, elevation: number): number[] {
  return Array.from({ length: blockLayersOfTile(tile) }, (_, layer) => elevation + layer);
}

function placement(
  x: number,
  y: number,
  elevation: number,
  tile: TileDef,
  shade: number,
  sunkenAsWater: boolean,
): TilePlacement {
  return {
    x,
    y,
    elevation,
    height: storedTileHeight(tile),
    baseColor: tile.color,
    shade,
    faceArt: tile.faceArt,
    textureId: tile.textureId,
    glow: glowOfEmitter(tile),
    sunkenAsWater,
    shape: tile.shape,
    facing: 0,
  };
}
