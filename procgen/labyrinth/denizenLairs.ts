import { CHUNK_SIZE } from '../chunk';
import { chunkExitsOf } from './chunkExits';
import { ringOf } from './chunkRing';
import { hashUnit } from './hashUnit';
import type { LabyrinthKnobs } from './labyrinthKnobs';
import { isRoomFloor, roomGeometryOf } from './roomLayout';
import { submazeFloorMask } from './submazeLayout';
import { roleOf, ROOM } from './chunkRole';

export interface DenizenLair {
  x: number;
  y: number;
}

export interface DenizenKnobs {
  rarity: number;
  safeRings: number;
}

export function lairInChunk(
  cx: number,
  cy: number,
  knobs: LabyrinthKnobs,
  denizens: DenizenKnobs,
): DenizenLair | null {
  if (ringOf(cx, cy) <= denizens.safeRings) return null;
  if (hashUnit(`${knobs.seed}:denizen:${cx},${cy}`) >= denizens.rarity) return null;
  return deepestFloorOf(cx, cy, knobs);
}

function deepestFloorOf(cx: number, cy: number, knobs: LabyrinthKnobs): DenizenLair | null {
  const floors = floorCellsOf(cx, cy, knobs);
  if (floors.length === 0) return null;
  const pick = hashUnit(`${knobs.seed}:lair:${cx},${cy}`);
  return floors[Math.min(floors.length - 1, Math.floor(pick * floors.length))]!;
}

function floorCellsOf(cx: number, cy: number, knobs: LabyrinthKnobs): DenizenLair[] {
  const exits = chunkExitsOf(cx, cy, knobs);
  const isRoom = roleOf(cx, cy, knobs) === ROOM;
  const geometry = roomGeometryOf(cx, cy, exits, knobs);
  const mask = isRoom ? null : submazeFloorMask(cx, cy, exits, knobs);
  const cells: DenizenLair[] = [];
  for (let y = 0; y < CHUNK_SIZE; y++) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
      const world = { x: cx * CHUNK_SIZE + x, y: cy * CHUNK_SIZE + y };
      if (isFloorHere(world, geometry, mask, y * CHUNK_SIZE + x)) cells.push(world);
    }
  }
  return cells;
}

function isFloorHere(
  world: DenizenLair,
  geometry: ReturnType<typeof roomGeometryOf>,
  mask: Uint8Array | null,
  index: number,
): boolean {
  if (mask) return mask[index] === 1;
  return isRoomFloor(world.x, world.y, geometry);
}
