import { hashString } from '../random/hashString';
import type { WorldPoint } from '../values/chunkValues';
import { FACING, PROGRAM, hasPointNumber, pointNumber } from '../values/pointData';
import { clampedProgram } from './buildingPrograms';
import { normalizedFacing, type BuildingSpec } from './buildingSpec';

export const BUILDING_TAG = 'building';

export function buildingPointOf(spec: BuildingSpec): WorldPoint {
  return {
    x: spec.x,
    y: spec.y,
    tag: BUILDING_TAG,
    data: { [PROGRAM]: clampedProgram(spec.program), [FACING]: normalizedFacing(spec.facing) },
  };
}

export function specOfBuildingPoint(point: WorldPoint): BuildingSpec {
  return {
    x: point.x,
    y: point.y,
    program: clampedProgram(pointNumber(point, PROGRAM, 0)),
    facing: facingOfPoint(point),
    seedKey: buildingSeedKeyAt(point.x, point.y),
  };
}

export function buildingSeedKeyAt(x: number, y: number): string {
  return `building:${x},${y}`;
}

function facingOfPoint(point: WorldPoint): number {
  if (hasPointNumber(point, FACING)) return normalizedFacing(pointNumber(point, FACING, 0));
  return hashString(`building-facing:${point.x},${point.y}`) % 4;
}
