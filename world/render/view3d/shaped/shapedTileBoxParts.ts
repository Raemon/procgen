import type { TileShapeKind } from '../../../../assets/tiles/tileShapeKind';
import type { PositionedBox } from './boxPartBuckets';

const SLAB_HEIGHT = 0.5;
const PANEL_THICKNESS = 0.25;
const DIAGONAL_WALL_THICKNESS = 0.3;
const DIAGONAL_YAW = Math.PI / 4;

export function boxPartsOfShape(shape: TileShapeKind): PositionedBox[] {
  if (shape === 'slabLower') return [slab(-SLAB_HEIGHT / 2)];
  if (shape === 'slabUpper') return [slab(SLAB_HEIGHT / 2)];
  if (shape === 'panel') return [northEdgePanel()];
  if (shape === 'stairs') return stairSteps();
  if (shape === 'diagonalWall') return [diagonalWall()];
  return [];
}

function slab(y: number): PositionedBox {
  return { width: 1, height: SLAB_HEIGHT, depth: 1, x: 0, y, z: 0 };
}

function northEdgePanel(): PositionedBox {
  return {
    width: 1,
    height: 1,
    depth: PANEL_THICKNESS,
    x: 0,
    y: 0,
    z: -(1 - PANEL_THICKNESS) / 2,
  };
}

function stairSteps(): PositionedBox[] {
  return [
    slab(-SLAB_HEIGHT / 2),
    { width: 1, height: SLAB_HEIGHT, depth: 0.5, x: 0, y: SLAB_HEIGHT / 2, z: -0.25 },
  ];
}

function diagonalWall(): PositionedBox {
  return {
    width: Math.SQRT2,
    height: 1,
    depth: DIAGONAL_WALL_THICKNESS,
    x: 0,
    y: 0,
    z: 0,
    yaw: DIAGONAL_YAW,
  };
}
