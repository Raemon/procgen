import { CHUNK_SIZE } from '../chunk';
import { perimeterCount, perimeterIndexOf, ringOf } from './chunkRing';
import { hashUnit } from './hashUnit';
import type { LabyrinthKnobs } from './labyrinthKnobs';
import { radialDoorIndices, ringBreakIndex } from './spiralDoors';

export interface ChunkExits {
  west: number;
  north: number;
  east: number;
  south: number;
}

export const CLOSED = -1;

export function clampedWall(knobs: LabyrinthKnobs): number {
  return Math.max(1, Math.min(2, knobs.wall));
}

export function clampedCorridor(knobs: LabyrinthKnobs): number {
  return Math.max(1, Math.min(3, knobs.corridor));
}

export function doorwaySpread(knobs: LabyrinthKnobs): number {
  return Math.floor((clampedCorridor(knobs) - 1) / 2);
}

export function chunkExitsOf(cx: number, cy: number, knobs: LabyrinthKnobs): ChunkExits {
  return {
    west: seamDoor(cx - 1, cy, cx, cy, `v:${cx - 1},${cy}`, knobs),
    north: seamDoor(cx, cy - 1, cx, cy, `h:${cx},${cy - 1}`, knobs),
    east: seamDoor(cx, cy, cx + 1, cy, `v:${cx},${cy}`, knobs),
    south: seamDoor(cx, cy, cx, cy + 1, `h:${cx},${cy}`, knobs),
  };
}

export function openExitCount(exits: ChunkExits): number {
  return [exits.west, exits.north, exits.east, exits.south].filter((door) => door !== CLOSED).length;
}

export function seamIsOpen(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  knobs: LabyrinthKnobs,
): boolean {
  const ringA = ringOf(ax, ay);
  const ringB = ringOf(bx, by);
  if (ringA === ringB) return tangentialIsOpen(ringA, ax, ay, bx, by, knobs);
  if (ringA < ringB) return radialIsOpen(ringA, bx, by, knobs);
  return radialIsOpen(ringB, ax, ay, knobs);
}

function tangentialIsOpen(
  ring: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  knobs: LabyrinthKnobs,
): boolean {
  const count = perimeterCount(ring);
  const indexA = perimeterIndexOf(ax, ay);
  const indexB = perimeterIndexOf(bx, by);
  const first = (indexA + 1) % count === indexB ? indexA : indexB;
  return first !== ringBreakIndex(ring, knobs);
}

function radialIsOpen(innerRing: number, outerX: number, outerY: number, knobs: LabyrinthKnobs): boolean {
  return radialDoorIndices(innerRing, knobs).includes(perimeterIndexOf(outerX, outerY));
}

function seamDoor(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  label: string,
  knobs: LabyrinthKnobs,
): number {
  if (!seamIsOpen(ax, ay, bx, by, knobs)) return CLOSED;
  return doorOffset(label, knobs);
}

function doorOffset(label: string, knobs: LabyrinthKnobs): number {
  const margin = clampedWall(knobs) + doorwaySpread(knobs);
  const hi = CHUNK_SIZE - 1 - margin;
  const h = hashUnit(`${knobs.seed}:door:${label}`);
  return margin + Math.floor(h * (hi - margin + 1));
}
