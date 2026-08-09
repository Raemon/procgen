import { facingVector, type FacingIndex } from '../facing';

export interface HeadingUpAxes {
  forwardX: number;
  forwardY: number;
  rightX: number;
  rightY: number;
}

export interface WorldOffset {
  dx: number;
  dy: number;
}

export function headingUpGridColumns(radius: number): number {
  return radius * 2 + 1;
}

export function headingUpGridRows(radius: number): number {
  return radius + 1;
}

export function tilesAheadOfGridRow(radius: number, row: number): number {
  return radius - row;
}

export function tilesRightOfGridColumn(radius: number, column: number): number {
  return column - radius;
}

export function headingUpAxes(facing: FacingIndex): HeadingUpAxes {
  const forward = facingVector(facing);
  const length = Math.hypot(forward.dx, forward.dy);
  const forwardX = forward.dx / length;
  const forwardY = forward.dy / length;
  return { forwardX, forwardY, rightX: -forwardY, rightY: forwardX };
}

export function worldOffsetAheadAndRight(
  facing: FacingIndex,
  ahead: number,
  right: number,
): WorldOffset {
  const axes = headingUpAxes(facing);
  return {
    dx: roundHalfAwayFromZero(right * axes.rightX + ahead * axes.forwardX),
    dy: roundHalfAwayFromZero(right * axes.rightY + ahead * axes.forwardY),
  };
}

function roundHalfAwayFromZero(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}
