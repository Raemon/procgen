import { EMPTY, type Grid } from '../../world/grid';
import type { TileDef } from '../../world/tiles/tileDef';
import type { CubeFaceArt } from '../../world/tiles/tileFaceArt';
import type { Tileset } from '../../world/tiles/tileset';

export interface TilePlacement {
  x: number;
  y: number;
  baseColor: string;
  shade: number;
  faceArt: CubeFaceArt | null;
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

export function tilePlacementsByShape(grid: Grid, tileset: Tileset): TilePlacementsByShape {
  const shapes: TilePlacementsByShape = { floors: [], blocks: [], trees: [] };
  grid.forEach((x, y, tileId) => {
    if (tileId === EMPTY) return;
    const tile = tileset.byId(tileId);
    if (tile) addTileToShapes(shapes, tile, tileset, x, y);
  });
  return shapes;
}

function addTileToShapes(
  shapes: TilePlacementsByShape,
  tile: TileDef,
  tileset: Tileset,
  x: number,
  y: number,
): void {
  if (tile.role === 'water') {
    shapes.floors.push(placement(x, y, tile, WATER_SHADE, true));
  } else if (tile.role === 'tree') {
    shapes.floors.push(groundUnderTree(tileset, x, y));
    shapes.trees.push(placement(x, y, tile, 1, false));
  } else if (standsAsSolidBlock(tile)) {
    shapes.floors.push(placement(x, y, tile, BLOCK_FLOOR_SHADE, false));
    shapes.blocks.push(placement(x, y, tile, 1, false));
  } else {
    shapes.floors.push(placement(x, y, tile, 1, false));
  }
}

function standsAsSolidBlock(tile: TileDef): boolean {
  return tile.role === 'rock' || !tile.walkable;
}

function groundUnderTree(tileset: Tileset, x: number, y: number): TilePlacement {
  const grass = tileset.byRole('grass');
  return {
    x,
    y,
    baseColor: grass?.color ?? FALLBACK_TREE_GROUND,
    shade: 1,
    faceArt: grass?.faceArt ?? null,
    sunkenAsWater: false,
  };
}

function placement(
  x: number,
  y: number,
  tile: TileDef,
  shade: number,
  sunkenAsWater: boolean,
): TilePlacement {
  return { x, y, baseColor: tile.color, shade, faceArt: tile.faceArt, sunkenAsWater };
}
