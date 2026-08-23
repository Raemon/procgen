export const TILE_SHAPE_KINDS = [
  'cube',
  'slabLower',
  'slabUpper',
  'panel',
  'stairs',
  'ramp',
  'diagonalWall',
  'wall',
] as const;

export type TileShapeKind = (typeof TILE_SHAPE_KINDS)[number];

export const DEFAULT_TILE_SHAPE: TileShapeKind = 'cube';

export const BLOCKING_TILE_SHAPES = ['cube', 'wall'] as const satisfies readonly TileShapeKind[];

export function isTileShapeKind(value: unknown): value is TileShapeKind {
  return TILE_SHAPE_KINDS.includes(value as TileShapeKind);
}

export function shapeFillsCell(shape: TileShapeKind): boolean {
  return shape === 'cube';
}

export function shapeSealsAgainstNeighbours(shape: TileShapeKind): boolean {
  return BLOCKING_TILE_SHAPES.includes(shape as (typeof BLOCKING_TILE_SHAPES)[number]);
}

export function sealedShapeNearestTo(shape: TileShapeKind): TileShapeKind {
  if (shapeSealsAgainstNeighbours(shape)) return shape;
  return shape === 'panel' || shape === 'diagonalWall' ? 'wall' : 'cube';
}
