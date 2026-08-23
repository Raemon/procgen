import type { TileShapeKind } from '@/features/asset-library/tiles/tileShapeKind';
import type { PositionedBox } from './boxPartBuckets';

const SLAB_HEIGHT = 0.5;
const PANEL_THICKNESS = 0.25;
const DIAGONAL_WALL_THICKNESS = 0.3;
const DIAGONAL_YAW = Math.PI / 4;
const WALL_CORE_SIDE = 0.5;
const WALL_ARM_THICKNESS = 0.375;

export interface WallDirection {
  bit: number;
  dx: number;
  dy: number;
}

export const WALL_DIRECTIONS: readonly WallDirection[] = [
  { bit: 1, dx: 0, dy: -1 },
  { bit: 2, dx: 1, dy: 0 },
  { bit: 4, dx: 0, dy: 1 },
  { bit: 8, dx: -1, dy: 0 },
];

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

export function wallConnectionMask(seals: (direction: WallDirection) => boolean): number {
  return WALL_DIRECTIONS.filter(seals).reduce((mask, direction) => mask | direction.bit, 0);
}

export function wallBoxParts(connections: number): PositionedBox[] {
  return [
    { width: WALL_CORE_SIDE, height: 1, depth: WALL_CORE_SIDE, x: 0, y: 0, z: 0 },
    ...WALL_DIRECTIONS.filter((direction) => connections & direction.bit).map(wallArm),
  ];
}

function wallArm(direction: WallDirection): PositionedBox {
  const reach = (1 - WALL_CORE_SIDE) / 2;
  return {
    width: direction.dx === 0 ? WALL_ARM_THICKNESS : reach,
    height: 1,
    depth: direction.dy === 0 ? WALL_ARM_THICKNESS : reach,
    x: direction.dx * (WALL_CORE_SIDE + reach) / 2,
    y: 0,
    z: direction.dy * (WALL_CORE_SIDE + reach) / 2,
  };
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
