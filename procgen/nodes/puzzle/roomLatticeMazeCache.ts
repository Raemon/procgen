import type { PuzzleRoomKnobs } from './puzzleRoomKnobs';
import { RoomLatticeMaze } from './roomLatticeMaze';

const LATTICES_KEPT = 4;

const lattices = new Map<string, RoomLatticeMaze>();

export function roomLatticeMazeFor(knobs: PuzzleRoomKnobs): RoomLatticeMaze {
  const key = latticeKey(knobs);
  const known = lattices.get(key);
  if (known) return known;
  if (lattices.size >= LATTICES_KEPT) lattices.clear();
  const fresh = new RoomLatticeMaze(knobs);
  lattices.set(key, fresh);
  return fresh;
}

function latticeKey(knobs: PuzzleRoomKnobs): string {
  return [knobs.seed, knobs.regionRooms, knobs.carver, knobs.braid, knobs.doorsPerEdge].join(':');
}
