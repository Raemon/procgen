import '../kinds/index';
import {
  bandCells,
  eastGateBand,
  northGateBand,
  southGateBand,
  westGateBand,
  type Band,
} from '../../../procgen/nodes/puzzle/puzzleRoomCorridors';
import type { PuzzleRoomKnobs } from '../../../procgen/nodes/puzzle/puzzleRoomKnobs';
import {
  doorwayCentreOffset,
  rectBottom,
  rectRight,
  roomInteriorRect,
  roomKey,
  type RoomRect,
} from '../../../procgen/nodes/puzzle/puzzleRoomLattice';
import { roomLatticeMazeFor } from '../../../procgen/nodes/puzzle/roomLatticeMazeCache';
import type { RoomLatticeMaze } from '../../../procgen/nodes/puzzle/roomLatticeMaze';
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
  const maze = roomLatticeMazeFor(knobs);
  const entrances = entrancesOf(knobs, maze, interior, roomX, roomY);
  const furnished = challenge.kind
    ? challenge.kind.furnish({
        cells,
        level: challenge.level,
        entrances,
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
    entrance: entrances[0]!,
    fixtures: furnished.fixtures,
    gates: gatesOf(knobs, maze, roomX, roomY),
    opensWhen: furnished.opensWhen,
    solution: furnished.solution,
  };
}

function entrancesOf(
  knobs: PuzzleRoomKnobs,
  maze: RoomLatticeMaze,
  interior: RoomRect,
  roomX: number,
  roomY: number,
): { x: number; y: number }[] {
  const row = interior.y + doorwayCentreOffset(knobs);
  const column = interior.x + doorwayCentreOffset(knobs);
  const doorways = [
    { open: maze.hasEastCorridor(roomX - 1, roomY), cell: { x: interior.x, y: row } },
    { open: maze.hasEastCorridor(roomX, roomY), cell: { x: rectRight(interior), y: row } },
    { open: maze.hasSouthCorridor(roomX, roomY - 1), cell: { x: column, y: interior.y } },
    { open: maze.hasSouthCorridor(roomX, roomY), cell: { x: column, y: rectBottom(interior) } },
  ];
  const reachable = doorways.filter((doorway) => doorway.open).map((doorway) => doorway.cell);
  return reachable.length > 0 ? reachable : [{ x: interior.x, y: row }];
}

function gatesOf(
  knobs: PuzzleRoomKnobs,
  maze: RoomLatticeMaze,
  roomX: number,
  roomY: number,
): RoomGates {
  return {
    east: maze.hasEastCorridor(roomX, roomY)
      ? doorsAcross(eastGateBand(roomX, roomY, knobs), 'gateEast')
      : [],
    south: maze.hasSouthCorridor(roomX, roomY)
      ? doorsAcross(southGateBand(roomX, roomY, knobs), 'gateSouth')
      : [],
    west: maze.hasEastCorridor(roomX - 1, roomY)
      ? doorsAcross(westGateBand(roomX, roomY, knobs), 'gateWest')
      : [],
    north: maze.hasSouthCorridor(roomX, roomY - 1)
      ? doorsAcross(northGateBand(roomX, roomY, knobs), 'gateNorth')
      : [],
  };
}

function doorsAcross(band: Band, name: string) {
  return bandCells(band).map((cell, index) => fixture(`${name}${index}`, 'gate', cell));
}

function roomStream(knobs: PuzzleRoomKnobs, roomX: number, roomY: number, label: string) {
  return mulberry32(hashString(`${knobs.seed}:puzzleRoom:${roomX},${roomY}:${label}`));
}
