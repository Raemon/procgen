import {
  bandCells,
  eastGateBand,
  southGateBand,
} from '../../../procgen/nodes/puzzle/puzzleRoomCorridors';
import type { PuzzleRoomKnobs } from '../../../procgen/nodes/puzzle/puzzleRoomKnobs';
import {
  doorwayCentreOffset,
  roomInteriorRect,
  roomKey,
} from '../../../procgen/nodes/puzzle/puzzleRoomLattice';
import { hashString } from '../../../procgen/random/hashString';
import { mulberry32 } from '../../../procgen/random/mulberry32';
import { fixture } from '../fixtures/puzzleFixture';
import { nothingToSolve } from '../kinds/puzzleKind';
import { RoomCells } from '../kinds/roomCells';
import { challengeForRing, roomRing } from './roomDifficulty';
import type { PuzzleRoomLayout, RoomGates } from './puzzleRoomLayout';

export function buildPuzzleRoom(
  knobs: PuzzleRoomKnobs,
  roomX: number,
  roomY: number,
): PuzzleRoomLayout {
  const interior = roomInteriorRect(roomX, roomY, knobs);
  const challenge = challengeForRing(roomRing(roomX, roomY), roomStream(knobs, roomX, roomY, 'kind'));
  const cells = new RoomCells(interior);
  const entrance = { x: interior.x, y: interior.y + doorwayCentreOffset(knobs) };
  const furnished = challenge.kind
    ? challenge.kind.furnish({
        cells,
        level: challenge.level,
        entrance,
        rng: roomStream(knobs, roomX, roomY, 'furnish'),
      })
    : nothingToSolve();
  return {
    roomX,
    roomY,
    key: roomKey(roomX, roomY),
    interior,
    kindName: challenge.kind?.name ?? '',
    level: challenge.level,
    entrance,
    fixtures: furnished.fixtures,
    gates: gatesOf(knobs, roomX, roomY),
    opensWhen: furnished.opensWhen,
    solution: furnished.solution,
  };
}

function gatesOf(knobs: PuzzleRoomKnobs, roomX: number, roomY: number): RoomGates {
  return {
    east: bandCells(eastGateBand(roomX, roomY, knobs)).map((cell, index) =>
      fixture(`gateEast${index}`, 'gate', cell),
    ),
    south: bandCells(southGateBand(roomX, roomY, knobs)).map((cell, index) =>
      fixture(`gateSouth${index}`, 'gate', cell),
    ),
  };
}

function roomStream(knobs: PuzzleRoomKnobs, roomX: number, roomY: number, label: string) {
  return mulberry32(hashString(`${knobs.seed}:puzzleRoom:${roomX},${roomY}:${label}`));
}
