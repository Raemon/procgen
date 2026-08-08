import type { RandomStream } from '../random/mulberry32';
import { massingExtent, type RoomBox } from './buildingMassing';
import { clampedProgram } from './buildingPrograms';

export interface FurnishingSpot {
  x: number;
  y: number;
}

const FURNISHINGS_PER_PROGRAM = [1, 1, 2, 3, 2];
const WEAR_CHANCE = 0.25;

export function furnishingSpotsOf(
  program: number,
  boxes: readonly RoomBox[],
  rng: RandomStream,
): FurnishingSpot[] {
  const wanted = FURNISHINGS_PER_PROGRAM[clampedProgram(program)]!;
  const offered = dressingSpotsOf(boxes).slice(0, wanted);
  return offered.filter(() => rng() >= WEAR_CHANCE);
}

function dressingSpotsOf(boxes: readonly RoomBox[]): FurnishingSpot[] {
  const { width, depth } = massingExtent(boxes);
  return [
    { x: 1, y: depth + 1 },
    { x: width + 1, y: 1 },
    { x: width - 2, y: depth + 1 },
    { x: width + 1, y: depth - 2 },
  ];
}
