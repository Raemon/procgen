import { hashLatticePoint } from '../../../../noise/hashLatticePoint';
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

export function brickworkPainter(layout: BrickLayout, style: BrickStyle): PixelPainter {
  return (x, y) => {
    const course = Math.floor(y / layout.courseHeight);
    const alongCourse = wrapped(x + course * layout.stagger, style.size);
    const [localX, localY] = [alongCourse % layout.brickWidth, y % layout.courseHeight];
    if (isJointPixel(localX, localY, layout, style.roundedCorners === true)) return style.mortar;
    const brick = Math.floor(alongCourse / layout.brickWidth);
    return bevelledBrickFace(course, brick, localY, layout, style);
  };
}

function isJointPixel(
  localX: number,
  localY: number,
  layout: BrickLayout,
  roundedCorners: boolean,
): boolean {
  if (localX === 0 || localY === 0) return true;
  if (!roundedCorners) return false;
  const atEndX = localX === 1 || localX === layout.brickWidth - 1;
  const atEndY = localY === 1 || localY === layout.courseHeight - 1;
  return atEndX && atEndY;
}

function bevelledBrickFace(
  course: number,
  brick: number,
  localY: number,
  layout: BrickLayout,
  style: BrickStyle,
): string {
  const face = tonedBrick(course, brick, style);
  if (localY === 1) return lighten(face, 0.18);
  if (localY === layout.courseHeight - 1) return darken(face, 0.18);
  return face;
}

function tonedBrick(course: number, brick: number, style: BrickStyle): string {
  const spread = style.toneSpread ?? 0.16;
  const tone = hashLatticePoint(brick, course, style.seed);
  return mixHex(darken(style.base, spread), lighten(style.base, spread), tone);
}
