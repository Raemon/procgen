import type { ChunkOccluderField } from './chunkOccluderField';
import type { OccluderBox } from './occluderBox';

export const EAST_FACE = 1;
export const WEST_FACE = 2;
export const TOP_FACE = 4;
export const BOTTOM_FACE = 8;
export const SOUTH_FACE = 16;
export const NORTH_FACE = 32;
export const EVERY_FACE = EAST_FACE | WEST_FACE | TOP_FACE | BOTTOM_FACE | SOUTH_FACE | NORTH_FACE;

const SIDES = [
  { face: EAST_FACE, stepX: 1, stepY: 0 },
  { face: WEST_FACE, stepX: -1, stepY: 0 },
  { face: SOUTH_FACE, stepX: 0, stepY: 1 },
  { face: NORTH_FACE, stepX: 0, stepY: -1 },
] as const;

const TOUCHING_DEPTH = 1e-3;
const probe: OccluderBox = { bottom: 0, top: 0, width: 1 };

export function visibleFacesOf(
  field: ChunkOccluderField,
  x: number,
  y: number,
  box: OccluderBox,
): number {
  return unsealedSides(field, x, y, box) | unsealedTopAndBottom(field, x, y, box);
}

function unsealedSides(
  field: ChunkOccluderField,
  x: number,
  y: number,
  box: OccluderBox,
): number {
  let faces = 0;
  for (const side of SIDES) {
    if (!field.sealsSpan(x + side.stepX, y + side.stepY, box)) faces |= side.face;
  }
  return faces;
}

function unsealedTopAndBottom(
  field: ChunkOccluderField,
  x: number,
  y: number,
  box: OccluderBox,
): number {
  return (
    (sealsJustAbove(field, x, y, box) ? 0 : TOP_FACE) |
    (sealsJustBelow(field, x, y, box) ? 0 : BOTTOM_FACE)
  );
}

function sealsJustAbove(
  field: ChunkOccluderField,
  x: number,
  y: number,
  box: OccluderBox,
): boolean {
  return field.sealsSpan(x, y, probeSpanning(box.top, box.top + TOUCHING_DEPTH, box.width));
}

function sealsJustBelow(
  field: ChunkOccluderField,
  x: number,
  y: number,
  box: OccluderBox,
): boolean {
  return field.sealsSpan(x, y, probeSpanning(box.bottom - TOUCHING_DEPTH, box.bottom, box.width));
}

function probeSpanning(bottom: number, top: number, width: number): OccluderBox {
  probe.bottom = bottom;
  probe.top = top;
  probe.width = width;
  return probe;
}
