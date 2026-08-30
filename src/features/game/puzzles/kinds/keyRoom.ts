import { roomItem, type RoomItem } from '../rooms/roomItem';
import { nothingToSolve, registerPuzzleKind, type FurnishContext, type FurnishedRoom } from './puzzleKind';
import { climbingCount, crowdingCount, fixtureCapacity } from './roomCapacity';
import { scatterPillars } from './scatterPillars';

const KEY_SHARE = 4;
const PILLAR_SHARE = 2;

registerPuzzleKind({
  name: 'key',
  teachingOrder: 1,
  teaches: 'a door can want a thing you carry, so the way through is found before it is opened',
  furnish: furnishKeyRoom,
});

function furnishKeyRoom(context: FurnishContext): FurnishedRoom {
  const room = fixtureCapacity(context.cells);
  const pillars = scatterPillars(context, crowdingCount(context.level, 2, room / PILLAR_SHARE));
  const keys = placeKeys(context);
  if (keys.length === 0) return nothingToSolve();
  return {
    fixtures: pillars,
    opensWhen: [],
    solution: [],
    items: keys,
    unlock: 'key',
  };
}

function placeKeys(context: FurnishContext): RoomItem[] {
  const keys: RoomItem[] = [];
  const wanted = climbingCount(context.level, 3, fixtureCapacity(context.cells) / KEY_SHARE);
  for (let index = 0; index < wanted; index++) {
    const cell = context.cells.takeCentreThenSpread(context.rng, context.level === 0);
    if (cell) keys.push(roomItem(`key${index}`, cell));
  }
  return keys;
}
