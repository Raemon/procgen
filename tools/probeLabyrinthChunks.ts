import '../world/puzzles/kinds/index';
import { chunkExitsOf, openExitCount, CLOSED } from '../procgen/labyrinth/chunkExits';
import { roleOf, ROOM } from '../procgen/labyrinth/chunkRole';
import { ringOf } from '../procgen/labyrinth/chunkRing';
import { labyrinthKnobsFrom, type LabyrinthKnobs } from '../procgen/labyrinth/labyrinthKnobs';
import { hashString } from '../procgen/random/hashString';
import { mulberry32 } from '../procgen/random/mulberry32';
import { challengeForRing } from '../world/puzzles/rooms/roomDifficulty';

const GRAPH_RINGS = 8;
const HISTOGRAM_RINGS = 12;
const SEEDS = [5309, 41, 8721];

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

function glyphOf(cx: number, cy: number, knobs: LabyrinthKnobs): string {
  return roleOf(cx, cy, knobs) === ROOM ? 'R' : 'm';
}

function kindLetterOf(cx: number, cy: number, knobs: LabyrinthKnobs): string {
  if (roleOf(cx, cy, knobs) !== ROOM) return 'm';
  const rng = mulberry32(hashString(`${knobs.seed}:puzzleRoom:${cx},${cy}:kind`));
  const challenge = challengeForRing(ringOf(cx, cy), rng);
  return challenge.kind ? challenge.kind.name[0]! : '·';
}

function chunkGraphRows(knobs: LabyrinthKnobs, centre: (cx: number, cy: number) => string): string[] {
  const rows: string[] = [];
  for (let cy = -GRAPH_RINGS; cy <= GRAPH_RINGS; cy++) rows.push(...graphRowPair(cy, knobs, centre));
  return rows;
}

function graphRowPair(
  cy: number,
  knobs: LabyrinthKnobs,
  centre: (cx: number, cy: number) => string,
): string[] {
  let doors = '';
  let body = '';
  for (let cx = -GRAPH_RINGS; cx <= GRAPH_RINGS; cx++) {
    const exits = chunkExitsOf(cx, cy, knobs);
    doors += exits.north === CLOSED ? '·──' : '· ─';
    body += (exits.west === CLOSED ? '│' : ' ') + centre(cx, cy) + ' ';
  }
  return [doors + '·', body + '│'];
}

function printChunkGraph(knobs: LabyrinthKnobs, centre: (cx: number, cy: number) => string): void {
  for (const row of chunkGraphRows(knobs, centre)) console.log(row);
}

function printExitHistogram(): void {
  const counts = [0, 0, 0, 0, 0];
  for (const seed of SEEDS) tallyExits(knobsFor(seed), counts);
  console.log(`\n-- open exits per chunk, rings 0..${HISTOGRAM_RINGS}, seeds ${SEEDS.join(', ')} --`);
  counts.forEach((count, exits) => console.log(`  ${exits} exits: ${count}`));
}

function tallyExits(knobs: LabyrinthKnobs, counts: number[]): void {
  for (let cy = -HISTOGRAM_RINGS; cy <= HISTOGRAM_RINGS; cy++) {
    for (let cx = -HISTOGRAM_RINGS; cx <= HISTOGRAM_RINGS; cx++) {
      const exits = openExitCount(chunkExitsOf(cx, cy, knobs));
      counts[exits] = (counts[exits] ?? 0) + 1;
    }
  }
}

function printRoomShare(): void {
  let rooms = 0;
  let total = 0;
  for (const seed of SEEDS) {
    for (let cy = -HISTOGRAM_RINGS; cy <= HISTOGRAM_RINGS; cy++) {
      for (let cx = -HISTOGRAM_RINGS; cx <= HISTOGRAM_RINGS; cx++) {
        if (ringOf(cx, cy) <= knobsFor(seed).tutorialRings) continue;
        total += 1;
        if (roleOf(cx, cy, knobsFor(seed)) === ROOM) rooms += 1;
      }
    }
  }
  console.log(`\n-- room share beyond the tutorial rings: ${(rooms / total).toFixed(3)} --`);
}

const first = knobsFor(SEEDS[0]!);
console.log(`== chunk graph, rings 0..${GRAPH_RINGS}, seed ${SEEDS[0]} (R room, m warren; gaps in the lattice are doors) ==`);
printChunkGraph(first, (cx, cy) => glyphOf(cx, cy, first));
console.log(`\n== puzzle kind per room (first letter of the kind, · empty, m warren) ==`);
printChunkGraph(first, (cx, cy) => kindLetterOf(cx, cy, first));
printExitHistogram();
printRoomShare();
