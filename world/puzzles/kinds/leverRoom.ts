import { fixture, type PuzzleFixture } from '../fixtures/puzzleFixture';
import { registerPuzzleKind, type FurnishContext, type FurnishedRoom } from './puzzleKind';
import { climbingCount, crowdingCount, fixtureCapacity } from './roomCapacity';
import { scatterPillars } from './scatterPillars';

const LEVER_SHARE = 3;
const PILLAR_SHARE = 2;

registerPuzzleKind({
  name: 'lever',
  teachingOrder: 0,
  teaches: 'a door in this world is opened by something else in the room',
  furnish: furnishLeverRoom,
});

function furnishLeverRoom(context: FurnishContext): FurnishedRoom {
  const room = fixtureCapacity(context.cells);
  const pillars = scatterPillars(context, crowdingCount(context.level, 2, room / PILLAR_SHARE));
  const levers = placeLevers(context);
  return {
    fixtures: [...pillars, ...levers],
    opensWhen: levers.map((lever) => lever.id),
    solution: [],
  };
}

function placeLevers(context: FurnishContext): PuzzleFixture[] {
  const levers: PuzzleFixture[] = [];
  const wanted = climbingCount(context.level, 2, fixtureCapacity(context.cells) / LEVER_SHARE);
  for (let index = 0; index < wanted; index++) {
    const cell = context.cells.takeCentreThenSpread(context.rng, context.level === 0);
    if (cell) levers.push(fixture(`lever${index}`, 'lever', cell));
  }
  return levers;
}
