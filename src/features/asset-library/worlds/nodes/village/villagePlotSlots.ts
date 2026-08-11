import {
  FACING_EAST,
  FACING_NORTH,
  FACING_SOUTH,
  FACING_WEST,
} from '../../assembly/buildingSpec';
import type { VillageAxis, VillageStreetKnobs } from './villageStreetRects';
import { rectFromBounds, type VillageRect } from './villageRect';

export interface VillagePlotSlot {
  rect: VillageRect;
  facing: number;
  ring: number;
}

export function plotSlotsOf(
  axis: VillageAxis,
  centerX: number,
  centerY: number,
  knobs: VillageStreetKnobs,
): VillagePlotSlot[] {
  const slots: VillagePlotSlot[] = [];
  for (let ring = 0; ring < ringCount(knobs); ring++) {
    for (const along of [1, -1]) {
      for (const side of [-1, 1]) slots.push(slotAt(axis, centerX, centerY, knobs, { ring, along, side }));
    }
  }
  return slots;
}

interface SlotPosition {
  ring: number;
  along: number;
  side: number;
}

function ringCount(knobs: VillageStreetKnobs): number {
  return Math.max(0, Math.floor((knobs.radius - plazaHalfOf(knobs) - 1) / knobs.plotCells));
}

function plazaHalfOf(knobs: VillageStreetKnobs): number {
  return Math.floor(knobs.streetWidth / 2) + 1;
}

function slotAt(
  axis: VillageAxis,
  centerX: number,
  centerY: number,
  knobs: VillageStreetKnobs,
  position: SlotPosition,
): VillagePlotSlot {
  const alongCenter = axis.horizontal ? centerX : centerY;
  const perpCenter = axis.horizontal ? centerY : centerX;
  const along = alongSpanOf(alongCenter, knobs, position);
  const perp = perpSpanOf(perpCenter, knobs, position.side);
  return {
    rect: rectOf(axis, along, perp),
    facing: facingOf(axis, position.side),
    ring: position.ring,
  };
}

interface Span {
  min: number;
  max: number;
}

function alongSpanOf(alongCenter: number, knobs: VillageStreetKnobs, position: SlotPosition): Span {
  const offset = plazaHalfOf(knobs) + 1 + position.ring * knobs.plotCells;
  if (position.along > 0) {
    return { min: alongCenter + offset, max: alongCenter + offset + knobs.plotCells - 1 };
  }
  return { min: alongCenter - offset - knobs.plotCells + 1, max: alongCenter - offset };
}

function perpSpanOf(perpCenter: number, knobs: VillageStreetKnobs, side: number): Span {
  const half = Math.floor(knobs.streetWidth / 2);
  if (side < 0) {
    return { min: perpCenter - half - knobs.plotCells, max: perpCenter - half - 1 };
  }
  const streetMax = perpCenter - half + knobs.streetWidth - 1;
  return { min: streetMax + 1, max: streetMax + knobs.plotCells };
}

function rectOf(axis: VillageAxis, along: Span, perp: Span): VillageRect {
  if (axis.horizontal) return rectFromBounds(along.min, perp.min, along.max, perp.max);
  return rectFromBounds(perp.min, along.min, perp.max, along.max);
}

function facingOf(axis: VillageAxis, side: number): number {
  if (axis.horizontal) return side < 0 ? FACING_SOUTH : FACING_NORTH;
  return side < 0 ? FACING_EAST : FACING_WEST;
}
