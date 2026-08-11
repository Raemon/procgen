import { fixture, type PuzzleFixture } from '../fixtures/puzzleFixture';
import { registerPuzzleKind, type FurnishContext, type FurnishedRoom } from './puzzleKind';
import { climbingCount, crowdingCount, fixtureCapacity } from './roomCapacity';
import { scatterPillars } from './scatterPillars';

const KEY_SHARE = 4;
const PILLAR_SHARE = 2;

registerPuzzleKind({
  name: 'key',
  teachingOrder: 1,
  teaches: 'what opens a door can be carried, so it can be somewhere else entirely',
  furnish: furnishKeyRoom,
});

function furnishKeyRoom(context: FurnishContext): FurnishedRoom {
  const room = fixtureCapacity(context.cells);
  const pillars = scatterPillars(context, crowdingCount(context.level, 2, room / PILLAR_SHARE));
  const keys = placeKeys(context);
  return {
    fixtures: [...pillars, ...keys],
    opensWhen: keys.map((key) => key.id),
    solution: [],
  };
}

function placeKeys(context: FurnishContext): PuzzleFixture[] {
  const keys: PuzzleFixture[] = [];
  const wanted = climbingCount(context.level, 3, fixtureCapacity(context.cells) / KEY_SHARE);
  for (let index = 0; index < wanted; index++) {
    const cell = context.cells.takeCentreThenSpread(context.rng, context.level === 0);
    if (cell) keys.push(fixture(`key${index}`, 'key', cell));
  }
  return keys;
}
