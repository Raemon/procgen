import * as THREE from 'three';
import { EMPTY, type Grid } from '../../world/grid';
import type { TileDef } from '../../world/tiles/tileDef';
import type { Tileset } from '../../world/tiles/tileset';

export interface TilePlacement {
  x: number;
  y: number;
  color: THREE.Color;
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
  const color = new THREE.Color(tile.color);
  if (tile.role === 'water') {
    shapes.floors.push(placement(x, y, color.multiplyScalar(WATER_SHADE), true));
  } else if (tile.role === 'tree') {
    shapes.floors.push(placement(x, y, treeGroundColor(tileset), false));
    shapes.trees.push(placement(x, y, color, false));
  } else if (standsAsSolidBlock(tile)) {
    shapes.floors.push(placement(x, y, color.clone().multiplyScalar(BLOCK_FLOOR_SHADE), false));
    shapes.blocks.push(placement(x, y, color, false));
  } else {
    shapes.floors.push(placement(x, y, color, false));
  }
}

function standsAsSolidBlock(tile: TileDef): boolean {
  return tile.role === 'rock' || !tile.walkable;
}

function treeGroundColor(tileset: Tileset): THREE.Color {
  return new THREE.Color(tileset.byRole('grass')?.color ?? FALLBACK_TREE_GROUND);
}

function placement(
  x: number,
  y: number,
  color: THREE.Color,
  sunkenAsWater: boolean,
): TilePlacement {
  return { x, y, color, sunkenAsWater };
}
