import { fixture, type PuzzleFixture } from '../fixtures/puzzleFixture';
import { registerPuzzleKind, type FurnishContext, type FurnishedRoom } from './puzzleKind';
import { reversePullCrates, type PullableRoom } from './reversePullCrates';
import { releaseWalkingRoom, scatterPillars } from './scatterPillars';
import type { Cell } from './roomCells';

const MOST_CRATES = 3;
const MOST_PILLARS = 5;
const MOST_PULLS_PER_CRATE = 6;

registerPuzzleKind({
  name: 'sokoban',
  introducedAtRing: 3,
  teaches: 'the room itself is the mechanism, and a wrong push can cost you the room',
  furnish: furnishSokobanRoom,
});

function furnishSokobanRoom(context: FurnishContext): FurnishedRoom {
  const pillars = scatterPillars(context, pillarCount(context.level));
  const plates = placePlates(context);
  releaseWalkingRoom(context);
  const room = crateRoomStartingSolved(context, pillars, plates);
  const solution = reversePullCrates(
    room,
    context.entrances,
    pullCount(context.level) * plates.length,
    context.rng,
  );
  return {
    fixtures: [...pillars, ...plates, ...cratesAsFixtures(room)],
    opensWhen: plates.map((plate) => plate.id),
    solution,
  };
}

function placePlates(context: FurnishContext): PuzzleFixture[] {
  const plates: PuzzleFixture[] = [];
  for (let index = 0; index < crateCount(context.level); index++) {
    const cell = context.cells.takeCentreThenSpread(context.rng, context.level === 0 && index === 0);
    if (cell) plates.push(fixture(`plate${index}`, 'plate', cell));
  }
  return plates;
}

function crateRoomStartingSolved(
  context: FurnishContext,
  pillars: PuzzleFixture[],
  plates: PuzzleFixture[],
): PullableRoom {
  const crates = new Map<string, Cell>(
    plates.map((plate, index) => [`crate${index}`, { x: plate.x, y: plate.y }]),
  );
  return {
    cells: context.cells,
    pillars: new Set(pillars.map((pillar) => `${pillar.x},${pillar.y}`)),
    crates,
    player: context.entrances[0]!,
  };
}

function cratesAsFixtures(room: PullableRoom): PuzzleFixture[] {
  return [...room.crates].map(([id, cell]) => fixture(id, 'crate', cell));
}

function crateCount(level: number): number {
  return Math.min(1 + Math.floor(level / 2), MOST_CRATES);
}

function pullCount(level: number): number {
  return Math.min(1 + level, MOST_PULLS_PER_CRATE);
}

function pillarCount(level: number): number {
  return Math.max(0, Math.min(level - 1, MOST_PILLARS));
}
