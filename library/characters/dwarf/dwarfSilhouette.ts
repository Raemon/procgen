import type { DwarfAnatomy } from './dwarfAnatomy';
import { DWARF_SKELETON } from './dwarfProportions';

interface WidthStop {
  y: number;
  halfWidth: number;
}

export function torsoHalfWidthAt(anatomy: DwarfAnatomy, breath: number, y: number): number {
  return interpolatedHalfWidth(torsoStops(anatomy, breath), y);
}

function torsoStops(anatomy: DwarfAnatomy, breath: number): WidthStop[] {
  return [
    { y: DWARF_SKELETON.neckY - 2, halfWidth: anatomy.shoulderHalfWidth * 0.5 },
    { y: DWARF_SKELETON.shoulderY, halfWidth: anatomy.shoulderHalfWidth },
    { y: DWARF_SKELETON.chestY, halfWidth: anatomy.chestHalfWidth * (1 + breath * 0.04) },
    { y: DWARF_SKELETON.waistY, halfWidth: anatomy.waistHalfWidth },
    { y: DWARF_SKELETON.hipY + 2, halfWidth: anatomy.hipHalfWidth },
  ];
}

function interpolatedHalfWidth(stops: WidthStop[], y: number): number {
  const first = stops[0]!;
  const last = stops[stops.length - 1]!;
  if (y <= first.y) return first.halfWidth;
  if (y >= last.y) return last.halfWidth;
  for (let index = 1; index < stops.length; index++) {
    const upper = stops[index - 1]!;
    const lower = stops[index]!;
    if (y > lower.y) continue;
    const t = (y - upper.y) / (lower.y - upper.y);
    return upper.halfWidth + (lower.halfWidth - upper.halfWidth) * smoothStep(t);
  }
  return last.halfWidth;
}

function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}
