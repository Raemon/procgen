import { EMPTY_TILE } from '../../procgen/values/chunkValues';
import type { WorldSampler } from '../../procgen/worldSampler';
import { glowOfEmitter } from './selfLitGlow';
import type { TileDef } from '../../world/tiles/tileDef';
import {
  blockLayersOfTile,
  storedTileHeight,
  WALKABLE_TILE_HEIGHT,
} from '../../world/tiles/tileHeight';
import type { CubeFaceArt } from '../../world/tiles/tileFaceArt';
import type { ReadOnlyTileset } from '../../app/readOnlyLibraries';

export interface TilePlacement {
  x: number;
  y: number;
  elevation: number;
  height: number;
  baseColor: string;
  shade: number;
  faceArt: CubeFaceArt | null;
  glow: number;
  sunkenAsWater: boolean;
}

export interface TilePlacementsByShape {
  floors: TilePlacement[];
  blocks: TilePlacement[];
  trees: TilePlacement[];
}

const WATER_SHADE = 0.7;
const BLOCK_FLOOR_SHADE = 0.8;
const FALLBACK_TREE_GROUND = '#3c5a34';

export function tilePlacementsForRect(
  sampler: WorldSampler,
  tileset: ReadOnlyTileset,
  minX: number,
  minY: number,
  width: number,
  height: number,
): TilePlacementsByShape {
  const shapes: TilePlacementsByShape = { floors: [], blocks: [], trees: [] };
  for (let y = minY; y < minY + height; y++) {
    for (let x = minX; x < minX + width; x++) {
      addCellToShapes(shapes, sampler, tileset, x, y);
    }
  }
  return shapes;
}

function addCellToShapes(
  shapes: TilePlacementsByShape,
  sampler: WorldSampler,
  tileset: ReadOnlyTileset,
  x: number,
  y: number,
): void {
  const tileId = sampler.tileAt(x, y);
  if (tileId === EMPTY_TILE) return;
  const tile = tileset.byId(tileId);
  if (tile) addTileToShapes(shapes, tile, tileset, x, y, sampler.elevationAt(x, y));
}

function addTileToShapes(
  shapes: TilePlacementsByShape,
  tile: TileDef,
  tileset: ReadOnlyTileset,
  x: number,
  y: number,
  elevation: number,
): void {
  if (tile.role === 'water') {
    shapes.floors.push(placement(x, y, elevation, tile, WATER_SHADE, true));
  } else if (tile.role === 'tree') {
    shapes.floors.push(groundUnderTree(tileset, x, y, elevation));
    shapes.trees.push(placement(x, y, elevation, tile, 1, false));
  } else if (tileStandsAsSolidBlock(tile)) {
    shapes.floors.push(placement(x, y, elevation, tile, BLOCK_FLOOR_SHADE, false));
    for (const layerElevation of blockLayerElevations(tile, elevation)) {
      shapes.blocks.push(placement(x, y, layerElevation, tile, 1, false));
    }
  } else {
    shapes.floors.push(placement(x, y, elevation, tile, 1, false));
  }
}

export function tileStandsAsSolidBlock(tile: TileDef): boolean {
  return tile.role === 'rock' || !tile.walkable;
}

function blockLayerElevations(tile: TileDef, elevation: number): number[] {
  return Array.from({ length: blockLayersOfTile(tile) }, (_, layer) => elevation + layer);
}

function groundUnderTree(
  tileset: ReadOnlyTileset,
  x: number,
  y: number,
  elevation: number,
): TilePlacement {
  const grass = tileset.byRole('grass');
  return {
    x,
    y,
    elevation,
    height: WALKABLE_TILE_HEIGHT,
    baseColor: grass?.color ?? FALLBACK_TREE_GROUND,
    shade: 1,
    faceArt: grass?.faceArt ?? null,
    glow: glowOfEmitter(grass),
    sunkenAsWater: false,
  };
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
    glow: glowOfEmitter(tile),
    sunkenAsWater,
  };
}
