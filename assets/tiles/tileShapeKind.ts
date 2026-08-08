export const TILE_SHAPE_KINDS = [
  'cube',
  'slabLower',
  'slabUpper',
  'panel',
  'stairs',
  'ramp',
  'diagonalWall',
] as const;

export type TileShapeKind = (typeof TILE_SHAPE_KINDS)[number];

export const DEFAULT_TILE_SHAPE: TileShapeKind = 'cube';

const DIRECTIONAL_SHAPES: readonly TileShapeKind[] = ['panel', 'stairs', 'ramp', 'diagonalWall'];

export function isTileShapeKind(value: unknown): value is TileShapeKind {
  return TILE_SHAPE_KINDS.includes(value as TileShapeKind);
}

export function shapeFillsCell(shape: TileShapeKind): boolean {
  return shape === 'cube';
}

export function shapeIsDirectional(shape: TileShapeKind): boolean {
  return DIRECTIONAL_SHAPES.includes(shape);
}
