import { hashLatticePoint } from '../../../../procgen/noise/hashLatticePoint';
import { heightInk } from '../../faceArtHeight';
import { darken, lighten, mixHex } from '../colorMath';
import { wrapped, type PixelPainter } from '../pixelCanvas';

export interface BrickLayout {
  courseHeight: number;
  brickWidth: number;
  stagger: number;
}

export interface BrickStyle {
  base: string;
  mortar: string;
  seed: number;
  size: number;
  roundedCorners?: boolean;
  toneSpread?: number;
}

const MORTAR_DEPTH = 0.24;
const BRICK_FACE_HEIGHT = 0.62;
const BRICK_LIP_HEIGHT = 0.82;
const BRICK_SILL_HEIGHT = 0.44;

interface BrickCell {
  course: number;
  brick: number;
  localX: number;
  localY: number;
}

export function brickworkPainter(layout: BrickLayout, style: BrickStyle): PixelPainter {
  return (x, y) => {
    const cell = brickCellAt(x, y, layout, style.size);
    if (isJointPixel(cell, layout, style.roundedCorners === true)) return style.mortar;
    return bevelledBrickFace(cell, layout, style);
  };
}

export function brickReliefPainter(layout: BrickLayout, style: BrickStyle): PixelPainter {
  return (x, y) => {
    const cell = brickCellAt(x, y, layout, style.size);
    if (isJointPixel(cell, layout, style.roundedCorners === true)) return heightInk(MORTAR_DEPTH);
    return heightInk(brickFaceHeight(cell, layout));
  };
}

function brickCellAt(x: number, y: number, layout: BrickLayout, size: number): BrickCell {
  const course = Math.floor(y / layout.courseHeight);
  const alongCourse = wrapped(x + course * layout.stagger, size);
  return {
    course,
    brick: Math.floor(alongCourse / layout.brickWidth),
    localX: alongCourse % layout.brickWidth,
    localY: y % layout.courseHeight,
  };
}

function brickFaceHeight(cell: BrickCell, layout: BrickLayout): number {
  if (cell.localY === 1) return BRICK_LIP_HEIGHT;
  if (cell.localY === layout.courseHeight - 1) return BRICK_SILL_HEIGHT;
  return BRICK_FACE_HEIGHT;
}

function isJointPixel(cell: BrickCell, layout: BrickLayout, roundedCorners: boolean): boolean {
  if (cell.localX === 0 || cell.localY === 0) return true;
  if (!roundedCorners) return false;
  const atEndX = cell.localX === 1 || cell.localX === layout.brickWidth - 1;
  const atEndY = cell.localY === 1 || cell.localY === layout.courseHeight - 1;
  return atEndX && atEndY;
}

function bevelledBrickFace(cell: BrickCell, layout: BrickLayout, style: BrickStyle): string {
  const face = tonedBrick(cell, style);
  if (cell.localY === 1) return lighten(face, 0.18);
  if (cell.localY === layout.courseHeight - 1) return darken(face, 0.18);
  return face;
}

function tonedBrick(cell: BrickCell, style: BrickStyle): string {
  const spread = style.toneSpread ?? 0.16;
  const tone = hashLatticePoint(cell.brick, cell.course, style.seed);
  return mixHex(darken(style.base, spread), lighten(style.base, spread), tone);
}
