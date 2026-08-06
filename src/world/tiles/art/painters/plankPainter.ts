import { hashLatticePoint } from '../../../../noise/hashLatticePoint';
import { darken, lighten, mixHex } from '../colorMath';
import { wrapped, type PixelPainter } from '../pixelCanvas';

export interface PlankStyle {
  base: string;
  seam: string;
  seed: number;
  size: number;
  plankHeight: number;
  plankLength: number;
}

export function plankPainter(style: PlankStyle): PixelPainter {
  return (x, y) => {
    const plank = Math.floor(y / style.plankHeight);
    const localY = y % style.plankHeight;
    const alongPlank = wrapped(x + plank * 7, style.size);
    if (localY === 0 || alongPlank % style.plankLength === 0) return style.seam;
    return plankFace(alongPlank, plank, localY, style);
  };
}

function plankFace(alongPlank: number, plank: number, localY: number, style: PlankStyle): string {
  const board = tonedBoard(plank, style);
  if (isGrainStreak(alongPlank, plank, localY, style.seed)) return darken(board, 0.14);
  if (localY === 1) return lighten(board, 0.12);
  if (localY === style.plankHeight - 1) return darken(board, 0.1);
  return isNailHead(alongPlank, localY, style) ? darken(board, 0.3) : board;
}

function tonedBoard(plank: number, style: PlankStyle): string {
  const tone = hashLatticePoint(plank, plank * 3, style.seed);
  return mixHex(darken(style.base, 0.12), lighten(style.base, 0.12), tone);
}

function isGrainStreak(alongPlank: number, plank: number, localY: number, seed: number): boolean {
  return hashLatticePoint(alongPlank, plank * 13 + localY, seed) < 0.16;
}

function isNailHead(alongPlank: number, localY: number, style: PlankStyle): boolean {
  const nearJoint = alongPlank % style.plankLength === 2;
  return nearJoint && (localY === 2 || localY === style.plankHeight - 2);
}
