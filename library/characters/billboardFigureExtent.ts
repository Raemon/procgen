import { spriteGridSize, type SpriteArt } from '../tiles/spriteArt';
import {
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  framesOf,
  type CharacterBillboard,
} from './characterBillboard';

export interface BillboardFigureExtent {
  gridSize: number;
  widthCells: number;
  heightCells: number;
  cellsBelowFeet: number;
}

const EXTENT_CACHE = new WeakMap<CharacterBillboard, BillboardFigureExtent | null>();

export function billboardFigureExtent(
  billboard: CharacterBillboard,
): BillboardFigureExtent | null {
  const cached = EXTENT_CACHE.get(billboard);
  if (cached !== undefined) return cached;
  const extent = measureFigureAcrossFrames(billboard);
  EXTENT_CACHE.set(billboard, extent);
  return extent;
}

function measureFigureAcrossFrames(billboard: CharacterBillboard): BillboardFigureExtent | null {
  let bounds: PaintedBounds | null = null;
  for (const sprite of everyFrame(billboard)) bounds = mergeBounds(bounds, paintedBounds(sprite));
  if (!bounds) return null;
  return {
    gridSize: bounds.gridSize,
    widthCells: widthAroundCenterLine(bounds),
    heightCells: bounds.bottomRow - bounds.topRow,
    cellsBelowFeet: bounds.gridSize - bounds.bottomRow,
  };
}

function everyFrame(billboard: CharacterBillboard): SpriteArt[] {
  return CHARACTER_ROTATIONS.flatMap((rotation) =>
    CHARACTER_ANIMATIONS.flatMap((animation) => framesOf(billboard, rotation, animation)),
  );
}

interface PaintedBounds {
  gridSize: number;
  topRow: number;
  bottomRow: number;
  halfWidth: number;
}

function paintedBounds(sprite: SpriteArt): PaintedBounds | null {
  const gridSize = spriteGridSize(sprite);
  let bounds: PaintedBounds | null = null;
  for (let index = 0; index < sprite.length; index++) {
    if (sprite[index] === null) continue;
    bounds = growToCell(bounds ?? emptyBounds(gridSize), index % gridSize, Math.floor(index / gridSize));
  }
  return bounds;
}

function emptyBounds(gridSize: number): PaintedBounds {
  return { gridSize, topRow: gridSize, bottomRow: 0, halfWidth: 0 };
}

function growToCell(bounds: PaintedBounds, column: number, row: number): PaintedBounds {
  return {
    gridSize: bounds.gridSize,
    topRow: Math.min(bounds.topRow, row),
    bottomRow: Math.max(bounds.bottomRow, row + 1),
    halfWidth: Math.max(bounds.halfWidth, halfWidthOfColumn(bounds.gridSize, column)),
  };
}

function halfWidthOfColumn(gridSize: number, column: number): number {
  return Math.max(Math.abs(column - gridSize / 2), Math.abs(column + 1 - gridSize / 2));
}

function widthAroundCenterLine(bounds: PaintedBounds): number {
  return bounds.halfWidth * 2;
}

function mergeBounds(a: PaintedBounds | null, b: PaintedBounds | null): PaintedBounds | null {
  if (!a) return b;
  if (!b) return a;
  return {
    gridSize: Math.max(a.gridSize, b.gridSize),
    topRow: Math.min(scaledRow(a.topRow, a, b), scaledRow(b.topRow, b, a)),
    bottomRow: Math.max(scaledRow(a.bottomRow, a, b), scaledRow(b.bottomRow, b, a)),
    halfWidth: Math.max(scaledRow(a.halfWidth, a, b), scaledRow(b.halfWidth, b, a)),
  };
}

function scaledRow(value: number, from: PaintedBounds, other: PaintedBounds): number {
  const gridSize = Math.max(from.gridSize, other.gridSize);
  return (value * gridSize) / from.gridSize;
}
