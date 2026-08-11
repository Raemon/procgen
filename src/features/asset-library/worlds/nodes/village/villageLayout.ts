import { buildingSeedKeyAt } from '../../assembly/buildingPoint';
import type { BuildingSpec } from '../../assembly/buildingSpec';
import { PRESENT } from '../../time/worldTime';
import { BORN, pointNumber, type PointWithData } from '../../values/pointData';
import type { VillageHashSeed } from './villageHashSeed';
import { plotSlotsOf, type VillagePlotSlot } from './villagePlotSlots';
import { programForSlot } from './villagePlotPrograms';
import { rectContains, rectsOverlap, type VillageRect } from './villageRect';
import {
  axisForCenter,
  crossLaneRect,
  mainStreetRect,
  plazaRect,
  type VillageStreetKnobs,
} from './villageStreetRects';

export interface VillageLayoutKnobs extends VillageStreetKnobs {
  weights: readonly number[];
}

export interface VillageCenter extends PointWithData {
  x: number;
  y: number;
}

export interface VillagePlot {
  rect: VillageRect;
  spec: BuildingSpec;
  ring: number;
}

export interface VillagePlan {
  centerX: number;
  centerY: number;
  streets: VillageRect[];
  plaza: VillageRect;
  plots: VillagePlot[];
}

export function layoutForCenter(
  hashSeed: VillageHashSeed,
  center: VillageCenter,
  knobs: VillageLayoutKnobs,
): VillagePlan {
  const centerX = center.x;
  const centerY = center.y;
  const townAge = PRESENT - pointNumber(center, BORN, -Infinity);
  const axis = axisForCenter(hashSeed);
  const streets = streetRectsOf(axis, centerX, centerY, knobs);
  const plaza = plazaRect(centerX, centerY, knobs);
  const slots = plotSlotsOf(axis, centerX, centerY, knobs);
  const paved = [...streets, plaza];
  return { centerX, centerY, streets, plaza, plots: plotsOf(slots, paved, knobs, townAge, hashSeed) };
}

export function planCoversStreetCell(plan: VillagePlan, x: number, y: number): boolean {
  return plan.streets.some((rect) => rectContains(rect, x, y));
}

export function planCoversPlazaCell(plan: VillagePlan, x: number, y: number): boolean {
  return rectContains(plan.plaza, x, y);
}

function streetRectsOf(
  axis: ReturnType<typeof axisForCenter>,
  centerX: number,
  centerY: number,
  knobs: VillageLayoutKnobs,
): VillageRect[] {
  const cross = crossLaneRect(axis, centerX, centerY, knobs);
  return cross
    ? [mainStreetRect(axis, centerX, centerY, knobs), cross]
    : [mainStreetRect(axis, centerX, centerY, knobs)];
}

function plotsOf(
  slots: readonly VillagePlotSlot[],
  paved: readonly VillageRect[],
  knobs: VillageLayoutKnobs,
  townAge: number,
  hashSeed: VillageHashSeed,
): VillagePlot[] {
  return slots
    .map((slot, slotIndex) => plotOf(slot, slotIndex, knobs, townAge, hashSeed))
    .filter((plot) => paved.every((rect) => !rectsOverlap(plot.rect, rect)));
}

function plotOf(
  slot: VillagePlotSlot,
  slotIndex: number,
  knobs: VillageLayoutKnobs,
  townAge: number,
  hashSeed: VillageHashSeed,
): VillagePlot {
  const choice = {
    slotIndex,
    ring: slot.ring,
    plotCells: knobs.plotCells,
    townAge,
    weights: knobs.weights,
  };
  const program = programForSlot(choice, hashSeed);
  return { rect: slot.rect, spec: specForPlot(slot, program), ring: slot.ring };
}

function specForPlot(slot: VillagePlotSlot, program: number): BuildingSpec {
  return {
    x: slot.rect.x,
    y: slot.rect.y,
    program,
    facing: slot.facing,
    seedKey: buildingSeedKeyAt(slot.rect.x, slot.rect.y),
  };
}
