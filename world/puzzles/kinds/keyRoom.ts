import { fixture, type PuzzleFixture } from '../fixtures/puzzleFixture';
import { registerPuzzleKind, type FurnishContext, type FurnishedRoom } from './puzzleKind';
import { scatterPillars } from './scatterPillars';

const MOST_KEYS = 3;
const MOST_PILLARS = 4;

registerPuzzleKind({
  name: 'key',
  introducedAtRing: 2,
  teaches: 'what opens a door can be carried, so it can be somewhere else entirely',
  furnish: furnishKeyRoom,
});

function furnishKeyRoom(context: FurnishContext): FurnishedRoom {
  const pillars = scatterPillars(context, pillarCount(context.level));
  const keys = placeKeys(context);
  return {
    fixtures: [...pillars, ...keys],
    opensWhen: keys.map((key) => key.id),
    solution: [],
  };
}

function placeKeys(context: FurnishContext): PuzzleFixture[] {
  const keys: PuzzleFixture[] = [];
  for (let index = 0; index < keyCount(context.level); index++) {
    const cell = context.cells.takeCentreThenSpread(context.rng, context.level === 0);
    if (cell) keys.push(fixture(`key${index}`, 'key', cell));
  }
  return keys;
}

function keyCount(level: number): number {
  return Math.min(1 + Math.floor(level / 3), MOST_KEYS);
}

function pillarCount(level: number): number {
  return Math.max(0, Math.min(level - 2, MOST_PILLARS));
}
