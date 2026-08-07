import { fixture, type PuzzleFixture } from '../fixtures/puzzleFixture';
import { registerPuzzleKind, type FurnishContext, type FurnishedRoom } from './puzzleKind';
import { scatterPillars } from './scatterPillars';

const MOST_LEVERS = 4;
const MOST_PILLARS = 4;

registerPuzzleKind({
  name: 'lever',
  introducedAtRing: 1,
  teaches: 'a door in this world is opened by something else in the room',
  furnish: furnishLeverRoom,
});

function furnishLeverRoom(context: FurnishContext): FurnishedRoom {
  const pillars = scatterPillars(context, pillarCount(context.level));
  const levers = placeLevers(context);
  return {
    fixtures: [...pillars, ...levers],
    opensWhen: levers.map((lever) => lever.id),
    solution: [],
  };
}

function placeLevers(context: FurnishContext): PuzzleFixture[] {
  const levers: PuzzleFixture[] = [];
  for (let index = 0; index < leverCount(context.level); index++) {
    const cell = context.cells.takeCentreThenSpread(context.rng, context.level === 0);
    if (cell) levers.push(fixture(`lever${index}`, 'lever', cell));
  }
  return levers;
}

function leverCount(level: number): number {
  return Math.min(1 + Math.floor(level / 2), MOST_LEVERS);
}

function pillarCount(level: number): number {
  return Math.max(0, Math.min(level - 2, MOST_PILLARS));
}
