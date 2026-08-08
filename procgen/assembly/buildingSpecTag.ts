import { hashString } from '../random/hashString';
import { clampedProgram } from './buildingPrograms';
import { normalizedFacing, type BuildingSpec } from './buildingSpec';

const TAG_PREFIX = 'bld';

export function specToTag(spec: BuildingSpec): string {
  return `${TAG_PREFIX}:${clampedProgram(spec.program)}:${normalizedFacing(spec.facing)}`;
}

export function tagToSpec(tag: string, x: number, y: number): BuildingSpec {
  const parts = tag.split(':');
  const tagged = parts[0] === TAG_PREFIX;
  return {
    x,
    y,
    program: tagged ? clampedProgram(Number(parts[1])) : 0,
    facing: tagged ? normalizedFacing(Number(parts[2])) : facingFromPosition(x, y),
    seedKey: buildingSeedKeyAt(x, y),
  };
}

export function buildingSeedKeyAt(x: number, y: number): string {
  return `building:${x},${y}`;
}

function facingFromPosition(x: number, y: number): number {
  return hashString(`building-facing:${x},${y}`) % 4;
}
