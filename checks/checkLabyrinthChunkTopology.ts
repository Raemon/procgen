import { readFileSync } from 'node:fs';
import { chunkExitsOf, openExitCount, seamIsOpen } from '../procgen/labyrinth/chunkExits';
import { ringOf } from '../procgen/labyrinth/chunkRing';
import { roleOf, ROOM } from '../procgen/labyrinth/chunkRole';
import { labyrinthKnobsFrom, type LabyrinthKnobs } from '../procgen/labyrinth/labyrinthKnobs';
import { buildPuzzleRoom } from '../world/puzzles/rooms/buildPuzzleRoom';
import type { PuzzleRoomLayout } from '../world/puzzles/rooms/puzzleRoomLayout';
import { forwardSolutionWorks } from '../world/puzzles/kinds/forwardSolutionWorks';
import { canWalkBetween, type CrateFloorSpace } from '../world/puzzles/kinds/crateFloorSpace';
import { cellKey } from '../world/puzzles/kinds/cellKey';
import { RoomCells } from '../world/puzzles/kinds/roomCells';
import { roomIsSolved } from '../world/puzzles/state/fixtureSignals';
import { PuzzleState } from '../world/puzzles/state/puzzleState';
import type { CheckReporter } from './checkReporter';
import { endingIn, filesUnder } from './filesUnder';
import { reportOffenders } from './reportOffenders';

const SEEDS = [5309, 41, 8721];
const CHECKED_RINGS = 8;

function knobsFor(seed: number): LabyrinthKnobs {
  return labyrinthKnobsFrom(seed, {
    roomFraction: 0.75,
    tutorialRings: 3,
    corridor: 1,
    wall: 1,
    braid: 0.15,
    carver: 0,
    doorJitter: 0.5,
    wallTile: 17,
    floorTile: 15,
  });
}

function everyChunkWithin(rings: number): Array<[number, number]> {
  const chunks: Array<[number, number]> = [];
  for (let cy = -rings; cy <= rings; cy++) {
    for (let cx = -rings; cx <= rings; cx++) chunks.push([cx, cy]);
  }
  return chunks;
}

function seamsAgree(knobs: LabyrinthKnobs): boolean {
  return everyChunkWithin(CHECKED_RINGS).every(([cx, cy]) => {
    const exits = chunkExitsOf(cx, cy, knobs);
    return (
      exits.east === chunkExitsOf(cx + 1, cy, knobs).west &&
      exits.south === chunkExitsOf(cx, cy + 1, knobs).north
    );
  });
}

function exitCountsStayInRange(knobs: LabyrinthKnobs): boolean {
  return everyChunkWithin(CHECKED_RINGS).every(([cx, cy]) => {
    const count = openExitCount(chunkExitsOf(cx, cy, knobs));
    return count >= 1 && count <= 4;
  });
}

function chunkDistancesFromOrigin(knobs: LabyrinthKnobs, rings: number): Map<string, number> {
  const distances = new Map<string, number>([['0,0', 0]]);
  const queue: Array<[number, number]> = [[0, 0]];
  for (let read = 0; read < queue.length; read++) {
    const [x, y] = queue[read]!;
    for (const [nx, ny] of openNeighbours(x, y, knobs, rings)) {
      if (distances.has(`${nx},${ny}`)) continue;
      distances.set(`${nx},${ny}`, distances.get(`${x},${y}`)! + 1);
      queue.push([nx, ny]);
    }
  }
  return distances;
}

function openNeighbours(
  x: number,
  y: number,
  knobs: LabyrinthKnobs,
  rings: number,
): Array<[number, number]> {
  const steps: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  return steps
    .map(([dx, dy]): [number, number] => [x + dx, y + dy])
    .filter(([nx, ny]) => ringOf(nx, ny) <= rings && seamIsOpen(x, y, nx, ny, knobs));
}

function shortestPathToRing(knobs: LabyrinthKnobs, ring: number): number {
  const distances = chunkDistancesFromOrigin(knobs, ring + 2);
  let shortest = Infinity;
  for (const [key, distance] of distances) {
    const [cx, cy] = key.split(',').map(Number) as [number, number];
    if (ringOf(cx, cy) === ring) shortest = Math.min(shortest, distance);
  }
  return shortest;
}

function roomShare(knobs: LabyrinthKnobs, fromRing: number, toRing: number): number {
  const beyond = everyChunkWithin(toRing).filter(
    ([cx, cy]) => ringOf(cx, cy) >= fromRing,
  );
  const rooms = beyond.filter(([cx, cy]) => roleOf(cx, cy, knobs) === ROOM).length;
  return rooms / beyond.length;
}

function tutorialAllRooms(knobs: LabyrinthKnobs): boolean {
  return everyChunkWithin(knobs.tutorialRings).every(
    ([cx, cy]) => roleOf(cx, cy, knobs) === ROOM,
  );
}

function crateSpaceOf(layout: PuzzleRoomLayout): CrateFloorSpace {
  const pillars = layout.fixtures.filter((f) => f.kind === 'pillar');
  const crates = layout.fixtures.filter((f) => f.kind === 'crate');
  return {
    cells: new RoomCells(layout.interior),
    pillars: new Set(pillars.map(cellKey)),
    crates: new Map(crates.map((crate) => [crate.id, { x: crate.x, y: crate.y }])),
  };
}

function furnishedRoomIsBeatable(layout: PuzzleRoomLayout): boolean {
  if (layout.kindName === '') return true;
  if (layout.kindName !== 'sokoban') return everyTriggerCanBeWalkedTo(layout);
  if (layout.solution.length === 0) return layout.opensWhen.length === 0;
  return forwardSolutionWorks(crateSpaceOf(layout), layout.entrance, layout.solution);
}

function everyTriggerCanBeWalkedTo(layout: PuzzleRoomLayout): boolean {
  if (layout.opensWhen.length === 0) return false;
  const space = crateSpaceOf(layout);
  return layout.opensWhen.every((id) => triggerIsWithinReach(layout, space, id));
}

function triggerIsWithinReach(
  layout: PuzzleRoomLayout,
  space: CrateFloorSpace,
  id: string,
): boolean {
  const trigger = layout.fixtures.find((candidate) => candidate.id === id);
  return trigger !== undefined && canWalkBetween(space, layout.entrance, trigger);
}

function everyRoomBeatable(knobs: LabyrinthKnobs, rings: number): boolean {
  return everyChunkWithin(rings)
    .filter(([cx, cy]) => ringOf(cx, cy) >= 1 && roleOf(cx, cy, knobs) === ROOM)
    .every(([cx, cy]) => furnishedRoomIsBeatable(buildPuzzleRoom(knobs, cx, cy)));
}

function firstWarrenChunk(knobs: LabyrinthKnobs): [number, number] | null {
  return (
    everyChunkWithin(CHECKED_RINGS).find(([cx, cy]) => roleOf(cx, cy, knobs) !== ROOM) ?? null
  );
}

function warrenCountsAsSolved(knobs: LabyrinthKnobs): boolean {
  const warren = firstWarrenChunk(knobs);
  if (!warren) return false;
  return roomIsSolved(buildPuzzleRoom(knobs, warren[0], warren[1]), new PuzzleState());
}

function worldFilesImportingNodes(): string[] {
  return filesUnder('world', endingIn('.ts', '.tsx')).filter((path) =>
    /from '[^']*procgen\/nodes\//.test(readFileSync(path, 'utf8')),
  );
}

export function checkLabyrinthChunkTopology(check: CheckReporter): void {
  const knobs = SEEDS.map(knobsFor);
  check(
    'neighbour chunks compute identical seam state for every seam in rings 0..8 across 3 seeds',
    knobs.every(seamsAgree),
  );
  check(
    'every chunk in rings 0..8 has between 1 and 4 open seams, across 3 seeds',
    knobs.every(exitCountsStayInRange),
  );
  check(
    'the chunk graph from the origin reaches every chunk of rings 0..8',
    knobs.every((k) => chunkDistancesFromOrigin(k, CHECKED_RINGS).size === 17 * 17),
  );
  check(
    'the spiral winds: the shortest chunk path from origin to ring 8 is at least twice the ring number',
    knobs.every((k) => shortestPathToRing(k, 8) >= 16),
  );
  check(
    'rings up to tutorialRings are all rooms, and the room share over rings 4..12 sits within 10 points of the knob',
    knobs.every((k) => tutorialAllRooms(k) && Math.abs(roomShare(k, 4, 12) - k.roomFraction) <= 0.1),
  );
  check(
    'every furnished room in rings 1..6 is beatable, and sokoban solutions replay forward from the entrance',
    knobs.slice(0, 2).every((k) => everyRoomBeatable(k, 6)),
  );
  check(
    'a warren chunk is born solved, so its side of every doorway never locks',
    knobs.every(warrenCountsAsSolved),
  );
  const strays = worldFilesImportingNodes();
  reportOffenders('world files importing procgen/nodes', strays);
  check(
    'the world layer never imports from procgen/nodes, so play code depends on pure labyrinth geometry only',
    strays.length === 0,
  );
}
